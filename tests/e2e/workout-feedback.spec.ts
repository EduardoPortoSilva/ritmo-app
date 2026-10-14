import { test, expect } from '@playwright/test';
import { emptyDatabase, newExercise, newRoutine, startWorkout } from '../../src/model';

test('lembretes por exercício, comparação por série e retomada até a próxima sessão', async ({
  page,
}) => {
  const routine = newRoutine();
  routine.name = 'Lembretes';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].reps = ['12', '10'];
  routine.exercises.push({ ...newExercise(), name: 'Remada', reps: ['8'] });
  const previous = startWorkout(routine);
  previous.finishedAt = '2026-10-01T12:00:00Z';
  previous.exercises[0].loadAdjustment = 'increase';
  previous.exercises[0].cramp = true;
  previous.exercises[0].sets.forEach((set, index) =>
    Object.assign(set, { weight: index ? '0' : '10', reps: index ? '10' : '13', done: true }),
  );
  const db = {
    ...emptyDatabase(),
    routines: [routine],
    workouts: [previous],
    active: startWorkout(routine, [previous]),
  };
  await page.addInitScript((database) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(database));
  }, db);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByTestId('set-comparison-1')).toContainText('meta: 12');
  await expect(page.getByTestId('set-comparison-1')).toContainText('Última: 13 reps × 10 kg');
  await expect(page.getByTestId('set-comparison-2')).toContainText('Última: 10 reps × 0 kg');
  await expect(
    page.getByRole('img', { name: 'Último treino: Aumentar carga', exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole('img', { name: 'Último treino: Impedimento', exact: true }),
  ).toHaveCount(1);
  await expect(page.getByTestId('exercise-feedback-status')).toHaveCount(1);
  const statusBounds = await page.getByTestId('exercise-feedback-status').boundingBox();
  const firstSetBounds = await page
    .getByLabel('Supino série 1 carga em kg', { exact: true })
    .boundingBox();
  expect(statusBounds!.y + statusBounds!.height).toBeLessThan(firstSetBounds!.y);
  await expect(page.getByTestId('load-progression-hint')).toHaveCount(0);
  await expect(page.getByTestId('workout-history-modal')).toHaveCount(0);
  const increase = page.getByRole('checkbox', { name: 'Aumentar carga para Supino', exact: true });
  const maintain = page.getByRole('checkbox', { name: 'Manter carga para Supino', exact: true });
  const decrease = page.getByRole('checkbox', { name: 'Diminuir carga para Supino', exact: true });
  const cramp = page.getByRole('checkbox', { name: 'Impedimento para Supino', exact: true });
  const external = page.getByRole('checkbox', {
    name: 'Impedimento externo para Supino',
    exact: true,
  });
  await expect(increase).not.toBeChecked();
  await increase.click();
  await maintain.click();
  await expect(increase).not.toBeChecked();
  await expect(maintain).toBeChecked();
  await maintain.click();
  await expect(maintain).not.toBeChecked();
  await decrease.click();
  await cramp.click();
  await external.click();
  await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByTestId('exercise-feedback-status')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Aumentar carga para Remada', exact: true }).click();
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(decrease).toBeChecked();
  await expect(cramp).toBeChecked();
  await expect(external).toBeChecked();
  await page.getByTestId('exercise-feedback-controls').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: 'test-results/treino-modificadores-20261013.png',
    animations: 'disabled',
  });
  await expect(
    page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }),
  ).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('@ritmo/database/v1')!).active.exercises[0]
            .loadAdjustment,
      ),
    )
    .toBe('decrease');
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(decrease).toBeChecked();
  await expect(cramp).toBeChecked();
  await expect(external).toBeChecked();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page
    .getByRole('button', { name: /^Ver treino Lembretes/ })
    .first()
    .click();
  await expect(
    page.getByRole('img', { name: 'Marcado neste treino: Diminuir carga', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Marcado neste treino: Impedimento', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(
    page.getByRole('img', { name: 'Último treino: Diminuir carga', exact: true }),
  ).toHaveCount(1);
  await expect(page.getByTestId('exercise-feedback-status')).toHaveCount(1);
  await expect(decrease).not.toBeChecked();
  await expect(cramp).not.toBeChecked();
  await expect(external).not.toBeChecked();
  await expect(
    page.getByRole('img', { name: 'Último treino: Impedimento externo', exact: true }),
  ).toHaveCount(1);
  await expect(page.getByTestId('set-comparison-2')).toContainText('Última: sem série concluída');
  await page.screenshot({
    path: 'test-results/treino-lembretes-20261013.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('ícone de progressão aparece após duas sessões completas com a mesma carga', async ({
  page,
}) => {
  const routine = newRoutine();
  routine.name = 'Progressão';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].reps = ['12', '10'];
  const history = ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'].map((finishedAt) => {
    const workout = startWorkout(routine);
    workout.finishedAt = finishedAt;
    workout.exercises[0].sets.forEach((set) => Object.assign(set, { weight: '10', done: true }));
    return workout;
  });
  await page.addInitScript(
    (database) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(database)),
    {
      ...emptyDatabase(),
      routines: [routine],
      workouts: history,
      active: startWorkout(routine, history),
    },
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByTestId('load-progression-hint')).toContainText(
    'Parece que está na hora de progredir a carga',
  );
  await expect(
    page.getByRole('img', { name: 'Sugestão do app: Aumentar carga', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Supino série 1 carga em kg', { exact: true })).toHaveValue('10');
  await page.screenshot({
    path: 'test-results/treino-progressao-20261013.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Expandir gráfico de Supino', exact: true }).click();
  await expect(page.getByTestId('workout-history-modal')).toBeVisible();
  await expect(page.getByTestId(/^load-record-/)).toHaveCount(2);
  const bounds = await page.getByTestId('workout-history-modal').boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  await page.screenshot({
    path: 'test-results/treino-grafico-modal-20261013.png',
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Fechar gráfico', exact: true }).click();
  await expect(page.getByTestId('workout-history-modal')).toHaveCount(0);
});
