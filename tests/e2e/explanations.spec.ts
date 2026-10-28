import { test, expect } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout } from '../../src/model';

const manualCases = [
  {
    kind: 'increase',
    title: 'Aumentar carga',
    values: { loadAdjustment: 'increase' },
    text: 'pretende aumentar a carga',
  },
  {
    kind: 'maintain',
    title: 'Manter carga',
    values: { loadAdjustment: 'maintain' },
    text: 'repetir a carga',
  },
  {
    kind: 'decrease',
    title: 'Diminuir carga',
    values: { loadAdjustment: 'decrease' },
    text: 'diminuir a carga',
  },
  {
    kind: 'external',
    title: 'Impedimento externo',
    values: { externalImpediment: true },
    text: 'situação externa atrapalhou o exercício',
  },
  {
    kind: 'cramp',
    title: 'Impedimento',
    values: { cramp: true },
    text: 'formato antigo, para o exercício inteiro',
  },
];
for (const example of manualCases) {
  test(`explica marcação manual ${example.kind} sem alterá-la`, async ({ page }) => {
    const db = fixture(false, false);
    Object.assign(db.workouts[1].exercises[0], example.values);
    await page.addInitScript(
      (db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)),
      db,
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
    const original = await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'));
    const marker = page.getByRole('button', {
      name: `Último treino: ${example.title}`,
      exact: true,
    });
    const modal = page.getByTestId('manual-feedback-explanation');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await marker.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(modal.getByRole('heading', { name: example.title, exact: true })).toBeVisible();
      await expect(modal).toContainText('Marcação feita manualmente no último treino');
      await expect(modal).toContainText(example.text);
      await expect(modal).toContainText('não altera a marcação nem a carga registrada');
      const bounds = await modal.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
      if (example.kind === 'increase' || example.kind === 'external')
        await modal.screenshot({
          path: `test-results/explicacao-manual-${example.kind}-20261016-${width}.png`,
        });
      await modal.getByRole('button', { name: 'Entendi', exact: true }).click();
      await expect(modal).toHaveCount(0);
    }
    await marker.click();
    await modal.getByRole('button', { name: 'Fechar explicação', exact: true }).click();
    await expect(modal).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'))).toBe(original);
  });
}

function fixture(decrease = false, caution = true) {
  const routine = newRoutine();
  routine.name = 'Explicações';
  routine.exercises[0].name = 'Supino';
  const workouts = ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'].map((finishedAt) => {
    const workout = startWorkout(routine);
    workout.finishedAt = finishedAt;
    workout.exercises[0].sets.forEach((set) =>
      Object.assign(set, { weight: '20', reps: decrease ? '4' : set.target, done: true }),
    );
    return workout;
  });
  if (caution)
    Object.assign(workouts[1].exercises[0].sets[0], {
      longRest: true,
      restPause: true,
      cramp: true,
    });
  return {
    ...emptyDatabase(),
    routines: [routine],
    workouts,
    active: startWorkout(routine, workouts),
  };
}

for (const decrease of [false, true]) {
  for (const caution of [false, true]) {
    test(`explica sugestão de ${decrease ? 'redução' : 'aumento'} ${caution ? 'com' : 'sem'} ressalva e fecha sem alterar dados`, async ({
      page,
    }) => {
      await page.addInitScript(
        (db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)),
        fixture(decrease, caution),
      );
      await page.goto('/');
      await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
      const original = await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'));
      const hint = page.getByTestId(decrease ? 'load-reduction-hint' : 'load-progression-hint');
      await expect(hint).toHaveAttribute('role', 'button');
      await hint.click();
      const modal = page.getByTestId('load-hint-explanation');
      await expect(
        modal.getByRole('heading', {
          name: decrease ? 'Sugestão de reduzir carga' : 'Sugestão de aumentar carga',
        }),
      ).toBeVisible();
      await expect(modal).toContainText(
        decrease ? 'menos de metade da meta' : 'mesma carga em cada série correspondente',
      );
      await expect(modal).toContainText('só muda quando você edita o campo KG');
      if (caution) {
        await expect(modal).toContainText('descanso longo, rest-pause ou cãibra');
        await expect(modal).toContainText(
          decrease ? 'borda amarela com contorno vermelho' : 'tom âmbar',
        );
      } else await expect(modal).not.toContainText('Detalhe no último treino');
      await modal.getByRole('button', { name: 'Fechar explicação', exact: true }).click();
      await expect(modal).toHaveCount(0);
      await hint.click();
      await modal.getByRole('button', { name: 'Entendi', exact: true }).click();
      await expect(modal).toHaveCount(0);
      await hint.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).toHaveCount(0);
      expect(await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'))).toBe(original);
    });
  }
}

test('símbolos da última série explicam as três marcações em telas estreitas sem marcar a série atual', async ({
  page,
}) => {
  await page.addInitScript(
    (db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)),
    fixture(),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  const original = await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'));
  const symbols = page.getByTestId('set-comparison-1').getByRole('button');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await symbols.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const modal = page.getByTestId('set-execution-explanation');
    await expect(modal.getByRole('heading', { name: 'Detalhes da última série' })).toBeVisible();
    await expect(modal).toContainText('Descanso longo');
    await expect(modal).toContainText('antes de realizar esta série');
    await expect(modal).toContainText('5 a 10 segundos');
    await expect(modal).toContainText('Cãibra registrada durante esta série');
    const bounds = await modal.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
    await modal.screenshot({
      path: `test-results/explicacao-marcacoes-serie-20261016-${width}.png`,
    });
    await modal.getByRole('button', { name: 'Entendi', exact: true }).click();
  }
  await expect(
    page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }),
  ).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'))).toBe(original);
  await page.getByTestId('load-progression-hint').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByTestId('load-hint-explanation')
    .screenshot({ path: 'test-results/explicacao-sugestao-carga-20261016-320.png' });
});
