import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newRoutine,
  emptyDatabase,
  parseDatabase,
  startWorkout,
  routineError,
  routineDraftKey,
  validRest,
} from '../src/model.ts';

test('descansos opcionais validam limites e preservam o banco antigo', () => {
  const routine = newRoutine();
  routine.name = 'A';
  routine.exercises[0].name = 'Supino';
  assert.equal(routineError(routine), null);
  assert.doesNotThrow(() =>
    parseDatabase(JSON.stringify({ ...emptyDatabase(), routines: [routine] })),
  );
  for (const value of ['', '0', '60', '3600']) assert.equal(validRest(value), true);
  for (const value of ['-1', '1.5', '3601', 'abc']) assert.equal(validRest(value), false);
  routine.exercises[0].rests = ['60'];
  assert.ok(routineError(routine));
  assert.throws(() => parseDatabase(JSON.stringify({ ...emptyDatabase(), routines: [routine] })));
  routine.exercises[0].rests = ['60', '90', '120'];
  routine.exercises[0].reps = ['12', '10', '8'];
  const active = startWorkout(routine);
  routine.exercises[0].rests[0] = '30';
  assert.deepEqual(
    active.exercises[0].sets.map((s) => s.rest),
    ['60', '90', '120'],
  );
  const parsed = parseDatabase(JSON.stringify({ ...emptyDatabase(), routines: [routine], active }));
  assert.equal(parsed.active?.exercises[0].sets[0].rest, '60');
  active.exercises[0].sets[0].rest = '-1';
  assert.throws(() => parseDatabase(JSON.stringify({ ...emptyDatabase(), active })));
});

test('rascunho compara valores e ignora ausência equivalente e ordem dos dias', () => {
  const routine = newRoutine();
  const copy = structuredClone(routine);
  copy.exercises[0].rests = ['', '', ''];
  delete copy.weekdays;
  assert.equal(routineDraftKey(routine), routineDraftKey(copy));
  copy.exercises[0].rests[1] = '90';
  assert.notEqual(routineDraftKey(routine), routineDraftKey(copy));
  copy.exercises[0].rests[1] = '';
  routine.weekdays = [1, 3];
  copy.weekdays = [3, 1];
  assert.equal(routineDraftKey(routine), routineDraftKey(copy));
});
