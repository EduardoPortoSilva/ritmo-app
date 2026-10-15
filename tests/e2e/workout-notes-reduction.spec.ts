import { test, expect } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout } from '../../src/model';

test('redução automática por duas sessões e exclusão de impedimento externo', async ({ page }) => {
  const routine = newRoutine();
  routine.name = 'Redução';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].reps = ['12', '10', '8'];
  const history = ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'].map((finishedAt) => {
    const workout = startWorkout(routine);
    workout.finishedAt = finishedAt;
    workout.exercises[0].sets.forEach((set, index) =>
      Object.assign(set, { weight: '20', reps: ['5', '4', '6'][index], done: true }),
    );
    return workout;
  });
  const database = {
    ...emptyDatabase(),
    routines: [routine],
    workouts: history,
    active: startWorkout(routine, history),
  };
  await page.addInitScript((db) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
  }, database);
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(
    page.getByTestId('exercise-feedback-status').getByTestId('load-reduction-hint'),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Sugestão do app: Diminuir carga', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('load-progression-hint')).toHaveCount(0);
  await expect(page.getByLabel('Supino série 1 carga em kg', { exact: true })).toHaveValue('20');
  await page.screenshot({
    path: 'test-results/treino-reducao-compacta-20261014.png',
    animations: 'disabled',
  });
  const withExternal = structuredClone(database);
  withExternal.workouts[1].exercises[0].externalImpediment = true;
  await page.addInitScript(
    (db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)),
    withExternal,
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByTestId('load-reduction-hint')).toHaveCount(0);
  await expect(
    page.getByRole('img', { name: 'Último treino: Impedimento externo', exact: true }),
  ).toBeVisible();
});

test('observações livres persistem no exercício e preservam snapshots de treinos anteriores', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina', exact: true }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Observações');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Rosca');
  await page.getByLabel('Observações do exercício 1', { exact: true }).fill('Barra W');
  await page.getByRole('button', { name: 'Remover série 3 do exercício 1', exact: true }).click();
  await page.getByRole('button', { name: 'Remover série 2 do exercício 1', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  const note = page.getByLabel('Observações de Rosca', { exact: true });
  const editNote = page.getByRole('button', { name: 'Editar observações de Rosca', exact: true });
  const summary = page.getByTestId('exercise-note-summary');
  await expect(note).toHaveCount(0);
  await expect(summary).toContainText('Observações: Barra W');
  const summaryBounds = await summary.boundingBox();
  const firstSetBounds = await page
    .getByLabel('Rosca série 1 carga em kg', { exact: true })
    .boundingBox();
  expect(summaryBounds!.y + summaryBounds!.height).toBeLessThan(firstSetBounds!.y);
  await editNote.click();
  await expect(note).toHaveValue('Barra W');
  await note.fill('Rascunho cancelado');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(note).toHaveCount(0);
  await expect(summary).toContainText('Observações: Barra W');
  await editNote.click();
  await expect(note).toHaveValue('Barra W');
  await note.fill('Rascunho fechado');
  await page.getByRole('button', { name: 'Fechar observações', exact: true }).click();
  await expect(summary).toContainText('Observações: Barra W');
  await page.getByLabel('Rosca série 1 carga em kg', { exact: true }).fill('10');
  const done = page.getByRole('checkbox', { name: 'Concluir Rosca série 1', exact: true });
  await done.click();
  await editNote.click();
  await note.fill('Máquina\nBanco 2');
  await page.screenshot({
    path: 'test-results/treino-observacoes-modal-20261013.png',
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Salvar observações', exact: true }).click();
  await expect(note).toHaveCount(0);
  await expect(done).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('@ritmo/database/v1')!).routines[0].exercises[0].note,
      ),
    )
    .toBe('Máquina\nBanco 2');
  await page.reload();
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(summary).toContainText('Observações: Máquina\nBanco 2');
  await page.screenshot({
    path: 'test-results/treino-observacoes-20261013.png',
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page
    .getByRole('button', { name: /^Ver treino Observações/ })
    .first()
    .click();
  await expect(page.getByText(/Observações: Máquina/)).toBeVisible();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(summary).toContainText('Observações: Máquina\nBanco 2');
  await editNote.click();
  await expect(note).toHaveValue('Máquina\nBanco 2');
  await note.fill('Barra reta');
  await page.getByRole('button', { name: 'Salvar observações', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar depois', exact: true }).click();
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Observações', exact: true }).click();
  await expect(page.getByLabel('Observações do exercício 1', { exact: true })).toHaveValue(
    'Barra reta',
  );
  await page.getByLabel('Observações do exercício 1', { exact: true }).fill('Máquina futura');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const db = JSON.parse(localStorage.getItem('@ritmo/database/v1')!);
        return [
          db.active.exercises[0].note,
          db.workouts[0].exercises[0].note,
          db.routines[0].exercises[0].note,
        ];
      }),
    )
    .toEqual(['Barra reta', 'Máquina\nBanco 2', 'Máquina futura']);
});

test('lápis permite adicionar e remover observação vazia sem campo aberto nas séries', async ({
  page,
}) => {
  const routine = newRoutine();
  routine.name = 'Nota vazia';
  routine.exercises[0].name = 'Supino';
  await page.addInitScript(
    (db) => {
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
    },
    { ...emptyDatabase(), routines: [routine], active: startWorkout(routine) },
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  const edit = page.getByRole('button', { name: 'Editar observações de Supino', exact: true });
  const note = page.getByLabel('Observações de Supino', { exact: true });
  const summary = page.getByTestId('exercise-note-summary');
  await expect(summary).toContainText('Adicionar observação');
  await expect(note).toHaveCount(0);
  await edit.click();
  await expect(note).toHaveValue('');
  await note.fill('Banco 2');
  await page.getByRole('button', { name: 'Salvar observações', exact: true }).click();
  await expect(summary).toContainText('Observações: Banco 2');
  await edit.click();
  await note.fill('');
  await page.getByRole('button', { name: 'Salvar observações', exact: true }).click();
  await expect(summary).toContainText('Adicionar observação');
  await expect(note).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const db = JSON.parse(localStorage.getItem('@ritmo/database/v1')!);
        return [db.active.exercises[0].note, db.routines[0].exercises[0].note];
      }),
    )
    .toEqual(['', '']);
});
