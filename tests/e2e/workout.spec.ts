import { expect, test } from '@playwright/test';
import { emptyDatabase, newExercise, newRoutine, startWorkout } from '../../src/model';

test('criar rotina, retomar treino, concluir parcialmente e preservar histórico', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('Um treino de cada vez.')).toBeVisible();
  await expect(page.getByTestId('body-weight-empty')).toBeVisible();
  await page.screenshot({ path: 'test-results/inicio.png' });
  await page.getByRole('button', { name: 'Criar minha primeira rotina' }).click();
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await expect(page.getByText('Dê um nome para a rotina.')).toBeVisible();
  await page.getByRole('button', { name: 'Entendi' }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Treino A — Superiores');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Supino reto');
  await page.getByLabel('Repetições exercício 1 série 2').fill('10');
  await page.getByRole('button', { name: 'Adicionar exercício', exact: true }).click();
  await page.getByLabel('Nome do exercício 2').fill('Remada');
  await page.getByRole('button', { name: 'Remover série 3 do exercício 2' }).click();
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await expect(page.getByText('2 exercícios · 5 séries')).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar treino' }).click();
  await expect(page.getByText('Exercício 1 de 2', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Remada série 1 carga em kg', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Concluir Supino reto série 1', exact: true }).click();
  await expect(page.getByText('Confira a série')).toBeVisible();
  await page.getByRole('button', { name: 'Entendi' }).click();
  await page.getByLabel('Supino reto série 1 repetições', { exact: true }).fill('11');
  await page.getByLabel('Supino reto série 1 carga em kg', { exact: true }).fill('12,5');
  await page.getByRole('checkbox', { name: 'Concluir Supino reto série 1', exact: true }).click();
  await expect(page.getByText('1/5 séries')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entendi' })).not.toBeVisible();
  await page.screenshot({ path: 'test-results/treino.png' });
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByText('Exercício 2 de 2', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Supino reto série 1 carga em kg', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Próximo', exact: true })).toBeDisabled();
  await expect(page.getByText('1/5 séries')).toBeVisible();
  await page.getByLabel('Remada série 1 carga em kg', { exact: true }).fill('30');
  await page.screenshot({ path: 'test-results/segundo-exercicio.png' });
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(page.getByLabel('Supino reto série 1 carga em kg', { exact: true })).toHaveValue(
    '12,5',
  );
  await expect(
    page.getByRole('checkbox', { name: 'Concluir Supino reto série 1', exact: true }),
  ).toBeChecked();
  // Reload exercises real storage, not mocked React state.
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByLabel('Remada série 1 carga em kg', { exact: true })).toHaveValue('30');
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(page.getByLabel('Supino reto série 1 carga em kg', { exact: true })).toHaveValue(
    '12,5',
  );
  await expect(
    page.getByRole('checkbox', { name: 'Concluir Supino reto série 1', exact: true }),
  ).toBeChecked();
  await page.getByLabel('Supino reto série 1 repetições', { exact: true }).fill('10');
  await expect(
    page.getByRole('checkbox', { name: 'Concluir Supino reto série 1', exact: true }),
  ).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Concluir Supino reto série 1', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await expect(page.getByText('Finalizar com séries pendentes?')).toBeVisible();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page.getByRole('button', { name: /^Ver treino Treino A/ }).click();
  await expect(page.getByText('10 reps × 12,5 kg')).toBeVisible();
  await expect(page.getByText('Não realizada', { exact: true })).toHaveCount(4);
  await page.screenshot({ path: 'test-results/historico.png' });
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Editar Treino A — Superiores' }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Treino B');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir Treino B' }).click();
  await page.getByRole('button', { name: 'Excluir rotina', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await expect(page.getByRole('button', { name: /^Ver treino Treino A/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('repetir treino preenche cargas anteriores, permite editar e retoma sem marcar séries', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina' }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Rotina para repetir');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Supino');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(page.getByText('Exercício 1 de 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Próximo', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Supino série 1 carga em kg', { exact: true })).toHaveValue('');
  await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('12,5');
  await page.getByLabel('Supino série 1 repetições', { exact: true }).fill('8');
  await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
  await page.getByLabel('Supino série 2 carga em kg', { exact: true }).fill('0');
  await page.getByRole('checkbox', { name: 'Concluir Supino série 2', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(page.getByLabel('Supino série 1 carga em kg', { exact: true })).toHaveValue('12,5');
  await expect(page.getByLabel('Supino série 2 carga em kg', { exact: true })).toHaveValue('0');
  await expect(page.getByLabel('Supino série 3 carga em kg', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Supino série 1 repetições', { exact: true })).toHaveValue('12');
  await expect(page.getByText('Evolução da carga', { exact: true })).toBeVisible();
  await expect(page.getByText('Um passo de cada vez', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId(/^load-record-/)).toHaveCount(1);
  await expect(
    page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }),
  ).not.toBeChecked();
  await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('15');
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByLabel('Supino série 1 carga em kg', { exact: true })).toHaveValue('15');
  await expect(page.getByText('Evolução da carga', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar depois', exact: true }).click();
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await page.getByRole('button', { name: /^Ver treino Rotina para repetir/ }).click();
  await expect(page.getByText('8 reps × 12,5 kg')).toBeVisible();
});

test('gráfico usa datas equidistantes, maior carga concluída e histórico do exercício atual', async ({
  page,
}) => {
  const routine = newRoutine();
  routine.name = 'Evolução';
  routine.exercises[0].name = 'Supino';
  const remada = { ...newExercise(), name: 'Remada' };
  routine.exercises.push(remada);
  const dates = ['2024-01-01T15:00:00Z', '2024-01-02T15:00:00Z', '2025-09-10T15:00:00Z'];
  const weights = ['0', '12,5', '40'];
  const reps = ['12', '60', '8'];
  const workouts = dates.map((date, index) => {
    const workout = startWorkout(routine);
    workout.finishedAt = date;
    Object.assign(workout.exercises[0].sets[0], {
      weight: weights[index],
      reps: reps[index],
      done: true,
    });
    Object.assign(workout.exercises[0].sets[1], { weight: '999', done: false });
    if (index === 2) {
      Object.assign(workout.exercises[0].sets[2], { weight: '20', reps: '99', done: true });
      Object.assign(workout.exercises[1].sets[0], { weight: '25', done: true });
    }
    return workout;
  });
  routine.exercises.push({ ...newExercise(), name: 'Novo exercício' });
  const db = {
    ...emptyDatabase(),
    routines: [routine],
    workouts: [...workouts].reverse(),
    active: startWorkout(routine, workouts),
  };
  await page.addInitScript(
    (database) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(database)),
    db,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByText('Evolução da carga', { exact: true })).toBeVisible();
  const points = page.getByTestId(/^load-record-/);
  await expect(points).toHaveCount(3);
  await expect(page.getByTestId(/^load-line-/)).toHaveCount(2);
  await expect(page.getByTestId(/^reps-line-/)).toHaveCount(2);
  await expect(page.getByTestId(/^total-load-line-/)).toHaveCount(2);
  await expect(page.getByTestId(/^total-load-point-/)).toHaveCount(3);
  await expect(page.getByTestId(`total-load-record-${workouts[2].id}`)).toHaveAttribute(
    'aria-label',
    /2\.300 kg·repetições/,
  );
  await expect(page.getByTestId('total-load-axis')).toBeVisible();
  await expect(page.getByText('Repetições', { exact: true })).toBeVisible();
  await expect(points.nth(0)).toHaveAttribute('aria-label', /01\/01\/2024.*: 0 kg/);
  await expect(points.nth(1)).toHaveAttribute('aria-label', /02\/01\/2024.*: 12,5 kg/);
  await expect(points.nth(2)).toHaveAttribute('aria-label', /10\/09\/2025.*: 40 kg/);
  await expect(points.nth(2)).toHaveAttribute('aria-label', /40 kg, 8 repetições/);
  const boxes = await Promise.all([0, 1, 2].map((index) => points.nth(index).boundingBox()));
  expect(boxes.every(Boolean)).toBeTruthy();
  expect(Math.abs(boxes[1]!.x - boxes[0]!.x - (boxes[2]!.x - boxes[1]!.x))).toBeLessThan(1);
  const zero = await page.getByTestId(`load-point-${workouts[0].id}`).boundingBox();
  const load = await page.getByTestId(`load-point-${workouts[2].id}`).boundingBox();
  const repetitions = await page.getByTestId(`reps-point-${workouts[1].id}`).boundingBox();
  const zeroY = zero!.y + zero!.height / 2;
  const loadY = load!.y + load!.height / 2;
  const repsY = repetitions!.y + repetitions!.height / 2;
  // 40 kg and 60 reps must share the same numeric vertical scale.
  expect((zeroY - loadY) / (zeroY - repsY)).toBeCloseTo(40 / 60, 2);
  await page.screenshot({ path: 'test-results/grafico-cargas.png' });
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(points).toHaveCount(1);
  await expect(page.getByTestId(/^load-line-/)).toHaveCount(0);
  await expect(page.getByTestId(/^reps-line-/)).toHaveCount(0);
  await expect(page.getByTestId(/^total-load-line-/)).toHaveCount(0);
  await expect(page.getByTestId(/^total-load-point-/)).toHaveCount(1);
  await expect(page.getByTestId(/^reps-point-/)).toHaveCount(1);
  await expect(points.first()).toHaveAttribute('aria-label', /: 25 kg/);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(points).toHaveCount(0);
  await expect(page.getByText('Um passo de cada vez', { exact: true })).toBeVisible();
});

test('finalização registra peso corporal opcional e preenche o último peso salvo', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina' }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Peso corporal');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Supino');
  await page.getByRole('button', { name: 'Remover série 3 do exercício 1' }).click();
  await page.getByRole('button', { name: 'Remover série 2 do exercício 1' }).click();
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  const finishNext = async () => {
    await page.getByRole('tab', { name: 'Rotinas' }).click();
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
    await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('20');
    await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  };
  await finishNext();
  const weight = page.getByLabel('Peso corporal (kg)', { exact: true });
  await expect(weight).toHaveValue('');
  await weight.fill('0');
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await expect(page.getByText('Informe um peso maior que 0 e até 999 kg.')).toBeVisible();
  await weight.fill('75,5');
  await page.screenshot({ path: 'test-results/peso-corporal.png' });
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await page.getByRole('button', { name: /^Ver treino Peso corporal/ }).click();
  await expect(page.getByText('75,5 kg', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await finishNext();
  await expect(weight).toHaveValue('75,5');
  await weight.fill('80');
  await page.getByRole('button', { name: 'Voltar ao treino', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await expect(weight).toHaveValue('75,5');
  await weight.fill('');
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await finishNext();
  await expect(weight).toHaveValue('75,5');
  await weight.fill('76.2');
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId(/^body-weight-record-/)).toHaveCount(2);
  await expect(page.getByText('Último registro: 76,2 kg', { exact: true })).toBeVisible();
  await finishNext();
  await expect(weight).toHaveValue('76.2');
});

test('início mostra evolução do peso com datas equidistantes e atualiza após excluir registro', async ({
  page,
}) => {
  const routine = newRoutine();
  routine.name = 'Histórico de peso';
  routine.exercises[0].name = 'Supino';
  const workouts = ['2024-01-01T15:00:00Z', '2024-01-02T15:00:00Z', '2026-09-17T15:00:00Z'].map(
    (date, index) => {
      const workout = startWorkout(routine);
      workout.finishedAt = date;
      workout.bodyWeight = ['80', '79,5', '81'][index];
      Object.assign(workout.exercises[0].sets[0], { weight: '20', done: true });
      return workout;
    },
  );
  const skipped = { ...workouts[0], id: 'sem-peso', bodyWeight: undefined };
  const db = {
    ...emptyDatabase(),
    routines: [routine],
    workouts: [...workouts].reverse().concat(skipped),
  };
  await page.addInitScript(
    (database) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(database)),
    db,
  );
  await page.goto('/');
  const chart = page.getByTestId('body-weight-chart');
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toBeVisible();
  const points = page.getByTestId(/^body-weight-record-/);
  await expect(points).toHaveCount(3);
  await expect(page.getByTestId(/^body-weight-line-/)).toHaveCount(2);
  await expect(points.nth(0)).toHaveAttribute('aria-label', /01\/01\/2024.*80 kg/);
  await expect(points.nth(1)).toHaveAttribute('aria-label', /02\/01\/2024.*79,5 kg/);
  await expect(points.nth(2)).toHaveAttribute('aria-label', /17\/09\/2026.*81 kg/);
  const boxes = await Promise.all([0, 1, 2].map((index) => points.nth(index).boundingBox()));
  expect(Math.abs(boxes[1]!.x - boxes[0]!.x - (boxes[2]!.x - boxes[1]!.x))).toBeLessThan(1);
  await page.screenshot({ path: 'test-results/peso-na-home.png' });
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await page
    .getByRole('button', { name: /^Ver treino Histórico de peso/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Excluir registro', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir treino', exact: true }).click();
  await page.getByRole('tab', { name: 'Início' }).click();
  await expect(points).toHaveCount(2);
  await expect(page.getByText('Último registro: 79,5 kg', { exact: true })).toBeVisible();
});

test('rotinas são atribuídas a dias e os treinos de hoje acompanham edição e exclusão', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2026, 8, 14, 12));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  for (const [name, days] of [
    ['Treino A', ['Segunda-feira', 'Sexta-feira']],
    ['Treino B', ['Quarta-feira']],
    ['Treino C', ['Sexta-feira']],
  ] as const) {
    await page.getByRole('button', { name: 'Nova rotina', exact: true }).click();
    await page.getByLabel('Nome da rotina', { exact: true }).fill(name);
    await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Supino');
    for (const day of days) await page.getByRole('checkbox', { name: day, exact: true }).click();
    if (name === 'Treino A') await page.screenshot({ path: 'test-results/dias-da-rotina.png' });
    await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  }
  await page.reload();
  const today = page.getByTestId('today-routines');
  await expect(today.getByRole('button', { name: 'Iniciar Treino A', exact: true })).toBeVisible();
  await expect(today.getByRole('button')).toHaveCount(1);
  await page.clock.setFixedTime(new Date(2026, 8, 16, 12));
  await page.reload();
  await expect(today.getByRole('button', { name: 'Iniciar Treino B', exact: true })).toBeVisible();
  await page.clock.setFixedTime(new Date(2026, 8, 18, 12));
  await page.reload();
  await expect(today.getByRole('button')).toHaveCount(2);
  await today.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/treinos-de-hoje.png' });
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Editar Treino A', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Segunda-feira', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Sexta-feira', exact: true })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Sexta-feira', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('tab', { name: 'Início' }).click();
  await expect(today.getByRole('button')).toHaveCount(1);
  await today.getByRole('button', { name: 'Iniciar Treino C', exact: true }).click();
  await expect(page.getByText('Exercício 1 de 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar depois', exact: true }).click();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Excluir Treino C', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir rotina', exact: true }).click();
  await page.getByRole('tab', { name: 'Início' }).click();
  await expect(today.getByText('Nenhuma rotina programada para hoje.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar treino', exact: true })).toBeVisible();
});

test('descarte de edição e de treino requer confirmação', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina' }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Pernas');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Agachamento');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Pernas' }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Alteração descartada');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await expect(page.getByText('Pernas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar treino' }).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await expect(
    page.getByText('Conclua pelo menos uma série antes de salvar o treino.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Entendi' }).click();
  await page.getByRole('button', { name: 'Descartar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar treino', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Escolher treino' })).toBeVisible();
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await expect(page.getByText('Sua história começa no próximo treino')).toBeVisible();
});
