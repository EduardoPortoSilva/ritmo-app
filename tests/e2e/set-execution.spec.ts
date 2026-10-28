import { expect, test } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout } from '../../src/model';

const reductionCases = [
  { name: 'descanso-longo', latest: { longRest: true }, warn: true },
  { name: 'rest-pause', latest: { restPause: true }, warn: true },
  { name: 'caibra', latest: { cramp: true }, warn: true },
  { name: 'ambos', latest: { longRest: true, restPause: true }, warn: true },
  { name: 'sem-detalhes', latest: {}, warn: false },
  { name: 'somente-antigo', latest: {}, older: true, warn: false },
  { name: 'serie-pendente', latest: { longRest: true, done: false }, warn: false },
  {
    name: 'serie-pendente-invalida',
    latest: { restPause: true, reps: '0', done: false },
    warn: false,
  },
];
for (const example of reductionCases) {
  test(`contorno de redução: ${example.name}`, async ({ page }) => {
    const database = fixture();
    database.workouts.forEach((workout) =>
      workout.exercises[0].sets.forEach((set) => {
        set.reps = '4';
      }),
    );
    Object.assign(database.workouts[1].exercises[0].sets[0], example.latest);
    if (example.older) database.workouts[0].exercises[0].sets[0].longRest = true;
    await page.addInitScript(
      (db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)),
      database,
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
    const hint = page.getByTestId('load-reduction-hint');
    await expect(hint).toBeVisible();
    const triangle = hint.locator('path').last();
    await expect(hint.locator('path')).toHaveCount(example.warn ? 2 : 1);
    if (example.warn) {
      await expect(hint.locator('path').first()).toHaveAttribute('stroke', '#FF3038');
      await expect(hint.locator('path').first()).toHaveAttribute('stroke-width', '5.5');
    }
    await expect(triangle).toHaveAttribute('fill', '#FF3038');
    await expect(triangle).toHaveAttribute('stroke', example.warn ? '#FFE600' : '#FF3038');
    await expect(triangle).toHaveAttribute('stroke-width', example.warn ? '2.5' : '1');
    await expect(hint).toHaveAttribute(
      'aria-label',
      example.warn
        ? /Atenção.*descanso longo, rest-pause ou cãibra/
        : 'Sugestão do app: Diminuir carga',
    );
    if (example.name === 'ambos') {
      await page
        .getByTestId('exercise-feedback-status')
        .screenshot({ path: 'test-results/reducao-contorno-duplo-20261016.png' });
    }
  });
}

function fixture() {
  const routine = newRoutine();
  routine.name = 'Séries com detalhes';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].rests = ['60', '60', '60'];
  const history = ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'].map((finishedAt) => {
    const workout = startWorkout(routine);
    workout.finishedAt = finishedAt;
    workout.exercises[0].sets.forEach((set) => Object.assign(set, { weight: '20', done: true }));
    return workout;
  });
  return {
    ...emptyDatabase(),
    routines: [routine],
    workouts: history,
    active: startWorkout(routine, history),
  };
}

test('marcações pertencem às séries, persistem e geram ressalvas na comparação do último treino', async ({
  page,
}) => {
  const database = fixture();
  const previous = database.workouts[1].exercises[0];
  previous.sets[0].longRest = true;
  previous.sets[1].restPause = true;
  Object.assign(previous.sets[2], { longRest: true, restPause: true, cramp: true });
  await page.addInitScript((db) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
  }, database);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByTestId('load-progression-hint')).toBeVisible();
  await expect(page.getByTestId('load-progression-hint')).toHaveAttribute(
    'aria-label',
    /Atenção.*descanso longo, rest-pause ou cãibra/,
  );
  await expect(page.getByTestId('load-progression-hint').locator('path')).toHaveAttribute(
    'fill',
    '#95651B',
  );
  const first = page.getByTestId('set-comparison-1');
  const second = page.getByTestId('set-comparison-2');
  const third = page.getByTestId('set-comparison-3');
  await expect(first).toContainText('Última: 12 reps × 20 kg');
  await expect(first.getByTestId('set-load-caution')).toHaveAttribute(
    'aria-label',
    /Descanso longo/,
  );
  await expect(first).not.toContainText('Rest-pause');
  await expect(first.getByTestId('set-load-caution').locator(':scope > *')).toHaveCount(1);
  await expect(second.getByTestId('set-load-caution')).toHaveAttribute('aria-label', /Rest-pause/);
  await expect(second).not.toContainText('Descanso longo');
  await expect(third.getByTestId('set-load-caution')).toHaveAttribute(
    'aria-label',
    /Descanso longo · Rest-pause · Cãibra/,
  );
  await expect(third.getByTestId('set-load-caution').locator(':scope > *')).toHaveCount(3);
  await expect(
    page.getByTestId('exercise-feedback-status').getByTestId('set-load-caution'),
  ).toHaveCount(0);
  await expect(page.getByTestId('exercise-feedback-controls').getByRole('checkbox')).toHaveCount(0);

  const longRest = page.getByRole('checkbox', {
    name: 'Descanso longo de Supino série 1',
    exact: true,
  });
  const restPause = page.getByRole('checkbox', {
    name: 'Rest-pause de Supino série 1',
    exact: true,
  });
  const cramp = page.getByRole('checkbox', { name: 'Cãibra de Supino série 1', exact: true });
  const done = page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true });
  const toggle = page.getByRole('button', { name: 'Detalhes de Supino série 1', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(longRest).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(longRest).not.toBeChecked();
  await expect(restPause).not.toBeChecked();
  await expect(cramp).not.toBeChecked();
  await done.click();
  await longRest.click();
  await cramp.click();
  await expect(cramp).toBeChecked();
  await expect(done).toBeChecked();
  await restPause.click();
  await longRest.click();
  await expect(longRest).not.toBeChecked();
  await expect(restPause).toBeChecked();
  await expect(done).toBeChecked();
  const weight = page.getByRole('textbox', { name: 'Supino série 1 carga em kg', exact: true });
  const currentDetails = weight.locator('..').getByTestId('current-set-execution');
  await expect(currentDetails).toHaveAttribute('aria-label', 'Nesta série: Rest-pause · Cãibra');
  await cramp.click();
  await expect(currentDetails).toHaveAttribute('aria-label', 'Nesta série: Rest-pause');
  await expect(done).toBeChecked();
  await cramp.click();
  await longRest.click();
  await page.getByRole('button', { name: 'Detalhes de Supino série 2', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(
    page.getByRole('checkbox', { name: 'Descanso longo de Supino série 2', exact: true }),
  ).not.toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const set = JSON.parse(localStorage.getItem('@ritmo/database/v1')!).active.exercises[0]
          .sets[0];
        return {
          longRest: set.longRest,
          restPause: set.restPause,
          cramp: set.cramp,
          done: set.done,
        };
      }),
    )
    .toEqual({ longRest: true, restPause: true, cramp: true, done: true });
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(longRest).toBeChecked();
  await expect(restPause).toBeChecked();
  await expect(cramp).toBeChecked();
  await expect(done).toBeChecked();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await first.scrollIntoViewIfNeeded();
    await toggle.click();
    await expect(longRest).toHaveCount(0);
    await expect(currentDetails).toBeVisible();
    await expect(currentDetails).toHaveAttribute(
      'aria-label',
      'Nesta série: Descanso longo · Rest-pause · Cãibra',
    );
    const inputBounds = await weight.boundingBox();
    const iconBounds = await currentDetails.boundingBox();
    expect(inputBounds!.height).toBe(46);
    expect(iconBounds!.x).toBeGreaterThanOrEqual(inputBounds!.x);
    expect(iconBounds!.x + iconBounds!.width).toBeLessThanOrEqual(
      inputBounds!.x + inputBounds!.width,
    );
    expect(iconBounds!.y + iconBounds!.height).toBeLessThanOrEqual(
      inputBounds!.y + inputBounds!.height,
    );
    await page.screenshot({
      path: `test-results/series-detalhes-v4-recolhidos-20261016-${width}.png`,
    });
    await toggle.click();
    await expect(longRest).toBeChecked();
    await expect(restPause).toBeChecked();
    await page.screenshot({
      path: `test-results/series-detalhes-v4-expandidos-20261016-${width}.png`,
    });
    const boxes = await page
      .getByRole('checkbox', { name: /^(Descanso longo|Rest-pause|Cãibra) de Supino série 1$/ })
      .evaluateAll((elements) =>
        elements.map((element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        }),
      );
    expect(boxes[0].height).toBeGreaterThanOrEqual(44);
    expect(boxes[1].height).toBeGreaterThanOrEqual(44);
    expect(boxes[2].height).toBeGreaterThanOrEqual(44);
    expect(boxes[0].y).toBe(boxes[1].y);
    expect(boxes[2].x + boxes[2].width).toBeLessThanOrEqual(width);
    await expect(longRest).toHaveCSS('background-color', 'rgb(36, 61, 50)');
    await expect(restPause).toHaveCSS('background-color', 'rgb(36, 61, 50)');
    await expect(cramp).toHaveCSS('background-color', 'rgb(36, 61, 50)');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('checkbox', { name: 'Concluir Supino série 2', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Concluir Supino série 3', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page
    .getByRole('button', { name: /^Ver treino Séries com detalhes/ })
    .first()
    .click();
  await expect(page.getByTestId('set-execution-summary')).toHaveCount(1);
  await expect(page.getByTestId('set-execution-summary')).toHaveAttribute(
    'aria-label',
    'Descanso longo · Rest-pause · Cãibra',
  );
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('current-set-execution')).toHaveCount(0);
  await toggle.click();
  await expect(longRest).not.toBeChecked();
  await expect(restPause).not.toBeChecked();
  await expect(cramp).not.toBeChecked();
  await expect(first.getByTestId('set-load-caution')).toHaveAttribute(
    'aria-label',
    /Descanso longo · Rest-pause · Cãibra/,
  );
  await expect(second.getByTestId('set-load-caution')).toHaveCount(0);
  await expect(third.getByTestId('set-load-caution')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('@ritmo/database/v1')!).workouts.slice(1),
    ),
  ).toEqual(database.workouts);
});

test('detalhes anteriores aparecem sem sugestão e séries pendentes ou ausentes não usam sessões mais antigas', async ({
  page,
}) => {
  const database = fixture();
  database.workouts[0].exercises[0].sets.forEach((set) =>
    Object.assign(set, { longRest: true, restPause: true }),
  );
  const previous = database.workouts[1].exercises[0];
  previous.sets[0].longRest = true;
  Object.assign(previous.sets[1], { done: false, longRest: true, restPause: true });
  previous.sets.pop();
  await page.addInitScript(
    (db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)),
    database,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByTestId('load-progression-hint')).toHaveCount(0);
  await expect(
    page.getByTestId('set-comparison-1').getByTestId('set-execution-summary'),
  ).toHaveAttribute('aria-label', 'Descanso longo');
  await expect(page.getByTestId('set-comparison-1')).not.toContainText('Rest-pause');
  for (const index of [2, 3]) {
    const comparison = page.getByTestId(`set-comparison-${index}`);
    await expect(comparison).toContainText('Última: sem série concluída');
    await expect(comparison.getByTestId('set-execution-summary')).toHaveCount(0);
  }
  await expect(page.getByTestId('set-load-caution')).toHaveCount(0);
});
