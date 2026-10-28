import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateWorkoutEnergy, energyModelError, type EnergyModel } from '../src/energy.ts';
import {
  emptyDatabase,
  newRoutine,
  startWorkout,
  finishWorkout,
  parseDatabase,
  routineDraftKey,
} from '../src/model.ts';
import { parseBulkImport, applyBulkImport } from '../src/bulkImport.ts';
const model = (): EnergyModel => ({
  formula: {
    expression: 'totalLoad * reps / 100 + bodyWeight/10 + height/100 + seconds/10',
    parameters: {},
    reference: 'Fórmula fictícia de teste; não é estimativa fisiológica.',
  },
  loadBasis: 'per-side',
  loadMultiplier: 1,
  secondsPerRep: 3,
});
const routine = () => {
  const r = newRoutine();
  r.name = 'Força';
  r.exercises[0].name = 'Supino';
  r.exercises[0].energyModel = model();
  return r;
};
test('calorias usam somente séries concluídas, normalizam lados e preservam a cópia do modelo e perfil', () => {
  const r = routine(),
    before = routineDraftKey(r);
  const w = startWorkout(r, [], { weightKg: '80', heightCm: '180' });
  Object.assign(w.exercises[0].sets[0], { weight: '20', reps: '10', done: true });
  const estimate = estimateWorkoutEnergy(w);
  assert.equal(estimate.kcal, 16.8);
  assert.equal(estimate.covered, 1);
  assert.equal(estimate.total, 1);
  r.exercises[0].energyModel!.formula.expression = '999';
  assert.notEqual(routineDraftKey(r), before);
  assert.equal(estimateWorkoutEnergy(w).kcal, 16.8);
  assert.equal(w.bodyHeight, '180');
  const db = finishWorkout({ ...emptyDatabase(), active: w }, '81', '179');
  assert.equal(db.workouts[0].bodyHeight, '179');
  assert.deepEqual(parseDatabase(JSON.stringify(db)), JSON.parse(JSON.stringify(db)));
});
test('dados ausentes e resultados inválidos aparecem como pendência, sem inventar zero', () => {
  const w = startWorkout(routine());
  Object.assign(w.exercises[0].sets[0], { weight: '20', done: true });
  let result = estimateWorkoutEnergy(w);
  assert.equal(result.kcal, null);
  assert.match(result.issues[0], /bodyWeight/);
  w.exercises[0].energyModel!.formula.expression = '1/0';
  assert.equal(estimateWorkoutEnergy(w).kcal, null);
  w.exercises[0].energyModel!.formula.expression = '-1';
  assert.equal(estimateWorkoutEnergy(w).kcal, null);
  w.exercises[0].energyModel!.formula.expression = 'load * reps';
  assert.equal(estimateWorkoutEnergy(w).kcal, 240);
  w.exercises[0].energyModel!.formula.expression = '0';
  assert.equal(estimateWorkoutEnergy(w).kcal, 0);
  w.exercises[0].energyModel!.loadMultiplier = 0;
  assert.ok(energyModelError(w.exercises[0].energyModel));
});
test('importação aceita fórmula com referência e rejeita lote inteiro quando modelo está incorreto', () => {
  const input = {
    formato: 'ritmo/1',
    treinos: [
      {
        nome: 'A',
        exercicios: [
          {
            nome: 'Supino',
            repeticoes: [10],
            calorias: {
              expressao: 'totalLoad * reps * k',
              parametros: { k: 0.01 },
              referencia: 'Teste matemático',
              carga: 'por_lado',
              multiplicador: 1,
              segundosPorRepeticao: 3,
            },
          },
        ],
      },
    ],
  };
  const db = applyBulkImport(emptyDatabase(), parseBulkImport(JSON.stringify(input)));
  assert.equal(db.routines[0].exercises[0].energyModel?.loadBasis, 'per-side');
  assert.deepEqual(parseDatabase(JSON.stringify(db)), JSON.parse(JSON.stringify(db)));
  for (const bad of ['F(reps-1)', 'Math.exp(load)', 'unknown + 1']) {
    const copy = structuredClone(input);
    copy.treinos[0].exercicios[0].calorias.expressao = bad;
    assert.throws(() => parseBulkImport(JSON.stringify(copy)), /calorias/);
  }
  const broken = structuredClone(db);
  broken.routines[0].exercises[0].energyModel!.secondsPerRep = 0;
  assert.throws(() => parseDatabase(JSON.stringify(broken)));
});
