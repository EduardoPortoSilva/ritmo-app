import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDatabase,
  newExercise,
  newRoutine,
  startWorkout,
  parseDatabase,
} from '../src/model.ts';
import { doseModelExample, recordDose } from '../src/substances.ts';
import { exportFormulaCatalog, parseFormulaBulk, applyFormulaBulk } from '../src/formulaBulk.ts';
import { createBackup, parseBackup } from '../src/backup.ts';
import type { EnergyModel } from '../src/energy.ts';
const energy: EnergyModel = {
  formula: {
    expression: 'totalLoad*reps*k',
    parameters: { k: 0.01 },
    reference: 'Teste matemático',
  },
  loadBasis: 'total',
  loadMultiplier: 1,
  secondsPerRep: 3,
};
const fixture = () => {
  const routine = newRoutine();
  routine.name = 'Existente';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].energyModel = structuredClone(energy);
  routine.exercises.push({ ...newExercise(), name: 'Remada' });
  const active = startWorkout(routine);
  Object.assign(active.exercises[0].sets[0], { weight: '20', done: true });
  const finished = structuredClone(active);
  finished.id = 'history';
  finished.finishedAt = new Date().toISOString();
  const substance = recordDose(
    { id: 's', name: 'Substância', unit: 'mg', model: doseModelExample(), doses: [] },
    { id: 'd', at: '2026-10-19T12:00:00Z', amount: 100 },
    Date.parse('2026-10-19T13:00:00Z'),
  );
  return {
    ...emptyDatabase(),
    routines: [routine],
    active,
    workouts: [finished],
    substances: [substance],
  };
};
test('catálogo atualiza várias fórmulas por ID, preserva séries, sessões e modelos anteriores', () => {
  const db = fixture(),
    original = structuredClone(db),
    catalog = JSON.parse(exportFormulaCatalog(db));
  catalog.exercicios[0].calorias.formula.expression = 'load*reps';
  catalog.exercicios[0].exercicio = 'rótulo ignorado';
  catalog.exercicios[1].calorias = structuredClone(energy);
  catalog.substancias[0].modelo.halfLifeHours = 10;
  const plan = parseFormulaBulk(JSON.stringify(catalog), db);
  assert.equal(plan.exercises.length, 2);
  assert.equal(plan.substances.length, 1);
  const next = applyFormulaBulk(db, plan);
  assert.deepEqual(db, original);
  assert.deepEqual(next.active, db.active);
  assert.deepEqual(next.workouts, db.workouts);
  assert.deepEqual(next.substances![0].doses, db.substances[0].doses);
  assert.equal(next.routines[0].exercises[0].name, 'Supino');
  assert.deepEqual(
    next.routines[0].exercises.map((e) => [e.id, e.reps]),
    db.routines[0].exercises.map((e) => [e.id, e.reps]),
  );
  assert.deepEqual(parseBackup(createBackup(next)).database, JSON.parse(JSON.stringify(next)));
});
test('lote parcial remove fórmula sem tocar itens omitidos e não cria rotinas', () => {
  const db = fixture(),
    first = db.routines[0].exercises[0];
  const text = JSON.stringify({
    formato: 'ritmo-formulas/1',
    exercicios: [{ rotinaId: db.routines[0].id, exercicioId: first.id, calorias: null }],
  });
  const next = applyFormulaBulk(db, parseFormulaBulk(text, db));
  assert.equal(next.routines.length, 1);
  assert.equal(next.routines[0].exercises[0].energyModel, undefined);
  assert.deepEqual(next.routines[0].exercises[1], db.routines[0].exercises[1]);
  assert.deepEqual(next.substances, db.substances);
  assert.deepEqual(parseDatabase(JSON.stringify(next)), JSON.parse(JSON.stringify(next)));
});
test('duplicatas, IDs desconhecidos, modo incompatível, recursão e prévia desatualizada recusam lote inteiro', () => {
  const db = fixture(),
    catalog = JSON.parse(exportFormulaCatalog(db));
  assert.throws(() => parseFormulaBulk(JSON.stringify(catalog), db), /Nenhuma/);
  for (const mutate of [
    (c: any) => c.exercicios.push(c.exercicios[0]),
    (c: any) => (c.exercicios[0].exercicioId = 'não-existe'),
    (c: any) => (c.substancias[0].modelo.mode = 'state'),
    (c: any) => (c.exercicios[0].calorias.formula.expression = 'F(reps-1)'),
    (c: any) => (c.substancias[0].modelo.formula.steps = Array(5).fill('1')),
    (c: any) => (c.workouts = []),
  ]) {
    const copy = structuredClone(catalog);
    mutate(copy);
    assert.throws(() => parseFormulaBulk(JSON.stringify(copy), db));
  }
  catalog.exercicios[0].calorias.formula.expression = 'load*reps';
  const plan = parseFormulaBulk(JSON.stringify(catalog), db);
  const changed = structuredClone(db);
  changed.routines[0].exercises[0].energyModel!.formula.reference = 'Outra referência';
  assert.throws(() => applyFormulaBulk(changed, plan), /mudaram/);
  assert.equal(
    changed.routines[0].exercises[0].energyModel!.formula.expression,
    energy.formula.expression,
  );
});
