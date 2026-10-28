import { expect, test, type Page } from '@playwright/test';
import {
  emptyDatabase,
  newRoutine,
  startWorkout,
  parseDatabase,
  type Database,
} from '../../src/model';
import { doseModelExample, recordDose } from '../../src/substances';

test.use({ timezoneId: 'UTC' });

async function stored(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!));
}
async function substances(page: Page) {
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await page.getByRole('button', { name: 'Acompanhar substâncias', exact: true }).click();
}
async function seed(page: Page, db: Database) {
  await page.addInitScript((db) => {
    if (!localStorage.getItem('@ritmo/database/v1'))
      localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
  }, db);
  await page.goto('/');
}

test('substância aceita modelo personalizado, acumula doses e preserva fórmulas antigas após editar', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-19T15:00:00Z'));
  await page.goto('/');
  await substances(page);
  await page.getByRole('button', { name: 'Nova substância', exact: true }).click();
  await page.getByLabel('Nome da substância', { exact: true }).fill('Modelo A');
  await page.getByLabel('Expressão', { exact: true }).fill('F(t-1)');
  await page.getByRole('button', { name: 'Salvar substância', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Função não permitida');
  await page.getByLabel('Expressão', { exact: true }).fill('d * 0.5^(t/h)');
  await page.getByLabel('Meia-vida de eliminação (horas)', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Salvar substância', exact: true }).click();
  await expect(page.getByTestId('substance-projection')).toContainText('0 mg');
  for (const [hour, amount] of [
    ['14:00', '100'],
    ['15:00', '100'],
  ]) {
    await page.getByRole('button', { name: 'Registrar ingestão de Modelo A', exact: true }).click();
    await page.getByLabel('Quantidade (mg)', { exact: true }).fill(amount);
    await page.getByLabel('Data da ingestão (AAAA-MM-DD)', { exact: true }).fill('2026-10-19');
    await page.getByLabel('Horário da ingestão (HH:mm)', { exact: true }).fill(hour);
    await page.getByRole('button', { name: 'Salvar ingestão', exact: true }).click();
  }
  await expect(page.getByTestId('substance-projection')).toContainText('170,7 mg');
  const before = (await stored(page)).substances[0].doses;
  await page.getByRole('button', { name: 'Editar modelo da substância', exact: true }).click();
  await page.getByLabel('Meia-vida de eliminação (horas)', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Salvar substância', exact: true }).click();
  expect((await stored(page)).substances[0].doses).toEqual(before);
  await expect(page.getByTestId('substance-projection')).toContainText('170,7 mg');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .getByTestId('substance-projection')
      .screenshot({ path: `test-results/substancias-curva-${width}.png` });
  }
  await page.reload();
  await substances(page);
  await expect(page.getByTestId('substance-projection')).toContainText('170,7 mg');
  await page
    .getByRole('button', { name: 'Excluir ingestão de 100 mg', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  await expect(page.getByTestId('substance-projection')).toContainText('70,7 mg');
});

test('modelo acumulado importado usa residuais e entradas inválidas não substituem dados', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-19T15:00:00Z'));
  await page.goto('/');
  await substances(page);
  await page.getByRole('button', { name: 'Importar modelo de substância', exact: true }).click();
  const model = {
    ...doseModelExample(),
    mode: 'state',
    halfLifeHours: 2,
    formula: {
      expression: '(p1+d/(1+d/100))*0.5^(t/h)',
      parameters: {},
      reference: 'Modelo não linear de teste.',
    },
  };
  await page
    .getByLabel('JSON do modelo da substância', { exact: true })
    .fill(JSON.stringify({ name: 'Modelo conjunto', unit: 'mg', model }));
  await page.getByRole('button', { name: 'Conferir modelo importado', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar substância', exact: true }).click();
  for (const hour of ['11:00', '13:00', '15:00']) {
    await page
      .getByRole('button', { name: 'Registrar ingestão de Modelo conjunto', exact: true })
      .click();
    await page.getByLabel('Quantidade (mg)', { exact: true }).fill('100');
    await page.getByLabel('Horário da ingestão (HH:mm)', { exact: true }).fill(hour);
    await page.getByRole('button', { name: 'Salvar ingestão', exact: true }).click();
  }
  await expect(page.getByTestId('substance-projection')).toContainText('87,5 mg');
  expect((await stored(page)).substances[0].doses[2].prior).toEqual([37.5, 25, 0, 0]);
  await page
    .getByRole('button', { name: 'Registrar ingestão de Modelo conjunto', exact: true })
    .click();
  await page.getByLabel('Quantidade (mg)', { exact: true }).fill('10');
  await page.getByLabel('Horário da ingestão (HH:mm)', { exact: true }).fill('16:00');
  await page.getByRole('button', { name: 'Salvar ingestão', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('já ocorreu');
  expect((await stored(page)).substances[0].doses).toHaveLength(3);
  await page.getByRole('button', { name: 'Cancelar edição', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar editando', exact: true }).click();
  await expect(page.getByLabel('Quantidade (mg)', { exact: true })).toHaveValue('10');
});

test('calorias de força importadas usam perfil e lados, persistem na finalização e mostram a referência', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Dados para estimativas', exact: true }).click();
  await page.getByLabel('Peso de referência (kg)', { exact: true }).fill('80');
  await page.getByLabel('Altura de referência (cm)', { exact: true }).fill('180');
  await page.getByRole('button', { name: 'Salvar dados de referência', exact: true }).click();
  await page.getByRole('button', { name: 'Importar treinos por texto', exact: true }).click();
  const input = {
    formato: 'ritmo/1',
    treinos: [
      {
        nome: 'Força estimada',
        exercicios: [
          {
            nome: 'Supino',
            repeticoes: [10],
            calorias: {
              expressao: 'totalLoad*reps/100+bodyWeight/10+height/100+seconds/10',
              parametros: {},
              referencia: 'Modelo matemático de teste, sem validade fisiológica.',
              carga: 'por_lado',
              multiplicador: 1,
              segundosPorRepeticao: 3,
            },
          },
        ],
      },
    ],
  };
  await page.getByLabel('JSON de importação', { exact: true }).fill(JSON.stringify(input));
  await page.getByRole('button', { name: 'Conferir texto', exact: true }).click();
  await page
    .getByRole('button', { name: 'Ver detalhes do treino Força estimada', exact: true })
    .click();
  await expect(page.getByTestId('bulk-import-preview')).toContainText('Calorias por série');
  await page.getByRole('button', { name: 'Importar rotinas da prévia', exact: true }).click();
  await page.getByRole('button', { name: 'Importar rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await page.getByLabel('Supino série 1 carga em kg', { exact: true }).fill('20');
  await page.getByRole('checkbox', { name: 'Concluir Supino série 1', exact: true }).click();
  await expect(page.getByTestId('strength-energy')).toContainText('≈ 17 kcal');
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByLabel('Peso corporal (kg)', { exact: true }).fill('90');
  await expect(page.getByTestId('strength-energy')).toContainText('≈ 18 kcal');
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page.getByRole('button', { name: /^Ver treino Força estimada/ }).click();
  await expect(page.getByTestId('strength-energy')).toContainText('≈ 18 kcal');
  await page.getByRole('button', { name: 'Ver cálculo de calorias', exact: true }).click();
  await expect(page.getByTestId('strength-energy')).toContainText('Modelo matemático de teste');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .getByTestId('strength-energy')
      .screenshot({ path: `test-results/calorias-forca-${width}.png` });
  }
  const db = await stored(page);
  expect(db.workouts[0].bodyHeight).toBe('180');
  expect(db.workouts[0].bodyWeight).toBe('90');
});

test('modelo de calorias também pode ser criado manualmente no exercício', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina', exact: true }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Manual');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Remada');
  await page.getByRole('button', { name: 'Definir calorias de Remada', exact: true }).click();
  await page.getByRole('button', { name: 'Por halter (2 halteres)', exact: true }).click();
  await page.getByLabel('Expressão', { exact: true }).fill('v1 * reps');
  await page.getByLabel('Passos intermediários (opcional)', { exact: true }).fill('totalLoad * k');
  await page.getByLabel('Parâmetros (JSON)', { exact: true }).fill('{"k":0.01}');
  await page
    .getByLabel('Referência e hipóteses', { exact: true })
    .fill('Apenas exemplo matemático.');
  await page.getByRole('button', { name: 'Salvar modelo de calorias', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  const db = await stored(page);
  expect(db.routines[0].exercises[0].energyModel.loadBasis).toBe('per-hand');
  expect(db.routines[0].exercises[0].energyModel.formula.steps).toEqual(['totalLoad * k']);
});

test('JSON em lote atualiza exercício existente sem duplicar ou modificar histórico, ativo e ingestões', async ({
  page,
}) => {
  const routine = newRoutine();
  routine.name = 'Existente';
  routine.exercises[0].name = 'Supino';
  const active = startWorkout(routine);
  Object.assign(active.exercises[0].sets[0], { weight: '20', done: true });
  const old = { ...structuredClone(active), id: 'histórico', finishedAt: new Date().toISOString() };
  const substance = recordDose(
    { id: 's', name: 'Modelo', unit: 'mg', model: doseModelExample(), doses: [] },
    { id: 'd', amount: 100, at: '2026-10-19T12:00:00Z' },
    Date.parse('2026-10-19T13:00:00Z'),
  );
  const db = {
    ...emptyDatabase(),
    routines: [routine],
    active,
    workouts: [old],
    substances: [substance],
  };
  await seed(page, db);
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Editar fórmulas em lote', exact: true }).click();
  await page.getByRole('button', { name: 'Carregar catálogo no editor', exact: true }).click();
  const editor = page.getByLabel('JSON de fórmulas em lote', { exact: true });
  const catalog = JSON.parse(await editor.inputValue());
  expect(catalog.exercicios[0].exercicioId).toBe(routine.exercises[0].id);
  catalog.exercicios[0].calorias = {
    formula: {
      expression: 'totalLoad*reps*k',
      parameters: { k: 0.01 },
      reference: 'Modelo de teste',
    },
    loadBasis: 'per-side',
    loadMultiplier: 1,
    secondsPerRep: 3,
  };
  catalog.substancias[0].modelo.halfLifeHours = 8;
  await editor.fill(JSON.stringify(catalog));
  await page.getByRole('button', { name: 'Conferir alterações de fórmulas', exact: true }).click();
  await expect(page.getByTestId('formula-bulk-preview')).toContainText(
    '1 exercício · 1 substância',
  );
  expect((await stored(page)).routines[0].exercises[0].energyModel).toBeUndefined();
  await page
    .getByTestId('formula-bulk-preview')
    .screenshot({ path: 'test-results/formulas-lote-previa.png' });
  await page.getByRole('button', { name: 'Aplicar fórmulas da prévia', exact: true }).click();
  await page.reload();
  const next = await stored(page);
  expect(next.routines).toHaveLength(1);
  expect(next.routines[0].exercises[0].id).toBe(routine.exercises[0].id);
  expect(next.routines[0].exercises[0].energyModel.loadBasis).toBe('per-side');
  expect(next.active).toEqual(active);
  expect(next.workouts).toEqual([old]);
  expect(next.substances[0].doses).toEqual(substance.doses);
  expect(next.substances[0].model.halfLifeHours).toBe(8);
});

test('pedido de correção para IA copia só o catálogo e aplica a resposta após a prévia', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const routine = newRoutine();
  routine.name = 'Revisar fórmulas';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].energyModel = {
    formula: { expression: 'load*reps', parameters: {}, reference: 'Modelo matemático de teste.' },
    loadBasis: 'per-side',
    loadMultiplier: 1,
    secondsPerRep: 3,
  };
  const active = startWorkout(routine);
  Object.assign(active.exercises[0].sets[0], { weight: '20', done: true });
  const old = { ...structuredClone(active), id: 'antigo', finishedAt: new Date().toISOString() };
  const db = { ...emptyDatabase(), routines: [routine], active, workouts: [old] };
  expect(() => parseDatabase(JSON.stringify(db))).not.toThrow();
  await seed(page, db);
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Editar fórmulas em lote', exact: true }).click();
  const correction = page.getByLabel('Correção desejada (opcional)', { exact: true });
  await correction.fill('Revisar a normalização por lado do Supino.');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição em lote?', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar', exact: true }).last().click();
  await expect(
    page.getByRole('button', { name: 'Entendi', exact: true, includeHidden: true }),
  ).toHaveCount(0);
  await expect(correction).toHaveValue('Revisar a normalização por lado do Supino.');
  await page.getByRole('button', { name: 'Corrigir fórmulas com IA', exact: true }).click();
  await expect(page.getByText('Pedido de correção copiado.', { exact: false })).toBeVisible();
  const request = await page.evaluate(() => navigator.clipboard.readText());
  expect(request).toContain('Revisar a normalização por lado do Supino.');
  expect(request).toContain('Não remova modelos');
  const catalog = JSON.parse(request.split(/Catálogo atual:\r?\n/)[1]);
  expect(Object.keys(catalog).sort()).toEqual(['exercicios', 'formato', 'substancias']);
  expect(catalog.exercicios[0].calorias).toEqual(routine.exercises[0].energyModel);
  expect(await stored(page)).toEqual(JSON.parse(JSON.stringify(db)));
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await correction.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/corrigir-formulas-ia-${width}.png` });
  }
  catalog.exercicios[0].calorias.formula.expression = 'totalLoad*reps*k';
  catalog.exercicios[0].calorias.formula.parameters = { k: 0.01 };
  await page.evaluate((json) => navigator.clipboard.writeText(json), JSON.stringify(catalog));
  await page.getByRole('button', { name: 'Colar JSON de fórmulas', exact: true }).click();
  await page.getByRole('button', { name: 'Conferir alterações de fórmulas', exact: true }).click();
  await expect(page.getByTestId('formula-bulk-preview')).toContainText(
    '1 exercício · 0 substâncias',
  );
  expect(await stored(page)).toEqual(JSON.parse(JSON.stringify(db)));
  await page.getByRole('button', { name: 'Aplicar fórmulas da prévia', exact: true }).click();
  await page.reload();
  const next = await stored(page);
  const { energyModel: beforeModel, ...beforeExercise } = routine.exercises[0];
  const { energyModel: afterModel, ...afterExercise } = next.routines[0].exercises[0];
  expect(afterModel).toEqual(catalog.exercicios[0].calorias);
  expect(afterModel).not.toEqual(beforeModel);
  expect(afterExercise).toEqual(beforeExercise);
  expect(next.routines).toHaveLength(1);
  expect(next.active).toEqual(active);
  expect(next.workouts).toEqual([old]);
});
