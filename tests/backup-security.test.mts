import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_FORMAT, createBackup, parseBackup } from '../src/backup.ts';
import {
  emptyDatabase,
  newRoutine,
  parseDatabase,
  startWorkout,
  type Database,
} from '../src/model.ts';

function fixture(): Database {
  const routine = newRoutine();
  routine.name = 'Força';
  routine.exercises[0].name = 'Supino';
  const active = startWorkout(routine);
  const finished = structuredClone(active);
  finished.id = 'sessao-finalizada';
  finished.finishedAt = '2026-10-13T12:00:00Z';
  Object.assign(finished.exercises[0].sets[0], { done: true, weight: '0' });
  return { ...emptyDatabase(), routines: [routine], active, workouts: [finished] };
}

// Bypass the exporter to model an externally edited backup.
const envelope = (database: Database) =>
  JSON.stringify({
    format: BACKUP_FORMAT,
    exportedAt: '2026-10-13T12:00:00Z',
    database,
  });

test('recusa IDs repetidos no planejamento, histórico, exercícios e séries sem alterar a entrada', () => {
  const mutations: ((db: Database) => void)[] = [
    (db) => db.routines.push({ ...structuredClone(db.routines[0]), name: 'Outra rotina' }),
    (db) => db.workouts.push({ ...structuredClone(db.workouts[0]), name: 'Outro treino' }),
    (db) => db.routines[0].exercises.push(structuredClone(db.routines[0].exercises[0])),
    (db) => db.active!.exercises.push(structuredClone(db.active!.exercises[0])),
    (db) => db.workouts[0].exercises.push(structuredClone(db.workouts[0].exercises[0])),
    (db) => db.active!.exercises[0].sets.push(structuredClone(db.active!.exercises[0].sets[0])),
    (db) =>
      db.workouts[0].exercises[0].sets.push(structuredClone(db.workouts[0].exercises[0].sets[0])),
  ];
  for (const mutate of mutations) {
    const db = fixture();
    mutate(db);
    const before = structuredClone(db);
    assert.throws(() => parseBackup(envelope(db)), /dados do backup são inválidos/);
    assert.throws(() => parseDatabase(JSON.stringify(db)));
    assert.deepEqual(db, before);
  }
});

test('recusa IDs vazios ou compostos só por espaços no banco de força', () => {
  for (const id of ['', ' \t']) {
    const mutations: ((db: Database) => void)[] = [
      (db) => {
        db.routines[0].id = id;
      },
      (db) => {
        db.routines[0].exercises[0].id = id;
      },
      (db) => {
        db.active!.id = id;
      },
      (db) => {
        db.active!.routineId = id;
      },
      (db) => {
        db.active!.exercises[0].id = id;
      },
      (db) => {
        db.active!.exercises[0].sets[0].id = id;
      },
      (db) => {
        db.workouts[0].id = id;
      },
    ];
    for (const mutate of mutations) {
      const db = fixture();
      mutate(db);
      assert.throws(() => parseBackup(envelope(db)));
    }
  }
});

test('recusa planejamento de força vazio, sem nome, com metas inválidas ou séries em excesso', () => {
  const mutations: ((db: Database) => void)[] = [
    (db) => {
      db.routines[0].name = ' ';
    },
    (db) => {
      db.routines[0].exercises = [];
    },
    (db) => {
      db.routines[0].exercises[0].name = '';
    },
    (db) => {
      db.routines[0].exercises[0].reps = [];
    },
    (db) => {
      db.routines[0].exercises[0].reps = Array(21).fill('12');
    },
    ...['inválida', '0', '1000', '1.5', '-1'].map((rep) => (db: Database) => {
      db.routines[0].exercises[0].reps = [rep];
    }),
    (db) => {
      db.active!.exercises = [];
    },
    (db) => {
      db.active!.exercises[0].sets = [];
    },
    (db) => {
      db.active!.exercises[0].sets[0].target = 'inválida';
    },
    (db) => {
      Object.assign(db.active!.exercises[0].sets[0], { done: true, reps: '12', weight: '-1' });
    },
  ];
  for (const mutate of mutations) {
    const db = fixture();
    mutate(db);
    assert.throws(() => parseBackup(envelope(db)));
  }
});

test('mantém snapshots legados independentes e campos pendentes sem normalizar ou apagar dados', () => {
  const db = fixture();
  const other = structuredClone(db.routines[0]);
  other.id = 'outra-rotina';
  // A copied exercise can retain its ID in a different scope.
  db.routines.push(other);
  db.active!.exercises[0].sets[0].reps = '';
  db.active!.exercises[0].sets[0].weight = '-';
  db.workouts[0].exercises[0].sets[1].reps = 'rascunho parcial';
  db.workouts[0].exercises[0].sets[1].weight = '';
  // Deleted planning is not needed to read the historic snapshot.
  db.workouts[0].routineId = 'rotina-excluida';
  const before = structuredClone(db);
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.deepEqual(db, before);
});
