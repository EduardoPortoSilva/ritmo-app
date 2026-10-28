import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout, parseDatabase } from '../../src/model';
import type { EnergyModel } from '../../src/energy';

const model = (k: number, reference = 'Modelo original fictício de teste.'): EnergyModel => ({
  formula: { expression: 'totalLoad*reps*k', steps: [], parameters: { k }, reference },
  loadBasis: 'total',
  loadMultiplier: 1,
  secondsPerRep: 3,
});
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));

for (const scenario of [
  'trocar em lote',
  'remover em lote',
  'adicionar depois',
  'editar manualmente',
] as const) {
  test(`${scenario}: histórico continua com 2 kcal e só o próximo treino muda`, async ({
    page,
  }) => {
    const routine = newRoutine();
    routine.name = 'Teste fórmulas';
    Object.assign(routine.exercises[0], {
      name: 'Supino',
      reps: ['10'],
      rests: ['90'],
      energyModel: model(0.01),
    });
    const archive = startWorkout(routine, [], { weightKg: '80', heightCm: '180' });
    Object.assign(archive.exercises[0].sets[0], { weight: '20', done: true });
    const original = { ...structuredClone(archive), id: 'original', finishedAt: archive.startedAt };
    const legacy = structuredClone(original);
    legacy.id = 'sem-formula';
    delete legacy.exercises[0].energyModel;
    if (scenario === 'adicionar depois') delete routine.exercises[0].energyModel;
    const active = startWorkout(routine, [], { weightKg: '80', heightCm: '180' });
    Object.assign(active.exercises[0].sets[0], { weight: '20', done: true });
    const db = { ...emptyDatabase(), routines: [routine], active, workouts: [original, legacy] };
    expect(() => parseDatabase(JSON.stringify(db))).not.toThrow();
    await page.addInitScript((db) => {
      if (!localStorage.getItem('@ritmo/database/v1'))
        localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
    }, db);
    await page.goto('/');
    await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
    const replacement =
      scenario === 'remover em lote' ? null : model(0.5, 'Modelo novo fictício de teste.');
    if (scenario === 'editar manualmente') {
      await page.getByRole('button', { name: 'Editar Teste fórmulas', exact: true }).click();
      await page.getByRole('button', { name: 'Editar calorias de Supino', exact: true }).click();
      await page.getByLabel('Parâmetros (JSON)', { exact: true }).fill('{"k":0.5}');
      await page
        .getByLabel('Referência e hipóteses', { exact: true })
        .fill('Modelo novo fictício de teste.');
      await page.getByRole('button', { name: 'Salvar modelo de calorias', exact: true }).click();
      await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Editar fórmulas em lote', exact: true }).click();
      await page.getByLabel('JSON de fórmulas em lote', { exact: true }).fill(
        JSON.stringify({
          formato: 'ritmo-formulas/1',
          exercicios: [
            { rotinaId: routine.id, exercicioId: routine.exercises[0].id, calorias: replacement },
          ],
        }),
      );
      await page
        .getByRole('button', { name: 'Conferir alterações de fórmulas', exact: true })
        .click();
      await expect(page.getByTestId('formula-bulk-preview')).toContainText(
        '1 exercício · 0 substâncias',
      );
      expect(await stored(page)).toEqual(JSON.parse(JSON.stringify(db)));
      await page.getByRole('button', { name: 'Aplicar fórmulas da prévia', exact: true }).click();
    }
    await page.reload();
    const updated = await stored(page);
    expect(JSON.stringify(updated.workouts)).toBe(JSON.stringify(db.workouts));
    expect(updated.active).toEqual(JSON.parse(JSON.stringify(active)));
    expect(updated.routines[0].exercises[0].energyModel ?? null).toEqual(replacement);

    await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
    await page.getByTestId('history-workout-original').click();
    const summary = page.getByTestId('strength-energy');
    await expect(summary).toContainText('≈ 2 kcal');
    await page.getByRole('button', { name: 'Ver cálculo de calorias', exact: true }).click();
    await expect(summary).toContainText('Modelo original fictício de teste.');
    await expect(summary).toContainText('0.01');
    await expect(summary).not.toContainText('Modelo novo fictício');
    if (scenario === 'trocar em lote') {
      await summary.screenshot({ path: 'test-results/historico-formula-original-preservada.png' });
    }
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await page.getByTestId('history-workout-sem-formula').click();
    await expect(summary).toHaveCount(0);
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();

    await page.getByRole('tab', { name: 'Início', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
    if (scenario === 'adicionar depois') await expect(summary).toHaveCount(0);
    else await expect(summary).toContainText('≈ 2 kcal');
    await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
    const finished = await stored(page);
    expect(finished.workouts[0].exercises).toEqual(active.exercises);
    expect(finished.workouts.slice(1)).toEqual(JSON.parse(JSON.stringify(db.workouts)));

    await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
    await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('20');
    await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
    if (replacement) await expect(summary).toContainText('≈ 100 kcal');
    else await expect(summary).toHaveCount(0);
    const future = await stored(page);
    expect(future.active.exercises[0].energyModel ?? null).toEqual(replacement);
    expect(future.workouts).toEqual(finished.workouts);
  });
}
