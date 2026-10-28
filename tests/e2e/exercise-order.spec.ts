import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase, newExercise, newRoutine, startWorkout } from '../../src/model';

function fixture() {
  const r = newRoutine();
  r.name = 'Trocas de ordem';
  r.exercises = ['Supino', 'Remada', 'Leg press'].map((name) => ({
    ...newExercise(),
    name,
    reps: ['12', '12'],
    rests: ['0', '0'],
  }));
  const active = startWorkout(r);
  active.exercises.forEach((e) => e.sets.forEach((s) => (s.weight = '20')));
  return { ...emptyDatabase(), routines: [r], active };
}
async function open(page: Page, db: ReturnType<typeof fixture>) {
  await page.addInitScript((db) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
  }, db);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
}
const set = (page: Page, name: string, index: number) =>
  page.getByRole('checkbox', { name: `Concluir ${name} série ${index}`, exact: true });
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));

test('confirma dois pares, retoma pergunta, preserva cadastro e avisa cada exercício no próximo treino', async ({
  page,
}) => {
  const db = fixture();
  await open(page, db);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await set(page, 'Remada', 1).click();
  await expect(page.getByTestId('exercise-order-confirmation')).toHaveCount(0);
  await set(page, 'Remada', 2).click(); // advances to Leg press
  await set(page, 'Leg press', 1).click();
  await set(page, 'Leg press', 2).click();
  await page.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
  await set(page, 'Supino', 1).click();
  const confirmation = page.getByTestId('exercise-order-confirmation');
  await expect(confirmation).toContainText('Remada → Supino');
  await expect(confirmation).not.toContainText('Leg press → Supino');
  await expect.poll(async () => (await stored(page)).active.orderChecks.length).toBe(2);
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(confirmation).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  await confirmation.screenshot({
    path: 'test-results/ordem-confirmacao-320.png',
    animations: 'disabled',
  });
  await confirmation.getByRole('button', { name: 'Sim, a ordem mudou', exact: true }).click();
  await expect(confirmation).toContainText('Leg press → Supino');
  await confirmation.getByRole('button', { name: 'Sim, a ordem mudou', exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(page.getByTestId('exercise-order-status')).toHaveCount(2);
  await set(page, 'Supino', 2).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page
    .getByRole('button', { name: /^Ver treino Trocas de ordem/ })
    .first()
    .click();
  await expect(page.getByTestId('exercise-order-status')).toHaveCount(4); // A:2, B:1, C:1
  await page
    .getByRole('button', { name: 'Ordem alterada: Supino e Remada', exact: true })
    .first()
    .click();
  await expect(page.getByTestId('exercise-order-explanation')).toContainText('Remada → Supino');
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  const explanation = page.getByTestId('exercise-order-explanation');
  await expect(explanation).toContainText('Remada → Supino');
  await expect(explanation).toContainText('Leg press → Supino');
  await explanation.screenshot({
    path: 'test-results/ordem-proximo-treino-320.png',
    animations: 'disabled',
  });
  await explanation.getByRole('button', { name: 'Entendi', exact: true }).click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const statuses = page.getByTestId('exercise-order-status');
    await expect(statuses).toHaveCount(2);
    const a = (await statuses.nth(0).boundingBox())!;
    const b = (await statuses.nth(1).boundingBox())!;
    expect(a.y).toBeCloseTo(b.y, 1);
    expect(a.x + a.width).toBeLessThanOrEqual(b.x);
    await page
      .getByTestId('exercise-feedback-status')
      .screenshot({ path: `test-results/ordem-simbolos-${width}.png` });
  }
  const before = (await stored(page)).active;
  await page.getByRole('button', { name: 'Ordem alterada: Supino e Remada', exact: true }).click();
  await expect(explanation).toContainText('Remada → Supino');
  await expect(explanation).not.toContainText('Leg press → Supino');
  await explanation.getByRole('button', { name: 'Fechar explicação', exact: true }).click();
  expect((await stored(page)).active).toEqual(before);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(explanation).toContainText('Remada → Supino');
  await explanation.getByRole('button', { name: 'Entendi', exact: true }).click();
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(explanation).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(explanation).toHaveCount(0);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(explanation).toHaveCount(0);
  const final = await stored(page);
  expect(final.routines).toEqual(db.routines);
  expect(final.workouts[0].orderChecks.every((c: { confirmed: boolean }) => c.confirmed)).toBe(
    true,
  );
});

test('campos preenchidos ou B parcialmente concluído não bastam; concluir série posterior de A não pergunta', async ({
  page,
}) => {
  const db = fixture();
  db.active.exercises[1].sets[0].done = true;
  await open(page, db);
  await set(page, 'Supino', 1).click();
  await expect(page.getByTestId('exercise-order-confirmation')).toHaveCount(0);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await set(page, 'Remada', 2).click();
  await page.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
  await set(page, 'Supino', 2).click();
  await expect(page.getByTestId('exercise-order-confirmation')).toHaveCount(0);
  expect((await stored(page)).active.orderChecks).toBeUndefined();
});

test('recusar a inversão persiste e não repete pergunta ao corrigir a primeira série', async ({
  page,
}) => {
  const db = fixture();
  db.active.exercises[1].sets.forEach((s) => (s.done = true));
  await open(page, db);
  await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('');
  await set(page, 'Supino', 1).click();
  await expect(page.getByTestId('exercise-order-confirmation')).toHaveCount(0);
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('20');
  await set(page, 'Supino', 1).click();
  await page.getByRole('button', { name: 'Não, só registrei depois', exact: true }).click();
  await expect.poll(async () => (await stored(page)).active.orderChecks[0].confirmed).toBe(false);
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await set(page, 'Supino', 1).click(); // undo
  await set(page, 'Supino', 1).click(); // redo
  await expect(page.getByTestId('exercise-order-confirmation')).toHaveCount(0);
  await expect(page.getByTestId('exercise-order-status')).toHaveCount(0);
});

test('confirmação funciona com uma série, avanço automático e filtro de concluídos', async ({
  page,
}) => {
  const db = fixture();
  db.active.exercises[0].sets = [db.active.exercises[0].sets[0]];
  db.active.exercises[1].sets.forEach((s) => (s.done = true));
  await open(page, db);
  await page.getByRole('checkbox', { name: 'Ocultar exercícios concluídos', exact: true }).click();
  await set(page, 'Supino', 1).click();
  await expect(page.getByTestId('exercise-order-confirmation')).toContainText('Remada → Supino');
  await page.getByRole('button', { name: 'Sim, a ordem mudou', exact: true }).click();
  await expect(page.getByText('Exercício 3 de 3', { exact: true })).toBeVisible();
  expect((await stored(page)).active.orderChecks[0].confirmed).toBe(true);
});
