import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase, newExercise, newRoutine, startWorkout } from '../../src/model';

function fixture(count = 2) {
  const routine = newRoutine();
  routine.name = 'Treino automático';
  routine.exercises = Array.from({ length: count }, (_, index) => ({
    ...newExercise(),
    name: ['Supino', 'Remada', 'Leg press'][index],
    rests: ['2', '2', '2'],
  }));
  const active = startWorkout(routine);
  active.exercises.forEach((exercise) => exercise.sets.forEach((set) => (set.weight = '20')));
  return { ...emptyDatabase(), routines: [routine], workouts: [], active };
}
async function open(page: Page, database: ReturnType<typeof fixture>) {
  await page.addInitScript((db) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
  }, database);
  await page.goto('/');
  await expect(page.getByTestId('app-brand-header')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByTestId('app-brand-header')).toHaveCount(0);
}
const done = (page: Page, exercise: string, series: number) =>
  page.getByRole('checkbox', { name: `Concluir ${exercise} série ${series}`, exact: true });
async function stored(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));
}

test('conclusão válida inicia descanso; pausa não marca e reinício após término marca só a próxima série', async ({
  page,
}) => {
  await page.clock.install();
  const database = fixture();
  database.active.exercises[0].sets[0].weight = '';
  database.active.exercises[0].sets[1].rest = '0';
  await open(page, database);
  const firstId = database.active.exercises[0].sets[0].id;
  await done(page, 'Supino', 1).click();
  await expect(page.getByText('Confira a série', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Entendi', exact: true }).click();
  await expect(page.getByTestId(/^rest-remaining-/)).toHaveCount(0);
  await expect(done(page, 'Supino', 1)).not.toBeChecked();
  await page.getByRole('textbox', { name: 'Supino série 1 carga em kg', exact: true }).fill('20');
  await done(page, 'Supino', 1).click();
  await expect(
    page.getByRole('button', { name: 'Pausar descanso de Supino série 1', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Pausar descanso de Supino série 1', exact: true })
    .click();
  const paused = await page.getByTestId(`rest-remaining-${firstId}`).textContent();
  await page.clock.fastForward(10_000);
  await expect(page.getByTestId(`rest-remaining-${firstId}`)).toHaveText(paused!);
  expect((await stored(page)).active.exercises[0].sets[1].longRest).toBeUndefined();
  await page
    .getByRole('button', { name: 'Retomar descanso de Supino série 1', exact: true })
    .click();
  await page.clock.fastForward(2000);
  await expect(page.getByText('Descanso concluído', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Reiniciar descanso de Supino série 1', exact: true })
    .click();
  await expect
    .poll(async () => (await stored(page)).active.exercises[0].sets[1].longRest)
    .toBe(true);
  const active = (await stored(page)).active;
  expect(active.exercises[0].sets[0].longRest).toBeUndefined();
  expect(active.exercises[0].sets[2].longRest).toBeUndefined();
  expect(active.exercises[1].sets.every((set: { longRest?: boolean }) => !set.longRest)).toBe(true);
  await done(page, 'Supino', 2).click();
  await expect(page.getByTestId(/^rest-remaining-/)).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByTestId('current-set-execution')).toHaveAttribute(
    'aria-label',
    'Nesta série: Descanso longo',
  );
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByTestId('app-brand-header')).toBeVisible();
});

test('fim do exercício avança com descanso, último exercício encerra sem descanso nem salto', async ({
  page,
}) => {
  await page.clock.install();
  const database = fixture();
  await open(page, database);
  // Concluir a última linha antes das outras não pode pular séries pendentes.
  await done(page, 'Supino', 3).click();
  await expect(page.getByText('Exercício 1 de 2', { exact: true })).toBeVisible();
  await done(page, 'Supino', 1).click();
  await done(page, 'Supino', 2).click();
  await expect(page.getByText('Exercício 2 de 2', { exact: true })).toBeVisible();
  const notice = page.getByTestId('current-set-card');
  await expect(notice).toContainText('Remada');
  await expect(notice).toContainText('Série atual · 1');
  await notice.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
  await expect(page.getByText('Exercício 2 de 2', { exact: true })).toBeVisible();
  await expect(notice.getByRole('button', { name: 'Pausar descanso', exact: true })).toBeVisible();
  await done(page, 'Remada', 1).click();
  await expect(
    page.getByRole('button', { name: 'Pausar descanso de Remada série 1', exact: true }),
  ).toBeVisible();
  await done(page, 'Remada', 2).click();
  await done(page, 'Remada', 3).click();
  await expect(page.getByText('Exercício 2 de 2', { exact: true })).toBeVisible();
  await expect(page.getByTestId(/^rest-remaining-/)).toHaveCount(0);
  await expect(page.getByTestId('current-set-card')).toContainText('Séries concluídas');
  await expect(done(page, 'Remada', 3)).toBeChecked();
  await expect(page.getByRole('button', { name: 'Finalizar treino', exact: true })).toBeEnabled();
});

test('reiniciar descanso da última série não marca o exercício seguinte', async ({ page }) => {
  await page.clock.install();
  const database = fixture();
  await open(page, database);
  await page
    .getByRole('button', { name: 'Iniciar descanso de Supino série 3', exact: true })
    .click();
  await page.clock.fastForward(2000);
  await page
    .getByRole('button', { name: 'Reiniciar descanso de Supino série 3', exact: true })
    .click();
  expect((await stored(page)).active).toEqual(database.active);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByTestId('current-set-execution')).toHaveCount(0);
});

test('ocultar concluídos pula páginas sem apagar dados, retorna à série pendente e permite mostrar tudo de novo', async ({
  page,
}) => {
  const database = fixture(3);
  database.active.exercises.forEach((exercise) =>
    exercise.sets.forEach((set) => (set.rest = '60')),
  );
  database.active.exercises[0].sets.forEach((set) => (set.done = true));
  await open(page, database);
  const before = await stored(page);
  const hide = page.getByRole('checkbox', { name: 'Ocultar exercícios concluídos', exact: true });
  await hide.click();
  await expect(page.getByText('Exercício 2 de 3', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled();
  expect(await stored(page)).toEqual(before);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByText('Exercício 3 de 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  for (const i of [1, 2, 3]) await done(page, 'Remada', i).click();
  await expect(page.getByText('Exercício 3 de 3', { exact: true })).toBeVisible();
  await page
    .getByTestId('current-set-card')
    .getByRole('button', { name: 'Voltar à série atual', exact: true })
    .click();
  await expect(hide).toBeChecked();
  await expect(page.getByText('Exercício 3 de 3', { exact: true })).toBeVisible();
  for (const i of [1, 2, 3]) await done(page, 'Leg press', i).click();
  await expect(page.getByTestId('completed-exercises-empty')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finalizar treino', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Mostrar exercícios concluídos', exact: true }).click();
  await expect(page.getByTestId('completed-exercises-empty')).toHaveCount(0);
  await expect(hide).not.toBeChecked();
  await expect(page.getByText('Exercício 3 de 3', { exact: true })).toBeVisible();
  expect(
    (await stored(page)).active.exercises.every((e: { sets: { done: boolean }[] }) =>
      e.sets.every((s) => s.done),
    ),
  ).toBe(true);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByTestId('workout-header').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/treino-automatico-sem-topbar-20261016-${width}.png`,
    });
  }
});

test('exercício sem descanso avança ao concluir e o último continua na página', async ({
  page,
}) => {
  const database = fixture();
  database.active.exercises.forEach((exercise) => exercise.sets.forEach((set) => (set.rest = '0')));
  await open(page, database);
  for (const i of [1, 2, 3]) await done(page, 'Supino', i).click();
  await expect(page.getByText('Exercício 2 de 2', { exact: true })).toBeVisible();
  await expect(page.getByTestId('current-set-card')).toContainText('Remada');
  await expect(page.getByTestId(/^rest-remaining-/)).toHaveCount(0);
  for (const i of [1, 2, 3]) await done(page, 'Remada', i).click();
  await expect(page.getByText('Exercício 2 de 2', { exact: true })).toBeVisible();
  await expect(page.getByTestId(/^rest-remaining-/)).toHaveCount(0);
});
