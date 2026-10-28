import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase } from '../../src/model';
import { doseModelExample, type Substance } from '../../src/substances';
test.use({ timezoneId: 'UTC' });
const items = (): Substance[] =>
  ['A', 'B'].map((letter, index) => ({
    id: letter,
    name: `Componente ${letter}`,
    unit: index ? 'g' : 'mg',
    model: {
      ...doseModelExample(),
      formula: {
        expression: 'd * 0.5^(t/h)',
        parameters: {},
        reference: 'Modelo matemático de teste',
      },
      halfLifeHours: 2,
    },
    doses: [],
  }));
async function open(page: Page) {
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await page.getByRole('button', { name: 'Acompanhar substâncias', exact: true }).click();
}
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));

test('blend salvo registra todas as quantidades no mesmo horário, preserva composição antiga e permite desfazer junto', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-19T15:00:00Z'));
  await page.addInitScript(
    (db) => {
      if (!localStorage.getItem('@ritmo/database/v1'))
        localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
    },
    { ...emptyDatabase(), substances: items() },
  );
  await page.goto('/');
  await open(page);
  await page.getByRole('button', { name: 'Novo blend', exact: true }).click();
  await page.getByLabel('Nome do blend', { exact: true }).fill('Mix de teste');
  for (const [letter, amount, unit] of [
    ['A', '100', 'mg'],
    ['B', '0,05', 'g'],
  ]) {
    await page
      .getByRole('checkbox', { name: `Incluir Componente ${letter} no blend`, exact: true })
      .click();
    await page
      .getByLabel(`Quantidade de Componente ${letter} (${unit}) por porção`, { exact: true })
      .fill(amount);
  }
  await page.getByRole('button', { name: 'Salvar e registrar blend', exact: true }).click();
  await page.getByLabel('Porções do blend', { exact: true }).fill('2');
  await page.getByLabel('Horário da ingestão (HH:mm)', { exact: true }).fill('14:00');
  await expect(page.getByTestId('blend-intake-preview')).toContainText('Componente A · 200 mg');
  await expect(page.getByTestId('blend-intake-preview')).toContainText('Componente B · 0,1 g');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .getByLabel('Ingestão do blend · Mix de teste', { exact: true })
      .screenshot({ path: `test-results/ingestao-blend-${width}.png`, animations: 'disabled' });
  }
  await page.getByRole('button', { name: 'Registrar ingestão do blend', exact: true }).click();
  await expect(page.getByText(/Blend Mix de teste · 2/)).toBeVisible();
  let db = await stored(page);
  expect(db.substances[0].doses[0].amount).toBe(200);
  expect(db.substances[1].doses[0].amount).toBe(0.1);
  expect(db.substances[0].doses[0].at).toBe('2026-10-19T14:00:00.000Z');
  expect(db.substances[0].doses[0].at).toBe(db.substances[1].doses[0].at);
  const registered = db.substances.map((s: Substance) => s.doses);
  await page.getByRole('button', { name: 'Editar blend Mix de teste', exact: true }).click();
  await page.getByLabel('Quantidade de Componente A (mg) por porção', { exact: true }).fill('300');
  await page.getByRole('button', { name: 'Salvar composição do blend', exact: true }).click();
  expect((await stored(page)).substances.map((s: Substance) => s.doses)).toEqual(registered);
  await page.reload();
  await open(page);
  await expect(page.getByText(/Blend Mix de teste · 2/)).toBeVisible();
  await page.getByRole('button', { name: 'Excluir blend Mix de teste', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar exclusão do blend', exact: true }).click();
  expect((await stored(page)).substances.map((s: Substance) => s.doses)).toEqual(registered);
  await page
    .getByRole('button', { name: 'Excluir ingestão do blend Mix de teste', exact: true })
    .click();
  await expect(
    page.getByText(
      'A ingestão inteira do blend será excluída de todas as substâncias. As projeções e residuais seguintes serão recalculados.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  db = await stored(page);
  expect(db.substances.every((s: Substance) => s.doses.length === 0)).toBe(true);
  expect(db.substanceBlends).toEqual([]);
});

test('erro no modelo de um componente cancela a ingestão inteira do blend', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-19T15:00:00Z'));
  const substances = items();
  substances[1].model.formula.expression = '1/0';
  const blend = {
    id: 'mix',
    name: 'Mistura',
    components: [
      { substanceId: 'A', unit: 'mg', amount: 100 },
      { substanceId: 'B', unit: 'g', amount: 0.1 },
    ],
  };
  await page.addInitScript((db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)), {
    ...emptyDatabase(),
    substances,
    substanceBlends: [blend],
  });
  await page.goto('/');
  await open(page);
  await page.getByRole('button', { name: 'Registrar blend Mistura', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar ingestão do blend', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('inválido');
  expect((await stored(page)).substances).toEqual(substances);
});
