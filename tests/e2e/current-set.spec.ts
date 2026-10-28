import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase, newRoutine, newExercise, startWorkout } from '../../src/model';

function fixture(series = 3) {
  const r = newRoutine();
  r.name = 'Referência de série';
  r.exercises = ['Supino', 'Remada'].map((name) => ({
    ...newExercise(),
    name,
    reps: Array(series).fill('12'),
    rests: Array(series).fill('60'),
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
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));

test('card permanece sem descanso, ao navegar, na pausa e depois do cronômetro acabar', async ({
  page,
}) => {
  await page.clock.install();
  const db = fixture();
  await open(page, db);
  const card = page.getByTestId('current-set-card');
  await expect(page.getByTestId('workout-progress-summary')).toContainText('0.00%');
  await expect(card).toContainText('Série atual · 1');
  await expect(card).toContainText('Supino');
  await expect(card.getByRole('button', { name: 'Pausar descanso', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByText('Exercício 2 de 2', { exact: true })).toBeVisible();
  await expect(card).toContainText('Supino');
  expect((await stored(page)).active).toEqual(db.active);
  await card.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
  await expect(
    page.getByTestId(`workout-set-${db.active.exercises[0].sets[0].id}`),
  ).toBeInViewport();
  await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
  await expect(page.getByTestId('workout-progress-summary')).toContainText('16.67%');
  await expect(card).toContainText('Série atual · 2');
  await expect(card.getByLabel(/Descanso em andamento após Supino · série 1/)).toBeVisible();
  await card.getByRole('button', { name: 'Pausar descanso', exact: true }).click();
  await expect(card.getByLabel(/Descanso pausado/)).toBeVisible();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(card).toContainText('Supino');
  await card.getByRole('button', { name: 'Retomar descanso', exact: true }).click();
  await page.clock.fastForward(60_000);
  await expect(card).toContainText('Série atual · 2');
  await expect(card.getByRole('button', { name: 'Pausar descanso', exact: true })).toHaveCount(0);
});

test('retorno alcança a linha da série atual na mesma página e em outro exercício', async ({
  page,
}) => {
  const db = fixture(12);
  db.active.exercises[0].sets.slice(0, 9).forEach((s) => (s.done = true));
  await open(page, db);
  const card = page.getByTestId('current-set-card');
  const target = page.getByTestId(`workout-set-${db.active.exercises[0].sets[9].id}`);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await card.scrollIntoViewIfNeeded();
    await expect(card).toContainText('Série atual · 10');
    await expect(target).not.toBeInViewport();
    const bounds = (await card.boundingBox())!;
    expect(bounds.height).toBeLessThanOrEqual(64);
    await card.screenshot({ path: `test-results/serie-atual-sem-descanso-${width}.png` });
    await card.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
    await expect(target).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: 'Próximo', exact: true }).click();
    await expect(card).toContainText('Supino');
    await card.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
    await expect(target).toBeInViewport({ ratio: 1 });
  }
  expect((await stored(page)).active).toEqual(db.active);
});

test('card continua quando tudo termina e volta à pendência se uma série for desmarcada', async ({
  page,
}) => {
  const db = fixture();
  db.active.exercises.forEach((e) => e.sets.forEach((s) => (s.done = true)));
  await open(page, db);
  const card = page.getByTestId('current-set-card');
  await expect(card).toContainText('Séries concluídas');
  await expect(page.getByTestId('workout-progress-summary')).toContainText('100.00%');
  await expect(card.getByRole('button', { name: 'Voltar à série atual', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('checkbox', { name: 'Concluir Supino série 3', exact: true }).click();
  await expect(page.getByTestId('workout-progress-summary')).toContainText('83.33%');
  await expect(card).toContainText('Série atual · 3');
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await card.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
  await expect(page.getByTestId(`workout-set-${db.active.exercises[0].sets[2].id}`)).toBeInViewport(
    { ratio: 1 },
  );
});

test('top bar fica visível ao rolar o treino e mantém filtro, progresso e campos acessíveis', async ({
  page,
}) => {
  const db = fixture(12);
  db.active.name = 'Treino com um nome comprido para conferir o cabeçalho compacto';
  db.active.exercises[0].sets[0].done = true;
  await open(page, db);
  const top = page.getByTestId('workout-top-bar');
  const summary = page.getByTestId('workout-progress-summary');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const before = (await top.boundingBox())!;
    await expect(summary).toContainText('1/24 séries');
    await expect(summary).toContainText('4.17%');
    await page
      .getByRole('button', { name: 'Finalizar treino', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(top).toBeInViewport({ ratio: 1 });
    const after = (await top.boundingBox())!;
    expect(after.y).toBeCloseTo(before.y, 1);
    expect(after.height).toBeCloseTo(before.height, 1);
    await expect(page.getByTestId('workout-progress-track')).toBeInViewport({ ratio: 1 });
    const filter = top.getByRole('checkbox', { name: 'Ocultar exercícios concluídos' });
    await filter.click();
    await expect(filter).toBeChecked();
    await filter.click();
    await expect(filter).not.toBeChecked();
    await expect.poll(() => top.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({ path: `test-results/top-bar-treino-flutuante-${width}.png` });
    const card = page.getByTestId('current-set-card');
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: 'Voltar à série atual', exact: true }).click();
    const target = page.getByTestId(`workout-set-${db.active.exercises[0].sets[1].id}`);
    await expect(target).toBeInViewport({ ratio: 1 });
    await expect
      .poll(async () => (await target.boundingBox())!.y >= after.y + after.height)
      .toBe(true);
  }
  expect((await stored(page)).active).toEqual(db.active);
});
