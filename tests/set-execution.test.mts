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
} from '../src/model.ts';
import { createBackup, parseBackup } from '../src/backup.ts';

function fixture() {
  const routine = newRoutine();
  routine.name = 'A';
  routine.exercises[0].name = 'Supino';
  const workouts = ['2026-10-01T12:00:00Z', '2026-10-03T12:00:00Z'].map((finishedAt) => {
    const workout = startWorkout(routine);
    workout.finishedAt = finishedAt;
    workout.exercises[0].sets.forEach((set) => Object.assign(set, { weight: '20', done: true }));
    return workout;
  });
  return {
    ...emptyDatabase(),
    routines: [routine],
    workouts,
    active: startWorkout(routine, workouts),
  };
}

test('detalhes da série são opcionais e preservados no banco e backup, inclusive false', () => {
  const legacy = fixture();
  assert.deepEqual(parseDatabase(JSON.stringify(legacy)), legacy);
  const db = structuredClone(legacy);
  Object.assign(db.active!.exercises[0].sets[0], { longRest: true, restPause: true, cramp: true });
  Object.assign(db.active!.exercises[0].sets[1], {
    longRest: false,
    restPause: false,
    cramp: false,
  });
  Object.assign(db.workouts[1].exercises[0].sets[2], {
    longRest: true,
    restPause: false,
    cramp: true,
  });
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
  assert.equal(db.active!.exercises[0].sets[0].done, false);
});

test('finalizar preserva os detalhes por série; iniciar outro treino copia carga, sem copiar marcações', () => {
  const db = fixture();
  Object.assign(db.active!.exercises[0].sets[0], {
    longRest: true,
    restPause: true,
    cramp: true,
    done: true,
  });
  const original = structuredClone(db);
  const saved = finishWorkout(db);
  const flags = saved.workouts[0].exercises[0].sets[0];
  assert.equal(flags.longRest, true);
  assert.equal(flags.restPause, true);
  assert.equal(flags.cramp, true);
  assert.equal(flags.done, true);
  assert.deepEqual(db, original);
  assert.deepEqual(saved.routines, original.routines);
  assert.deepEqual(saved.workouts.slice(1), original.workouts);
  const next = startWorkout(db.routines[0], saved.workouts);
  assert.equal(next.exercises[0].sets[0].weight, '20');
  for (const set of next.exercises[0].sets) {
    assert.equal(set.longRest, undefined);
    assert.equal(set.restPause, undefined);
    assert.equal(set.cramp, undefined);
    assert.equal(set.done, false);
  }
});

test('parser e restauração recusam detalhes não booleanos no treino ativo e no histórico', () => {
  for (const field of ['longRest', 'restPause', 'cramp']) {
    for (const value of [null, 0, 1, 'true', [], {}]) {
      for (const scope of ['active', 'history']) {
        const db = fixture();
        const workout = scope === 'active' ? db.active! : db.workouts[0];
        Object.assign(workout.exercises[0].sets[0], { [field]: value });
        const raw = JSON.stringify(db);
        assert.throws(() => parseDatabase(raw), `${scope}/${field}/${JSON.stringify(value)}`);
        assert.throws(() =>
          parseBackup(
            JSON.stringify({
              format: 'ritmo-backup/1',
              exportedAt: '2026-10-16T12:00:00Z',
              database: db,
            }),
          ),
        );
        assert.equal(JSON.stringify(db), raw);
      }
    }
  }
});

test('descanso longo, rest-pause e cãibra por série não excluem por si sós a sugestão de subir carga', () => {
  const db = fixture();
  for (const workout of db.workouts) {
    workout.exercises[0].sets.forEach((set) =>
      Object.assign(set, { longRest: true, restPause: true, cramp: true }),
    );
  }
  const current = db.active!.exercises[0];
  const previous = previousRoutineWorkouts(db.workouts, db.routines[0].id);
  assert.equal(suggestsLoadIncrease(current, previous), true);
  previous[0].exercises[0].sets[0].reps = '11';
  assert.equal(suggestsLoadIncrease(current, previous), false);
});

test('impedimento legado permanece no exercício, sem atribuição automática a séries', () => {
  const db = fixture();
  db.active!.exercises[0].cramp = true;
  db.workouts[1].exercises[0].cramp = true;
  const parsed = parseDatabase(JSON.stringify(db));
  assert.deepEqual(parsed, db);
  assert.equal(parsed.active!.exercises[0].cramp, true);
  assert.ok(parsed.active!.exercises[0].sets.every((set) => set.cramp === undefined));
  assert.ok(parsed.workouts[1].exercises[0].sets.every((set) => set.cramp === undefined));
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
});
