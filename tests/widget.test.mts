import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDatabase, newRoutine, startWorkout } from '../src/model.ts';
import { widgetSnapshot } from '../src/widgetSnapshot.ts';

test('widget recebe apenas programação e conclusões salvas, sem peso ou séries', () => {
  const a = { ...newRoutine(), name: 'Treino A', weekdays: [1, 3] };
  const free = { ...newRoutine(), name: 'Livre' };
  const finished = startWorkout(a);
  finished.finishedAt = '2026-09-14T18:00:00Z';
  finished.bodyWeight = '80';
  finished.exercises[0].sets[0].done = true;
  const db = {
    ...emptyDatabase(),
    routines: [a, free],
    active: { ...finished, finishedAt: undefined },
    workouts: [
      finished,
      { ...finished, routineId: 'rotina-excluida' },
      { ...finished, routineId: free.id },
      { ...finished, finishedAt: undefined },
      { ...finished, finishedAt: 'inválido' },
      { ...finished, exercises: [] },
    ],
  };
  const before = JSON.stringify(db);
  assert.deepEqual(JSON.parse(widgetSnapshot(db)), {
    routines: [{ id: a.id, name: a.name, weekdays: [1, 3] }],
    completions: [{ routineId: a.id, finishedAt: Date.parse(finished.finishedAt) }],
  });
  assert.equal(JSON.stringify(db), before);
  assert.deepEqual(JSON.parse(widgetSnapshot({ ...db, workouts: [] })).completions, []);
  assert.deepEqual(JSON.parse(widgetSnapshot({ ...db, routines: [] })), {
    routines: [],
    completions: [],
  });
});
