import { test, expect } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout } from '../../src/model';

test('cadastro conjunto, validação, seções, edição e persistência da divisão', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Nova divisão', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Nova divisão', exact: true }).click();
  await page.getByLabel('Nome da divisão', { exact: true }).fill('ABC — Base');
  for (const [index, name, exercise, day] of [
    [1, 'A', 'Supino', 'Segunda-feira'],
    [2, 'B', 'Remada', 'Quarta-feira'],
    [3, 'C', 'Agachamento', 'Sexta-feira'],
  ] as const) {
    if (index > 1)
      await page.getByRole('button', { name: 'Adicionar treino', exact: true }).click();
    const section = page.getByTestId(`division-section-${index}`);
    await section.getByLabel('Nome da rotina', { exact: true }).fill(name);
    await section.getByLabel('Nome do exercício 1', { exact: true }).fill(exercise);
    await section.getByRole('checkbox', { name: day, exact: true }).click();
    for (const [i, reps, rest] of [
      [1, '12', '60'],
      [2, '10', '90'],
      [3, '8', '120'],
    ] as const) {
      await section.getByLabel(`Repetições exercício 1 série ${i}`, { exact: true }).fill(reps);
      await section.getByLabel(`Descanso exercício 1 série ${i}`, { exact: true }).fill(rest);
    }
  }
  await page.getByRole('button', { name: 'Recolher treino 3', exact: true }).first().click();
  await expect(
    page.getByTestId('division-section-1').getByText('Supino', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Nome da divisão', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/divisao-resumo.png' });
  await page.getByRole('button', { name: 'Adicionar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar divisão', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Treino 4');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('@ritmo/database/v1') ?? '{"routines":[]}').routines
            .length,
      ),
    )
    .toBe(0);
  await page.getByRole('button', { name: 'Remover treino 4', exact: true }).click();
  await page.getByRole('button', { name: 'Remover treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar divisão', exact: true }).click();
  await expect(page.getByText('Confira os treinos da sua divisão')).toBeVisible();
  await page.getByRole('button', { name: 'Editar divisão', exact: true }).click();
  await page.getByRole('button', { name: 'Abrir treino 2', exact: true }).click();
  const b = page.getByTestId('division-section-2');
  await expect(b.getByLabel('Descanso exercício 1 série 3', { exact: true })).toHaveValue('120');
  await b.getByLabel('Nome da rotina', { exact: true }).fill('B alterado');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?')).toBeVisible();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await expect(page.getByText('B alterado', { exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Ver divisão ABC — Base', exact: true }).click();
  await page.getByRole('button', { name: 'Ver rotina C', exact: true }).click();
  await expect(page.getByText('8 repetições', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(page.getByText('Série 3 · Descanso: 120 s', { exact: true })).toBeVisible();
});

test('gráficos independentes, total por exercício e consulta de rotinas excluídas', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Gráficos', exact: true }).click();
  await expect(page.getByText('Seu progresso começa aqui')).toBeVisible();
  const routine = newRoutine();
  routine.name = 'A';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].reps = ['12', '10', '8'];
  const workout = startWorkout(routine);
  workout.id = 'first';
  workout.finishedAt = '2026-09-26T12:00:00Z';
  workout.exercises[0].sets.forEach((set, i) => {
    set.done = true;
    set.weight = ['20', '25', '30'][i];
  });
  const second = structuredClone(workout);
  second.id = 'second';
  second.finishedAt = '2026-09-27T12:00:00Z';
  second.exercises[0].sets[1].done = false;
  second.exercises[0].sets[2].done = false;
  const other = structuredClone(workout);
  other.id = 'other';
  other.routineId = 'other-routine';
  other.name = 'B';
  other.exercises[0].sets.forEach((set) => {
    set.weight = '0';
  });
  await page.addInitScript((db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)), {
    ...emptyDatabase(),
    workouts: [other, second, workout],
  });
  await page.reload();
  await page.getByRole('tab', { name: 'Gráficos', exact: true }).click();
  await page.getByRole('radio', { name: 'Supino · A', exact: true }).click();
  await expect(page.getByTestId('total-load-record-first')).toHaveAttribute(
    'aria-label',
    /730 kg·repetições/,
  );
  await expect(page.getByTestId('total-load-record-second')).toHaveAttribute(
    'aria-label',
    /240 kg·repetições/,
  );
  await expect(page.getByTestId('load-record-first')).toHaveAttribute(
    'aria-label',
    /30 kg, 8 repetições/,
  );
  await expect(page.getByTestId('load-chart')).toHaveCount(1);
  await expect(page.getByTestId('total-load-chart')).toHaveCount(0);
  await expect(page.getByTestId(/^total-load-line-/)).toHaveCount(1);
  await expect(page.getByTestId('total-load-axis')).toBeVisible();
  await page.getByTestId('load-chart').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/graficos-total-exercicio.png' });
  await page.getByRole('radio', { name: 'Supino · B', exact: true }).click();
  await expect(page.getByTestId('total-load-record-other')).toHaveAttribute(
    'aria-label',
    /0 kg·repetições/,
  );
  await expect(page.getByTestId('total-load-record-first')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!).active))
    .toBeNull();
});
