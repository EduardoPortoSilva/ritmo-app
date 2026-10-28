import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase } from '../../src/model';
import { doseModelExample, recordDose } from '../../src/substances';

test.use({ timezoneId: 'UTC' });
function fixture() {
  return {
    ...emptyDatabase(),
    substances: [
      { id: 'a', name: 'Substância A', unit: 'mg', model: doseModelExample(), doses: [] },
    ],
    supplements: [
      {
        id: 'sup',
        name: 'Suplemento diário',
        note: '',
        createdAt: '2026-10-01T12:00:00Z',
        takenOn: ['2026-10-24', '2026-10-25'],
        takenAt: { '2026-10-25': '2026-10-25T09:41:00Z' },
      },
    ],
  };
}
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));
async function open(page: Page, database = fixture()) {
  await page.clock.setFixedTime(new Date('2026-10-27T14:23:45Z'));
  await page.addInitScript((database) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(database));
  }, database);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
}
async function configure(page: Page) {
  await page
    .getByRole('button', { name: 'Editar suplemento Suplemento diário', exact: true })
    .click();
  await page.getByRole('checkbox', { name: 'Registrar dose de Substância A', exact: true }).click();
  await page.getByLabel('Dose de Substância A (mg)', { exact: true }).fill('100,5');
}

test('dose configurada usa horário exato do clique, persiste e desfaz sem apagar histórico antigo', async ({
  page,
}) => {
  const database = fixture();
  await open(page, database);
  await configure(page);
  await page.getByRole('button', { name: 'Salvar suplemento', exact: true }).click();
  expect((await stored(page)).substances[0].doses).toHaveLength(0);
  await page.getByRole('checkbox', { name: 'Tomei Suplemento diário hoje', exact: true }).click();
  await expect(page.getByText('Confirmado às 14:23', { exact: true })).toBeVisible();
  let saved = await stored(page);
  expect(saved.supplements[0].takenAt['2026-10-27']).toBe('2026-10-27T14:23:45.000Z');
  expect(saved.substances[0].doses[0]).toMatchObject({
    at: '2026-10-27T14:23:45.000Z',
    amount: 100.5,
    supplement: { estimatedTime: false },
  });
  await page.reload();
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await expect(page.getByText('Confirmado às 14:23', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Tomei Suplemento diário hoje', exact: true }).click();
  saved = await stored(page);
  expect(saved.substances[0].doses).toHaveLength(0);
  expect(saved.supplements[0].takenOn).toEqual(database.supplements[0].takenOn);
  expect(saved.supplements[0].takenAt).toEqual(database.supplements[0].takenAt);
});

test('vínculo retroativo pede hora média, mostra prévia sem modificar dados e importa só após confirmar', async ({
  page,
}) => {
  const database = fixture();
  await open(page, database);
  await configure(page);
  await page.getByRole('button', { name: 'Conferir histórico de ingestões', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('hora média');
  await page.getByLabel('Hora média de ingestão (HH:mm)', { exact: true }).fill('08:30');
  await page.getByRole('button', { name: 'Conferir histórico de ingestões', exact: true }).click();
  const preview = page.getByTestId('supplement-history-preview');
  await expect(preview).toContainText('24/10/2026, 08:30');
  await expect(preview).toContainText('25/10/2026, 09:41');
  await expect(preview).toContainText('hora média');
  await expect(preview).toContainText('horário da confirmação');
  expect((await stored(page)).substances[0].doses).toHaveLength(0);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await preview.screenshot({
      path: `test-results/suplemento-previa-historico-${width}.png`,
      animations: 'disabled',
    });
  }
  await preview.getByRole('button', { name: 'Voltar à edição', exact: true }).click();
  expect((await stored(page)).substances[0].doses).toHaveLength(0);
  await page.getByRole('button', { name: 'Conferir histórico de ingestões', exact: true }).click();
  await page
    .getByRole('button', { name: 'Salvar vínculo e importar 2 doses', exact: true })
    .click();
  const saved = await stored(page);
  expect(saved.substances[0].doses.map((d: { at: string }) => d.at)).toEqual([
    '2026-10-24T08:30:00.000Z',
    '2026-10-25T09:41:00Z',
  ]);
  expect(saved.supplements[0].takenAt).toEqual(database.supplements[0].takenAt);
  await page.getByRole('button', { name: 'Acompanhar substâncias', exact: true }).click();
  await page.getByRole('button', { name: 'Substância A', exact: true }).click();
  await expect(page.getByText(/horário médio informado para o histórico/)).toBeVisible();
});

test('ingestão existente no dia é ignorada e nova conferência não duplica as importadas', async ({
  page,
}) => {
  const database = fixture();
  const substance = recordDose(
    database.substances[0],
    { id: 'manual', amount: 25, at: '2026-10-24T20:00:00Z' },
    Date.parse('2026-10-27T14:00:00Z'),
  );
  await open(page, { ...database, substances: [substance] } as any);
  await configure(page);
  await page.getByLabel('Hora média de ingestão (HH:mm)', { exact: true }).fill('08:00');
  await page.getByRole('button', { name: 'Conferir histórico de ingestões', exact: true }).click();
  await expect(page.getByTestId('supplement-history-preview')).toContainText(
    'Itens com ingestão no dia: 1',
  );
  await page.getByRole('button', { name: 'Salvar vínculo e importar 1 dose', exact: true }).click();
  expect((await stored(page)).substances[0].doses).toHaveLength(2);
  await page
    .getByRole('button', { name: 'Editar suplemento Suplemento diário', exact: true })
    .click();
  await page.getByLabel('Hora média de ingestão (HH:mm)', { exact: true }).fill('08:00');
  await page.getByRole('button', { name: 'Conferir histórico de ingestões', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Salvar vínculo e importar 0 doses', exact: true }),
  ).toBeDisabled();
  expect((await stored(page)).substances[0].doses[0].amount).toBe(25);
});

test('dose editada participa do aviso de saída e não é salva ao descartar', async ({ page }) => {
  await open(page);
  await configure(page);
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  expect((await stored(page)).supplements[0].substanceDoses).toBeUndefined();
});
