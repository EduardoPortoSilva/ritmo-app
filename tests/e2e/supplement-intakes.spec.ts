import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase } from '../../src/model';
import { doseModelExample } from '../../src/substances';
test.use({ timezoneId: 'UTC' });
const fixture = () => ({
  ...emptyDatabase(),
  substances: ['A', 'B'].map((id) => ({
    id,
    name: `Componente ${id}`,
    unit: 'mg',
    model: doseModelExample(),
    doses: [],
  })),
  substanceBlends: [
    {
      id: 'mix',
      name: 'Mistura diária',
      components: ['A', 'B'].map((substanceId) => ({ substanceId, amount: 10, unit: 'mg' })),
    },
  ],
  supplements: [
    { id: 'produto', name: 'Pré-treino', note: '', createdAt: '2026-10-18T12:00:00Z', takenOn: [] },
    {
      id: 'b',
      name: 'Suplemento B',
      note: '',
      createdAt: '2026-10-18T12:00:00Z',
      takenOn: [],
      substanceIds: ['B'],
    },
    {
      id: 'blend',
      name: 'Mix diário',
      note: '',
      createdAt: '2026-10-18T12:00:00Z',
      takenOn: [],
      blendIds: ['mix'],
    },
    { id: 'manual', name: 'Manual', note: '', createdAt: '2026-10-18T12:00:00Z', takenOn: [] },
  ],
});
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));
async function start(page: Page, db = fixture()) {
  await page.clock.setFixedTime(new Date('2026-10-19T15:00:00Z'));
  await page.addInitScript((db) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
  }, db);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
}

test('vínculos editáveis N:N marcam pela ingestão de blend ou substância na data certa e persistem', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: 'Editar suplemento Pré-treino', exact: true }).click();
  await page.getByRole('button', { name: 'Vincular substâncias e blends', exact: true }).click();
  await page
    .getByRole('checkbox', { name: 'Vincular substância Componente A', exact: true })
    .click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  expect((await stored(page)).supplements[0].substanceIds).toBeUndefined();
  await page.getByRole('button', { name: 'Editar suplemento Pré-treino', exact: true }).click();
  await page.getByRole('button', { name: 'Vincular substâncias e blends', exact: true }).click();
  await page
    .getByRole('checkbox', { name: 'Vincular substância Componente A', exact: true })
    .click();
  await page.getByRole('checkbox', { name: 'Vincular blend Mistura diária', exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByTestId('supplement-links').screenshot({
      path: `test-results/vinculos-suplemento-${width}.png`,
      animations: 'disabled',
    });
  }
  await page.getByRole('button', { name: 'Recolher vínculos', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Vincular substância Componente A', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Salvar suplemento', exact: true }).click();
  const edited = (await stored(page)).supplements[0];
  expect(edited.substanceIds).toEqual(['A']);
  expect(edited.blendIds).toEqual(['mix']);
  expect(edited.takenOn).toEqual([]);
  await page.getByRole('button', { name: 'Acompanhar substâncias', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar blend Mistura diária', exact: true }).click();
  await expect(page.getByTestId('intake-supplements')).toContainText(
    'Pré-treino · Suplemento B · Mix diário',
  );
  expect((await stored(page)).supplements.every((s: any) => !s.takenOn.length)).toBe(true);
  await page.getByLabel('Data da ingestão (AAAA-MM-DD)', { exact: true }).fill('2026-10-18');
  await page.getByRole('button', { name: 'Registrar ingestão do blend', exact: true }).click();
  expect((await stored(page)).supplements.map((s: any) => s.takenOn)).toEqual([
    ['2026-10-18'],
    ['2026-10-18'],
    ['2026-10-18'],
    [],
  ]);
  await page.reload();
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Pré-treino hoje', exact: true }),
  ).not.toBeChecked();
  await page.getByRole('button', { name: 'Acompanhar substâncias', exact: true }).click();
  await page
    .getByRole('button', { name: 'Registrar ingestão de Componente A', exact: true })
    .click();
  await expect(page.getByTestId('intake-supplements')).toContainText('Pré-treino');
  await expect(page.getByTestId('intake-supplements')).not.toContainText('Mix diário');
  await page.getByLabel('Quantidade (mg)', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Salvar ingestão', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Pré-treino hoje', exact: true }),
  ).toBeChecked();
  const doses = (await stored(page)).substances;
  await page.getByRole('checkbox', { name: 'Tomei Manual hoje', exact: true }).click();
  expect((await stored(page)).substances).toEqual(doses);
  await page.getByRole('checkbox', { name: 'Tomei Pré-treino hoje', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Pré-treino hoje', exact: true }),
  ).not.toBeChecked();
  expect((await stored(page)).supplements[0].takenOn).toEqual(['2026-10-18']);
});

test('falha em componente do blend não marca suplementos nem salva dose parcial', async ({
  page,
}) => {
  const db = fixture();
  db.substances[1].model.formula.expression = '1/0';
  await start(page, db);
  await page.getByRole('button', { name: 'Acompanhar substâncias', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar blend Mistura diária', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar ingestão do blend', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('inválido');
  expect((await stored(page)).substances).toEqual(db.substances);
  expect((await stored(page)).supplements).toEqual(db.supplements);
});
