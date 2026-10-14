import { expect, test } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout, type Routine } from '../../src/model';

function completed(
  routine: Routine,
  id: string,
  finishedAt: string,
  weight: string,
  bodyWeight: string,
) {
  const workout = startWorkout(routine);
  workout.id = id;
  workout.finishedAt = finishedAt;
  workout.bodyWeight = bodyWeight;
  workout.exercises[0].sets[0].done = true;
  workout.exercises[0].sets[0].reps = '10';
  workout.exercises[0].sets[0].weight = weight;
  return workout;
}

test('esforço separa treinos e fases, mantém máximo fora da janela e colore o histórico', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-05T12:00:00Z') });
  const a = newRoutine();
  a.name = 'A';
  a.exercises[0].name = 'Supino';
  a.exercises[0].reps = ['10'];
  const anotherA = structuredClone(a);
  anotherA.id = 'another-a';
  const changed = structuredClone(a);
  changed.exercises[0].reps = ['8'];
  const old = completed(a, 'old', '2026-01-01T12:00:00Z', '150', '74');
  const recent = completed(a, 'recent', '2026-10-01T12:00:00Z', '100', '75');
  const other = completed(anotherA, 'other', '2026-10-02T12:00:00Z', '200', '76');
  const phaseTwo = completed(changed, 'phase-two', '2026-10-03T12:00:00Z', '80', '75');
  const phaseMax = completed(changed, 'phase-max', '2026-10-04T12:00:00Z', '120', '75');
  await page.addInitScript((db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)), {
    ...emptyDatabase(),
    workouts: [phaseMax, phaseTwo, other, recent, old],
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Gráficos', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Período 90 dias' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByTestId('body-weight-record-old')).toHaveCount(0);
  await expect(page.getByTestId('effort-record-old')).toHaveCount(0);
  await expect(page.getByTestId('effort-record-recent')).toHaveAttribute('aria-label', /66%/);
  await expect(page.getByTestId('effort-record-other')).toHaveAttribute('aria-label', /100%/);
  await expect(page.getByTestId('effort-record-phase-two')).toHaveAttribute('aria-label', /66%/);
  await page.getByTestId('effort-chart').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/grafico-esforco.png' });
  await page.getByRole('radio', { name: 'Período 30 dias' }).click();
  await expect(page.getByTestId('effort-record-recent')).toBeVisible();
  await page.getByRole('radio', { name: 'Período Tudo' }).click();
  await expect(page.getByTestId('body-weight-record-old')).toBeVisible();
  await expect(page.getByTestId('effort-record-old')).toBeVisible();
  await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
  const first = page.getByTestId('history-workout-recent');
  const second = page.getByTestId('history-workout-other');
  await expect(first).toContainText('A · treino 1 · parte 1');
  await expect(second).toContainText('A · treino 2');
  const firstColor = await first.evaluate((element) => getComputedStyle(element).borderLeftColor);
  const secondColor = await second.evaluate((element) => getComputedStyle(element).borderLeftColor);
  expect(firstColor).not.toBe(secondColor);
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/historico-esforco-cores.png' });
  await first.click();
  await expect(page.getByText('66% do maior esforço desta fase')).toBeVisible();
});
