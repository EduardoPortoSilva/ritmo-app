import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newDivision,
  newRoutine,
  emptyDatabase,
  saveDivision,
  divisionError,
  divisionDraftKey,
  parseDatabase,
  startWorkout,
  exerciseTotalLoadHistory,
  exerciseHistoryOptions,
  type Workout,
} from '../src/model.ts';

function fixture() {
  const routine = newRoutine();
  routine.name = 'A';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].reps = ['12', '10', '8'];
  routine.exercises[0].rests = ['60', '90', '120'];
  return routine;
}

test('divisão valida todos os treinos e salva sem alterar histórico, sessão ativa ou rotinas avulsas', () => {
  const standalone = fixture();
  const active = startWorkout(standalone);
  const saved = structuredClone(active);
  saved.finishedAt = '2026-09-26T12:00:00Z';
  saved.exercises[0].sets[0] = { ...saved.exercises[0].sets[0], done: true, weight: '20' };
  const db = { ...emptyDatabase(), routines: [standalone], active, workouts: [saved] };
  const before = structuredClone(db);
  const division = { ...newDivision(), name: ' ABC ', routines: [fixture(), fixture()] };
  const key = divisionDraftKey(division);
  const next = saveDivision(db, division);
  assert.deepEqual(db, before);
  assert.equal(next.active, active);
  assert.equal(next.workouts, db.workouts);
  assert.equal(next.routines[0], standalone);
  assert.equal(next.routines[1].division?.name, 'ABC');
  assert.deepEqual(next.routines[1].exercises[0].rests, ['60', '90', '120']);
  assert.deepEqual(parseDatabase(JSON.stringify(next)), next);
  assert.equal(divisionDraftKey(division), key);
  const edited = { ...division, name: 'Nova divisão', routines: [next.routines[2]] };
  const updated = saveDivision(next, edited);
  assert.equal(updated.routines.length, 2);
  assert.equal(updated.routines[1].id, next.routines[2].id);
  assert.equal(updated.routines[1].exercises[0].id, next.routines[2].exercises[0].id);
  assert.equal(updated.routines[1].division?.name, 'Nova divisão');
  assert.equal(updated.active, active);
  assert.equal(updated.workouts, db.workouts);
  assert.ok(divisionError({ ...division, routines: [] }));
  const invalid = { ...division, routines: [fixture(), newRoutine()] };
  assert.match(divisionError(invalid)!, /Treino 2/);
  assert.throws(() => saveDivision(db, invalid));
  assert.throws(() => saveDivision(db, { ...division, routines: [standalone] }));
  assert.throws(() =>
    saveDivision(db, { ...division, routines: [division.routines[0], division.routines[0]] }),
  );
  assert.throws(() =>
    parseDatabase(
      JSON.stringify({
        ...next,
        routines: [{ ...next.routines[1], division: { id: '', name: 'ABC' } }],
      }),
    ),
  );
  assert.doesNotThrow(() => parseDatabase(JSON.stringify(db)));
});

test('total por exercício soma apenas séries válidas concluídas, preserva zero, decimais, IDs e datas', () => {
  const routine = fixture();
  const workout = startWorkout(routine);
  workout.id = 'first';
  workout.finishedAt = '2026-09-26T12:00:00Z';
  workout.exercises[0].sets.forEach((set, i) => {
    set.done = true;
    set.weight = ['20', '25', '30'][i];
  });
  const second = structuredClone(workout);
  second.id = 'second';
  second.finishedAt = '2026-09-26T13:00:00Z';
  second.exercises[0].sets[0].weight = '20,5';
  second.exercises[0].sets[1].done = false;
  second.exercises[0].sets[2].weight = '';
  const zero = structuredClone(workout);
  zero.id = 'zero';
  zero.finishedAt = '2026-09-27T12:00:00Z';
  zero.exercises[0].sets.forEach((set) => {
    set.weight = '0';
  });
  const other = structuredClone(workout);
  other.routineId = 'other';
  const pending = startWorkout(routine);
  pending.finishedAt = '2026-09-28T12:00:00Z';
  const unfinished = { ...workout, finishedAt: undefined };
  const history: Workout[] = [pending, zero, second, workout, other, unfinished];
  const before = structuredClone(history);
  const records = exerciseTotalLoadHistory(history, routine.id, routine.exercises[0].id);
  assert.deepEqual(
    records.map((record) => [record.workoutId, record.weight]),
    [
      ['first', 730],
      ['second', 246],
      ['zero', 0],
    ],
  );
  assert.deepEqual(exerciseTotalLoadHistory(history, routine.id, 'missing'), []);
  assert.equal(exerciseHistoryOptions(history).length, 2);
  assert.deepEqual(history, before);
});
