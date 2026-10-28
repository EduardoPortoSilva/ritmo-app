import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDatabase,
  newRoutine,
  startWorkout,
  finishWorkout,
  parseDatabase,
} from '../src/model.ts';
import { applyFormulaBulk, parseFormulaBulk } from '../src/formulaBulk.ts';
import { createBackup, parseBackup } from '../src/backup.ts';
import { estimateWorkoutEnergy, type EnergyModel } from '../src/energy.ts';
import { doseModelExample, recordDose, substanceAmount } from '../src/substances.ts';

const originalModel = (): EnergyModel => ({
  formula: {
    expression: 'totalLoad*reps*k',
    parameters: { k: 0.01 },
    reference: 'Modelo original fictício para teste.',
  },
  loadBasis: 'total',
  loadMultiplier: 1,
  secondsPerRep: 3,
});

function fixture() {
  const routine = newRoutine();
  routine.name = 'Preservar histórico';
  Object.assign(routine.exercises[0], {
    name: 'Supino',
    reps: ['10', '8'],
    rests: ['90', '120'],
    energyModel: originalModel(),
  });
  const active = startWorkout(routine, [], { weightKg: '80', heightCm: '180' });
  Object.assign(active.exercises[0].sets[0], { weight: '20', done: true });
  const finished = { ...structuredClone(active), id: 'original', finishedAt: active.startedAt };
  const legacy = structuredClone(finished);
  legacy.id = 'sem-formula';
  delete legacy.exercises[0].energyModel;
  const db = { ...emptyDatabase(), routines: [routine], active, workouts: [finished, legacy] };
  return parseDatabase(JSON.stringify(db));
}

const changes: { name: string; model: EnergyModel | null; kcal: number | null }[] = [
  {
    name: 'expressão',
    model: {
      ...originalModel(),
      formula: { ...originalModel().formula, expression: 'totalLoad*reps*k+1' },
    },
    kcal: 3,
  },
  {
    name: 'parâmetro',
    model: { ...originalModel(), formula: { ...originalModel().formula, parameters: { k: 0.5 } } },
    kcal: 100,
  },
  {
    name: 'passos intermediários',
    model: {
      ...originalModel(),
      formula: {
        ...originalModel().formula,
        steps: ['totalLoad*2', 'v1*reps'],
        expression: 'v2*k',
      },
    },
    kcal: 4,
  },
  {
    name: 'lados e equipamento',
    model: { ...originalModel(), loadBasis: 'per-side', loadMultiplier: 2 },
    kcal: 8,
  },
  {
    name: 'cadência',
    model: {
      ...originalModel(),
      secondsPerRep: 4,
      formula: { ...originalModel().formula, expression: 'seconds' },
    },
    kcal: 40,
  },
  { name: 'remoção do modelo', model: null, kcal: null },
];

for (const change of changes) {
  test(`alterar ${change.name} preserva histórico, ativo, calorias antigas e backup`, () => {
    const db = fixture();
    const before = JSON.stringify(db);
    const history = JSON.stringify(db.workouts);
    const active = JSON.stringify(db.active);
    const oldEstimates = db.workouts.map(estimateWorkoutEnergy);
    assert.equal(oldEstimates[0].kcal, 2);
    assert.equal(oldEstimates[1].kcal, null);
    const text = JSON.stringify({
      formato: 'ritmo-formulas/1',
      exercicios: [
        {
          rotinaId: db.routines[0].id,
          exercicioId: db.routines[0].exercises[0].id,
          calorias: change.model,
        },
      ],
    });
    const plan = parseFormulaBulk(text, db);
    assert.equal(JSON.stringify(db), before, 'prévia não grava');
    const updated = applyFormulaBulk(db, plan);
    assert.equal(JSON.stringify(db), before, 'aplicar não modifica o banco recebido');
    for (const next of [
      updated,
      parseDatabase(JSON.stringify(updated)),
      parseBackup(createBackup(updated)).database,
    ]) {
      assert.equal(JSON.stringify(next.workouts), history);
      assert.equal(JSON.stringify(next.active), active);
      assert.deepEqual(next.workouts.map(estimateWorkoutEnergy), oldEstimates);
      assert.equal(estimateWorkoutEnergy(next.active!).kcal, 2);
      const future = startWorkout(next.routines[0], next.workouts);
      Object.assign(future.exercises[0].sets[0], { weight: '20', done: true });
      assert.equal(estimateWorkoutEnergy(future).kcal, change.kcal);
      assert.deepEqual(future.exercises[0].energyModel, change.model ?? undefined);
      const finished = finishWorkout(next, '80', '180');
      assert.equal(
        estimateWorkoutEnergy(finished.workouts[0]).kcal,
        2,
        'ativo finaliza com o modelo original',
      );
      assert.equal(JSON.stringify(finished.workouts.slice(1)), history);
    }
  });
}

test('múltiplas correções mantêm cada sessão com sua cópia independente do modelo', () => {
  let db = fixture();
  const originalHistory = JSON.stringify(db.workouts);
  for (const k of [0.1, 0.2, 0.3]) {
    const model = originalModel();
    model.formula.parameters.k = k;
    const plan = parseFormulaBulk(
      JSON.stringify({
        formato: 'ritmo-formulas/1',
        exercicios: [
          {
            rotinaId: db.routines[0].id,
            exercicioId: db.routines[0].exercises[0].id,
            calorias: model,
          },
        ],
      }),
      db,
    );
    db = applyFormulaBulk(db, plan);
    const workout = startWorkout(db.routines[0]);
    Object.assign(workout.exercises[0].sets[0], { weight: '20', done: true });
    db = finishWorkout({ ...db, active: workout });
    model.formula.parameters.k = 999;
    plan.exercises[0].model!.formula.parameters.k = 888;
    db = parseBackup(createBackup(db)).database;
  }
  assert.deepEqual(
    db.workouts.slice(0, 3).map((w) => estimateWorkoutEnergy(w).kcal),
    [60, 40, 20],
  );
  assert.equal(JSON.stringify(db.workouts.slice(3)), originalHistory);
  assert.equal(db.routines[0].exercises[0].energyModel!.formula.parameters.k, 0.3);
});

test('lote inválido ou prévia desatualizada não grava parcialmente nem altera histórico', () => {
  const db = fixture();
  const before = JSON.stringify(db);
  const item = {
    rotinaId: db.routines[0].id,
    exercicioId: db.routines[0].exercises[0].id,
    calorias: changes[1].model,
  };
  assert.throws(() =>
    parseFormulaBulk(
      JSON.stringify({
        formato: 'ritmo-formulas/1',
        exercicios: [item, { ...item, exercicioId: 'inexistente' }],
      }),
      db,
    ),
  );
  assert.equal(JSON.stringify(db), before);
  const plan = parseFormulaBulk(
    JSON.stringify({ formato: 'ritmo-formulas/1', exercicios: [item] }),
    db,
  );
  const changed = structuredClone(db);
  changed.routines[0].exercises[0].energyModel!.formula.parameters.k = 0.4;
  const changedBefore = JSON.stringify(changed);
  assert.throws(() => applyFormulaBulk(changed, plan), /mudaram/);
  assert.equal(JSON.stringify(changed), changedBefore);
  assert.equal(JSON.stringify(changed.workouts), JSON.stringify(db.workouts));
});

test('corrigir modelo de substância preserva ingestões antigas e suas projeções', () => {
  const model = {
    ...doseModelExample(),
    halfLifeHours: 2,
    formula: { expression: 'd*0.5^(t/h)', parameters: {}, reference: 'Modelo fictício de teste.' },
  };
  const substance = recordDose(
    { id: 's', name: 'Teste', unit: 'mg', model, doses: [] },
    { id: 'dose-original', amount: 100, at: '2026-10-19T12:00:00Z' },
    Date.parse('2026-10-19T14:00:00Z'),
  );
  const db = { ...fixture(), substances: [substance] };
  const before = JSON.stringify(db);
  const correction = { ...structuredClone(model), halfLifeHours: 1 };
  const next = applyFormulaBulk(
    db,
    parseFormulaBulk(
      JSON.stringify({
        formato: 'ritmo-formulas/1',
        substancias: [{ id: 's', modelo: correction }],
      }),
      db,
    ),
  );
  for (const persisted of [next, parseBackup(createBackup(next)).database]) {
    const s = persisted.substances![0];
    assert.deepEqual(s.doses, substance.doses);
    for (const hour of [12, 13, 14, 18]) {
      const at = Date.parse(`2026-10-19T${hour}:00:00Z`);
      assert.equal(substanceAmount(s, at), substanceAmount(substance, at));
    }
    const future = recordDose(
      s,
      { id: 'nova-dose', amount: 100, at: '2026-10-19T14:00:00Z' },
      Date.parse('2026-10-19T15:00:00Z'),
    );
    assert.deepEqual(future.doses[0], substance.doses[0]);
    assert.deepEqual(future.doses[1].model, correction);
  }
  assert.equal(JSON.stringify(db), before);
});
