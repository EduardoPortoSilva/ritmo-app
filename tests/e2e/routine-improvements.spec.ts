import { expect, test } from '@playwright/test';
import { emptyDatabase, newExercise, newRoutine } from '../../src/model';

test('consulta, alterações reais, aplicação explícita e descanso persistido por série', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina' }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Nova rotina', exact: true }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Treino ABC');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Supino');
  const reps = (i: number) => page.getByLabel(`Repetições exercício 1 série ${i}`, { exact: true });
  const rest = (i: number) => page.getByLabel(`Descanso exercício 1 série ${i}`, { exact: true });
  await rest(1).fill('60');
  await expect(rest(2)).toHaveValue('');
  await page
    .getByRole('button', { name: 'Aplicar descanso da série 1 a todas · exercício 1', exact: true })
    .click();
  await expect(rest(3)).toHaveValue('60');
  await reps(1).fill('15');
  await expect(reps(2)).toHaveValue('12');
  await page
    .getByRole('button', {
      name: 'Aplicar repetições da série 1 a todas · exercício 1',
      exact: true,
    })
    .click();
  await expect(reps(3)).toHaveValue('15');
  await reps(1).fill('12');
  await reps(2).fill('10');
  await reps(3).fill('8');
  await rest(2).fill('90');
  await rest(3).fill('120');
  await page.getByRole('button', { name: 'Adicionar série', exact: true }).click();
  await expect(rest(4)).toHaveValue('120');
  await page.getByRole('button', { name: 'Remover série 4 do exercício 1' }).click();
  await rest(1).fill('-1');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await expect(page.getByText(/Use descansos inteiros/)).toBeVisible();
  await page.getByRole('button', { name: 'Entendi' }).click();
  await rest(1).fill('60');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await expect(page.getByText('Confira sua rotina', { exact: true })).toBeVisible();
  for (const value of [
    '12 repetições',
    '10 repetições',
    '8 repetições',
    'Descanso: 60 s',
    'Descanso: 90 s',
    'Descanso: 120 s',
  ])
    await expect(page.getByText(value, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.waitForTimeout(400); // Let the validation dialog's native/web fade finish.
  await page.screenshot({ path: 'test-results/consulta-rotina.png' });
  await page.getByRole('button', { name: 'Editar Treino ABC', exact: true }).click();
  await rest(2).fill('30');
  await rest(2).fill('90');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?')).toHaveCount(0);
  await expect(page.getByText('Confira sua rotina', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar Treino ABC', exact: true }).click();
  await rest(2).fill('30');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?')).toBeVisible();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await expect(page.getByText('Confira sua rotina', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Ver rotina Treino ABC', exact: true }).click();
  await expect(page.getByText('Descanso: 90 s', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(page.getByText('Série 2 · Descanso: 90 s', { exact: true })).toBeVisible();
  await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('20');
  await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page.getByRole('button', { name: /^Ver treino Treino ABC/ }).click();
  await expect(page.getByText('Descanso: 90 s', { exact: true })).toBeVisible();
});

test('resume apenas metas iguais e preserva a consulta ao voltar do editor', async ({ page }) => {
  const routine = newRoutine();
  routine.name = 'ABC - Base / C';
  routine.exercises = [
    {
      ...newExercise(),
      name: 'Agachamento goblet',
      reps: ['10', '10', '10'],
      rests: ['90', '90', '90'],
    },
    {
      ...newExercise(),
      name: 'Mesa flexora',
      reps: ['12', '12', '12'],
      rests: ['60', '90', '120'],
    },
    {
      ...newExercise(),
      name: 'Desenvolvimento',
      reps: ['12', '10', '8'],
      rests: ['60', '60', '60'],
    },
    { ...newExercise(), name: 'Sem descanso', reps: ['10', '10'], rests: ['0', '0'] },
    { ...newExercise(), name: 'Legado', reps: ['12', '12'] },
    { ...newExercise(), name: 'Parcial', reps: ['12', '12'], rests: ['', '0'] },
  ];
  await page.addInitScript((db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)), {
    ...emptyDatabase(),
    routines: [routine],
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: `Ver rotina ${routine.name}`, exact: true }).click();
  const exercise = (i: number) => page.getByTestId(`routine-exercise-${i}`);
  await expect(
    exercise(1).getByText('3 × 10 repetições · Descanso: 90 s', { exact: true }),
  ).toBeVisible();
  await expect(exercise(1).getByText('Série 1', { exact: true })).toHaveCount(0);
  await expect(exercise(2).getByText('Descanso: 120 s', { exact: true })).toBeVisible();
  await expect(exercise(3).getByText('8 repetições', { exact: true })).toBeVisible();
  await expect(
    exercise(4).getByText('2 × 10 repetições · Descanso: 0 s', { exact: true }),
  ).toBeVisible();
  await expect(
    exercise(5).getByText('2 × 12 repetições · Descanso não definido', { exact: true }),
  ).toBeVisible();
  await expect(exercise(6).getByText('Descanso não definido', { exact: true })).toBeVisible();
  await expect(exercise(6).getByText('Descanso: 0 s', { exact: true })).toBeVisible();

  await exercise(1).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/reviewer-resumo-series.png' });
  await page.getByRole('button', { name: 'Ver séries de Agachamento goblet', exact: true }).click();
  await expect(exercise(1).getByText('10 repetições', { exact: true })).toHaveCount(3);
  const edit = page.getByRole('button', { name: `Editar ${routine.name}`, exact: true });
  await edit.scrollIntoViewIfNeeded();
  const reading = page.getByTestId('routine-reading');
  // Keep the edit action on screen at a nonzero offset; capture the actual position before leaving.
  await reading.evaluate((element) => {
    element.scrollTop = 160;
  });
  await expect.poll(() => reading.evaluate((element) => element.scrollTop)).toBe(160);
  await page.waitForTimeout(100); // React Native Web throttles scroll events.
  await edit.click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?', { exact: true })).toHaveCount(0);
  await expect.poll(() => reading.evaluate((element) => element.scrollTop)).toBe(160);
  await expect(
    page.getByRole('button', { name: 'Ocultar séries de Agachamento goblet' }),
  ).toHaveAttribute('aria-expanded', 'true');

  await edit.click();
  const first = page.getByLabel('Repetições exercício 1 série 1', { exact: true });
  const second = page.getByLabel('Repetições exercício 1 série 2', { exact: true });
  const apply = page.getByRole('button', {
    name: 'Aplicar repetições da série 1 a todas · exercício 1',
    exact: true,
  });
  await first.scrollIntoViewIfNeeded();
  const firstBox = (await first.boundingBox())!;
  const applyBox = (await apply.boundingBox())!;
  const secondBox = (await second.boundingBox())!;
  expect(applyBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
  expect(applyBox.y + applyBox.height).toBeLessThan(secondBox.y);
  await page.screenshot({ path: 'test-results/reviewer-atalhos-serie1.png' });
  await first.fill('11');
  await expect(second).toHaveValue('10');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await expect.poll(() => reading.evaluate((element) => element.scrollTop)).toBe(160);
  await expect(exercise(1).getByText('10 repetições', { exact: true })).toHaveCount(3);
  await edit.click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('C atualizada');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Editar C atualizada', exact: true }),
  ).toBeVisible();
  await expect.poll(() => reading.evaluate((element) => element.scrollTop)).toBe(160);
  await expect(
    page.getByRole('button', { name: 'Ocultar séries de Agachamento goblet' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Minhas rotinas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar C atualizada', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Minhas rotinas', { exact: true })).toBeVisible();
});
