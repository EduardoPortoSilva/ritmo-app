import { expect, test, type Page } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout, type Database } from '../../src/model';

test.use({ timezoneId: 'UTC' });
const now = '2026-10-20T15:00:00.000Z';
const fixture = (
  profileAt = '2026-10-05T15:00:00Z',
  historyAt = '2026-10-10T15:00:00Z',
): Database => {
  const routine = newRoutine();
  routine.name = 'Peso atual';
  Object.assign(routine.exercises[0], {
    name: 'Supino',
    reps: ['10'],
    energyModel: {
      formula: {
        expression: 'bodyWeight',
        parameters: {},
        reference: 'Fórmula de teste matemático',
      },
      loadBasis: 'total',
      loadMultiplier: 1,
      secondsPerRep: 3,
    },
  });
  const workout = startWorkout(routine);
  Object.assign(workout, { bodyWeight: '81', startedAt: historyAt, finishedAt: historyAt });
  Object.assign(workout.exercises[0].sets[0], { done: true, weight: '20' });
  return {
    ...emptyDatabase(),
    routines: [routine],
    workouts: [workout],
    bodyProfile: { weightKg: '80', heightCm: '180', weightRecordedAt: profileAt },
  };
};
async function start(page: Page, db: Database) {
  await page.clock.setFixedTime(new Date(now));
  await page.addInitScript((db) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
  }, db);
  await page.goto('/');
}
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));

test('aviso abaixo do destaque permite confirmar peso; alterar só altura não renova a pesagem', async ({
  page,
}) => {
  const db = fixture();
  await start(page, db);
  const notice = page.getByTestId('body-weight-reminder');
  await expect(notice).toContainText('10/10/2026');
  const hero = await page.getByText('Encontre seu ritmo.', { exact: true }).boundingBox();
  expect((await notice.boundingBox())!.y).toBeGreaterThan(hero!.y + hero!.height);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.screenshot({ path: `test-results/aviso-peso-${width}.png` });
    const bounds = (await notice.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
  }
  await page.getByRole('button', { name: 'Atualizar peso', exact: true }).click();
  await expect(page.getByLabel('Peso de referência (kg)', { exact: true })).toHaveValue('81');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(notice).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar peso', exact: true }).click();
  await page.getByLabel('Altura de referência (cm)', { exact: true }).fill('181');
  await page.getByRole('button', { name: 'Salvar dados de referência', exact: true }).click();
  await expect(notice).toBeVisible();
  expect((await stored(page)).bodyProfile).toEqual({
    weightKg: '81',
    heightCm: '181',
    weightRecordedAt: '2026-10-10T15:00:00Z',
  });
  await page.getByRole('button', { name: 'Atualizar peso', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar este peso para hoje', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await expect(notice).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar peso', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar este peso para hoje', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar dados de referência', exact: true }).click();
  await expect(notice).toHaveCount(0);
  expect((await stored(page)).bodyProfile.weightRecordedAt).toBe(now);
  expect((await stored(page)).workouts).toEqual(JSON.parse(JSON.stringify(db.workouts)));
  await page.reload();
  await expect(notice).toHaveCount(0);
});

for (const source of ['history', 'profile'] as const) {
  test(`peso mais recente no ${source} inicia cálculo, preenche finalização e preserva histórico`, async ({
    page,
  }) => {
    const db =
      source === 'history'
        ? fixture('2026-10-05T15:00:00Z', '2026-10-19T15:00:00Z')
        : fixture('2026-10-19T15:00:00Z', '2026-10-05T15:00:00Z');
    await start(page, db);
    await expect(page.getByTestId('body-weight-reminder')).toHaveCount(0);
    await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
    await expect(page.getByTestId('strength-energy')).toContainText(
      `≈ ${source === 'history' ? 81 : 80} kcal`,
    );
    await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
    await expect(page.getByLabel('Peso corporal (kg)', { exact: true })).toHaveValue(
      source === 'history' ? '81' : '80',
    );
    expect((await stored(page)).workouts).toEqual(JSON.parse(JSON.stringify(db.workouts)));
  });
}

test('sem data antiga pede confirmação; apagar peso remove a data e editar perfil preserva treino iniciado', async ({
  page,
}) => {
  const db = fixture();
  db.workouts = [];
  delete db.bodyProfile!.weightRecordedAt;
  db.active = startWorkout(db.routines[0], [], { weightKg: '75', heightCm: '175' });
  await start(page, db);
  await expect(page.getByTestId('body-weight-reminder')).toContainText('ainda não tem data');
  await page.getByRole('button', { name: 'Atualizar peso', exact: true }).click();
  await page.getByLabel('Peso de referência (kg)', { exact: true }).fill('82');
  await page.getByRole('button', { name: 'Salvar dados de referência', exact: true }).click();
  await expect(page.getByTestId('body-weight-reminder')).toHaveCount(0);
  expect((await stored(page)).bodyProfile.weightRecordedAt).toBe(now);
  expect((await stored(page)).active).toEqual(JSON.parse(JSON.stringify(db.active)));
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Dados para estimativas', exact: true }).click();
  await page.getByLabel('Peso de referência (kg)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Salvar dados de referência', exact: true }).click();
  expect((await stored(page)).bodyProfile).toEqual({ weightKg: '', heightCm: '180' });
  expect((await stored(page)).active).toEqual(JSON.parse(JSON.stringify(db.active)));
});

test('aviso aparece somente depois de completar sete dias, inclusive com o app aberto', async ({
  page,
}) => {
  await page.clock.install({ time: new Date(now) });
  const db = fixture('2026-10-05T15:00:00Z', '2026-10-13T15:00:00Z');
  await start(page, db);
  await expect(page.getByTestId('body-weight-reminder')).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-10-20T15:02:00Z'));
  await page.clock.runFor(60_001);
  await expect(page.getByTestId('body-weight-reminder')).toBeVisible();
});
