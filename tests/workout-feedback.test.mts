import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDatabase,
  finishWorkout,
  newRoutine,
  parseDatabase,
  previousRoutineWorkouts,
  startWorkout,
  suggestsLoadIncrease,
  suggestsLoadDecrease,
  setActiveExerciseNote,
  routineDraftKey,
  type Workout,
} from '../src/model.ts';
import { createBackup, parseBackup } from '../src/backup.ts';

function fixture() {
  const routine = newRoutine();
  routine.name = 'A';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].reps = ['12', '10'];
  const sessions = ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'].map((date) => {
    const workout = startWorkout(routine);
    workout.finishedAt = date;
    workout.exercises[0].sets.forEach((set, index) =>
      Object.assign(set, { weight: index ? '12,5' : '0', done: true }),
    );
    return workout;
  });
  const current = startWorkout(routine, sessions);
  return { routine, sessions, current };
}

test('lembretes são opcionais, persistem em sessão e histórico e não viram marcações novas', () => {
  const { routine, current } = fixture();
  const legacy = { ...emptyDatabase(), routines: [routine], active: current };
  assert.deepEqual(parseDatabase(JSON.stringify(legacy)), legacy);
  for (const loadAdjustment of ['increase', 'maintain', 'decrease'] as const) {
    const db = structuredClone(legacy);
    Object.assign(db.active!.exercises[0], {
      loadAdjustment,
      cramp: true,
      externalImpediment: true,
    });
    Object.assign(db.active!.exercises[0].sets[0], { weight: '10', done: true });
    assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
    const saved = finishWorkout(db);
    assert.deepEqual(parseBackup(createBackup(saved)).database, JSON.parse(JSON.stringify(saved)));
    assert.equal(
      parseDatabase(JSON.stringify(saved)).workouts[0].exercises[0].loadAdjustment,
      loadAdjustment,
    );
    assert.equal(saved.workouts[0].exercises[0].cramp, true);
    assert.equal(saved.workouts[0].exercises[0].externalImpediment, true);
    const next = startWorkout(routine, saved.workouts);
    assert.equal(next.exercises[0].loadAdjustment, undefined);
    assert.equal(next.exercises[0].cramp, undefined);
    assert.equal(next.exercises[0].externalImpediment, undefined);
    assert.equal(next.exercises[0].sets[0].weight, '10');
  }
  for (const invalid of [null, 'up', 'toString', 'constructor', 1]) {
    const db = structuredClone(legacy);
    Object.assign(db.active!.exercises[0], { loadAdjustment: invalid });
    assert.throws(() => parseDatabase(JSON.stringify(db)));
  }
  for (const invalid of [null, 'true', 1]) {
    const db = structuredClone(legacy);
    Object.assign(db.active!.exercises[0], { cramp: invalid });
    assert.throws(() => parseDatabase(JSON.stringify(db)));
    const external = structuredClone(legacy);
    Object.assign(external.active!.exercises[0], { externalImpediment: invalid });
    assert.throws(() => parseDatabase(JSON.stringify(external)));
  }
});

test('redução exige maioria abaixo de metade da meta em cada um dos dois últimos treinos', () => {
  const routine = newRoutine();
  routine.name = 'A';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].reps = ['12', '10', '8'];
  const sessions = ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'].map((finishedAt, index) => {
    const workout = startWorkout(routine);
    workout.finishedAt = finishedAt;
    workout.exercises[0].sets.forEach((set, i) =>
      Object.assign(set, { weight: String(20 + index), reps: ['5', '4', '4'][i], done: true }),
    );
    return workout;
  });
  const current = startWorkout(routine, sessions).exercises[0];
  assert.ok(suggestsLoadDecrease(current, sessions));
  for (const index of [0, 1]) {
    const external = structuredClone(sessions);
    external[index].exercises[0].externalImpediment = true;
    assert.ok(!suggestsLoadDecrease(current, external));
  }
  assert.ok(!suggestsLoadDecrease(current, sessions.slice(0, 1)));
  const changes: ((workout: Workout) => void)[] = [
    (w) => {
      w.exercises[0].sets[0].reps = '6';
    },
    (w) => {
      w.exercises[0].sets[1].reps = '5';
    },
    (w) => {
      w.exercises[0].sets[0].done = false;
    },
    (w) => {
      w.exercises[0].sets[0].weight = '';
    },
    (w) => {
      w.exercises[0].sets[0].reps = '0';
    },
    (w) => {
      w.exercises[0].sets[0].target = '10';
    },
    (w) => {
      w.exercises[0].sets.pop();
    },
    (w) => {
      w.exercises[0].id = 'other';
    },
  ];
  for (const change of changes)
    for (const index of [0, 1]) {
      const modified = structuredClone(sessions);
      change(modified[index]);
      assert.ok(!suggestsLoadDecrease(current, modified));
    }
  const withImpediment = structuredClone(sessions);
  Object.assign(withImpediment[1].exercises[0], { cramp: true, loadAdjustment: 'maintain' });
  assert.ok(suggestsLoadDecrease(current, withImpediment));
  const odd = structuredClone(sessions);
  const oddCurrent = structuredClone(current);
  oddCurrent.sets[0].target = '11';
  odd.forEach((workout) => {
    workout.exercises[0].sets[0].target = '11';
  });
  assert.ok(suggestsLoadDecrease(oddCurrent, odd));
  const evenCurrent = { ...current, sets: [...current.sets, { ...current.sets[2], target: '8' }] };
  const evenSessions = structuredClone(sessions);
  evenSessions.forEach((w) => w.exercises[0].sets.push({ ...w.exercises[0].sets[2] }));
  assert.ok(!suggestsLoadDecrease(evenCurrent, evenSessions));
  evenSessions.forEach((w) => {
    w.exercises[0].sets[3].reps = '3';
  });
  assert.ok(suggestsLoadDecrease(evenCurrent, evenSessions));
});

test('observações pertencem ao exercício, persistem no planejamento e não alteram histórico', () => {
  const { routine, sessions } = fixture();
  routine.exercises[0].note = 'Barra W\nBanco 2';
  const active = startWorkout(routine, sessions);
  assert.equal(active.exercises[0].note, routine.exercises[0].note);
  const database = { ...emptyDatabase(), routines: [routine], workouts: sessions, active };
  const before = structuredClone(database);
  const updated = setActiveExerciseNote(
    database,
    active.exercises[0].id,
    'Máquina / pegada aberta',
  );
  assert.equal(updated.active!.exercises[0].note, 'Máquina / pegada aberta');
  assert.equal(updated.routines[0].exercises[0].note, 'Máquina / pegada aberta');
  assert.notEqual(routineDraftKey(updated.routines[0]), routineDraftKey(routine));
  assert.deepEqual(updated.workouts, before.workouts);
  assert.deepEqual(database, before);
  assert.equal(
    startWorkout(updated.routines[0], sessions).exercises[0].note,
    'Máquina / pegada aberta',
  );
  assert.deepEqual(
    parseBackup(createBackup(updated)).database,
    JSON.parse(JSON.stringify(updated)),
  );
  assert.equal(
    setActiveExerciseNote(updated, active.exercises[0].id, '').active!.exercises[0].note,
    '',
  );
  assert.throws(() => setActiveExerciseNote(updated, active.exercises[0].id, 'x'.repeat(301)));
  const orphan = { ...database, routines: [] };
  assert.equal(
    setActiveExerciseNote(orphan, active.exercises[0].id, 'Barra').active!.exercises[0].note,
    'Barra',
  );
  assert.deepEqual(
    setActiveExerciseNote({ ...database, active: null }, active.exercises[0].id, 'Barra'),
    { ...database, active: null },
  );
  for (const invalid of [null, 1, 'x'.repeat(301)]) {
    const malformed = structuredClone(database);
    Object.assign(malformed.routines[0].exercises[0], { note: invalid });
    assert.throws(() => parseDatabase(JSON.stringify(malformed)));
    const malformedActive = structuredClone(database);
    Object.assign(malformedActive.active.exercises[0], { note: invalid });
    assert.throws(() => parseDatabase(JSON.stringify(malformedActive)));
  }
});

test('progressão exige duas sessões consecutivas com todas as metas e cargas correspondentes iguais', () => {
  const { sessions, current } = fixture();
  const exercise = current.exercises[0];
  const previous = previousRoutineWorkouts(sessions, current.routineId);
  assert.ok(suggestsLoadIncrease(exercise, previous));
  for (const index of [0, 1]) {
    const external = structuredClone(previous);
    external[index].exercises[0].externalImpediment = true;
    assert.ok(!suggestsLoadIncrease(exercise, external));
  }
  assert.ok(!suggestsLoadIncrease(exercise, previous.slice(0, 1)));
  assert.deepEqual(
    sessions.map((item) => item.finishedAt),
    ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'],
  );
  const changes: ((workout: Workout) => void)[] = [
    (w) => {
      w.exercises[0].sets[0].done = false;
    },
    (w) => {
      w.exercises[0].sets[0].reps = '11';
    },
    (w) => {
      w.exercises[0].sets[1].weight = '15';
    },
    (w) => {
      w.exercises[0].sets[0].weight = '';
    },
    (w) => {
      w.exercises[0].sets[0].reps = 'abc';
    },
    (w) => {
      w.exercises[0].sets[0].target = '8';
    },
    (w) => {
      w.exercises[0].sets.pop();
    },
    (w) => {
      w.exercises[0].id = 'another-exercise';
    },
  ];
  for (const change of changes) {
    for (const index of [0, 1]) {
      const modified = structuredClone(previous);
      change(modified[index]);
      assert.ok(!suggestsLoadIncrease(exercise, modified));
    }
  }
  const decimal = structuredClone(previous);
  decimal[0].exercises[0].sets[1].weight = '12.5';
  decimal[0].exercises[0].sets[0].reps = '15';
  assert.ok(suggestsLoadIncrease(exercise, decimal));
  assert.ok(
    !suggestsLoadIncrease({ ...exercise, sets: [...exercise.sets, exercise.sets[0]] }, previous),
  );
  for (const feedback of [
    { cramp: true },
    { loadAdjustment: 'maintain' as const },
    { loadAdjustment: 'decrease' as const },
  ]) {
    const modified = structuredClone(previous);
    Object.assign(modified[0].exercises[0], feedback);
    assert.ok(!suggestsLoadIncrease(exercise, modified));
  }
});

test('consulta anterior separa rotinas e não pula sessão parcial ou exercício ausente', () => {
  const { sessions, current } = fixture();
  const other = { ...sessions[1], routineId: 'other', finishedAt: '2026-10-04T12:00:00Z' };
  const invalid = { ...other, routineId: current.routineId, finishedAt: 'invalid' };
  const history = [other, sessions[0], { ...current }, sessions[1], invalid];
  assert.deepEqual(previousRoutineWorkouts(history, current.routineId), [sessions[1], sessions[0]]);
  const partial = structuredClone(sessions[1]);
  partial.finishedAt = '2026-10-05T12:00:00Z';
  partial.exercises[0].sets[0].done = false;
  assert.ok(
    !suggestsLoadIncrease(
      current.exercises[0],
      previousRoutineWorkouts([...sessions, partial], current.routineId),
    ),
  );
});
