import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emptyDatabase,
  newRoutine,
  parseDatabase,
  startWorkout,
  type Database,
} from '../src/model.ts';
import {
  activeRoutines,
  activateRoutineSet,
  attachToActiveSet,
  deleteRoutineSet,
  pruneRoutineSetLinks,
  removeRoutineFromSets,
  saveRoutineSet,
  setStrengthPaused,
} from '../src/routineSets.ts';
import { widgetSnapshot } from '../src/widgetSnapshot.ts';

function fixture(): Database {
  const a = { ...newRoutine(), name: 'Treino A' };
  const b = { ...newRoutine(), name: 'Treino B' };
  return { ...emptyDatabase(), routines: [a, b] };
}

test('o primeiro conjunto preserva as rotinas existentes em um plano ativo', () => {
  const original = fixture();
  const alternative = { id: 'novo', name: 'Plano novo', routineIds: [original.routines[0].id] };
  const db = saveRoutineSet(original, alternative);
  assert.equal(db.routineSets?.length, 2);
  assert.deepEqual(
    activeRoutines(db).map((r) => r.name),
    ['Treino A', 'Treino B'],
  );
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.deepEqual(
    activeRoutines(activateRoutineSet(db, 'novo')).map((r) => r.name),
    ['Treino A'],
  );
  assert.deepEqual(
    activeRoutines(activateRoutineSet(db, db.routineSets![0].id)).map((r) => r.name),
    ['Treino A', 'Treino B'],
  );
});

test('a mesma rotina pode estar em vários conjuntos e o widget usa apenas o ativo', () => {
  const original = fixture();
  original.routines[0].weekdays = [1];
  original.routines[1].weekdays = [2];
  let db = saveRoutineSet(original, {
    id: 'novo',
    name: 'Plano novo',
    routineIds: [original.routines[0].id],
  });
  db = activateRoutineSet(db, 'novo');
  assert.deepEqual(
    JSON.parse(widgetSnapshot(db)).routines.map((r: { name: string }) => r.name),
    ['Treino A'],
  );
  const c = { ...newRoutine(), name: 'Treino C' };
  db = attachToActiveSet({ ...db, routines: [...db.routines, c] }, [c.id]);
  assert.deepEqual(
    activeRoutines(db).map((r) => r.name),
    ['Treino A', 'Treino C'],
  );
  assert.deepEqual(db.routineSets![0].routineIds, [
    original.routines[0].id,
    original.routines[1].id,
  ]);
});

test('exclusão limpa vínculos sem apagar histórico ou outras rotinas', () => {
  const original = fixture();
  let db = saveRoutineSet(original, {
    id: 'novo',
    name: 'Plano novo',
    routineIds: [original.routines[0].id],
  });
  const removed = original.routines[0].id;
  db = removeRoutineFromSets(
    { ...db, routines: db.routines.filter((r) => r.id !== removed) },
    removed,
  );
  assert.ok(db.routineSets!.every((set) => !set.routineIds.includes(removed)));
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  db = deleteRoutineSet(db, 'novo');
  assert.equal(db.routineSets?.length, 1);
  db = deleteRoutineSet(db, db.routineSets![0].id);
  assert.equal(db.routineSets, undefined);
  assert.equal(db.routines.length, 1);
});

test('remoção de treino em uma divisão não deixa vínculos órfãos', () => {
  const original = fixture();
  const linked = saveRoutineSet(original, {
    id: 'novo',
    name: 'Novo ciclo',
    routineIds: original.routines.map((routine) => routine.id),
  });
  const next = pruneRoutineSetLinks({ ...linked, routines: linked.routines.slice(1) });
  assert.ok(next.routineSets!.every((set) => set.routineIds.length === 1));
  assert.deepEqual(parseDatabase(JSON.stringify(next)), next);
});

test('recusa conjuntos com referências quebradas ou IDs repetidos', () => {
  const db = fixture();
  assert.throws(() => saveRoutineSet(db, { id: 'a', name: 'Novo', routineIds: ['missing'] }));
  assert.throws(() =>
    saveRoutineSet(db, {
      id: 'a',
      name: 'Novo',
      routineIds: [db.routines[0].id, db.routines[0].id],
    }),
  );
  const valid = saveRoutineSet(db, { id: 'a', name: 'Novo', routineIds: [] });
  assert.throws(() => parseDatabase(JSON.stringify({ ...valid, activeRoutineSetId: 'missing' })));
  assert.throws(() =>
    parseDatabase(
      JSON.stringify({
        ...valid,
        routineSets: [{ id: 'x', name: 'Erro', routineIds: ['missing'] }],
      }),
    ),
  );
});

test('pausa apenas o planejamento de força e retoma o conjunto anterior sem perda de dados', () => {
  const original = fixture();
  original.routines[0].weekdays = [1];
  original.active = startWorkout(original.routines[0]);
  original.cardioRoutines = [];
  original.cardioHistory = [];
  const linked = saveRoutineSet(original, {
    id: 'novo',
    name: 'Novo ciclo',
    routineIds: [original.routines[0].id],
  });
  const paused = setStrengthPaused(linked, true);
  assert.deepEqual(activeRoutines(paused), []);
  assert.deepEqual(JSON.parse(widgetSnapshot(paused)).routines, []);
  assert.equal(paused.active, original.active);
  assert.equal(paused.cardioRoutines, original.cardioRoutines);
  assert.equal(paused.cardioHistory, original.cardioHistory);
  assert.deepEqual(parseDatabase(JSON.stringify(paused)), paused);
  const resumed = setStrengthPaused(paused, false);
  assert.equal(resumed.strengthPaused, undefined);
  assert.deepEqual(activeRoutines(resumed), original.routines);
  assert.deepEqual(activeRoutines(activateRoutineSet(paused, 'novo')), [original.routines[0]]);
  assert.throws(() => parseDatabase(JSON.stringify({ ...paused, strengthPaused: 'sim' })));
});
