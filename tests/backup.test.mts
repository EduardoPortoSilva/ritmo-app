import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_FORMAT, backupSummary, createBackup, parseBackup } from '../src/backup.ts';
import { emptyDatabase, newRoutine, startWorkout } from '../src/model.ts';
import { MAX_DATABASE_BYTES, utf8ByteLength } from '../src/backupLimits.ts';
import { newCardioRoutine, resumeCardio, startCardio, finishCardio } from '../src/cardio.ts';

test('backup completo preserva planejamento, histórico, sessões e suplementos', () => {
  const routine = newRoutine();
  routine.name = 'Força';
  routine.exercises[0].name = 'Supino';
  routine.exercises[0].muscles = [{ nodeId: 'chest', role: 'primary' }];
  const active = startWorkout(routine);
  const finished = structuredClone(active);
  finished.id = 'treino-finalizado';
  finished.exercises[0].sets[0].reps = '12';
  finished.exercises[0].sets[0].weight = '20';
  finished.exercises[0].sets[0].done = true;
  finished.finishedAt = '2026-09-30T12:00:00.000Z';
  const cardio = newCardioRoutine();
  cardio.name = 'Esteira';
  cardio.steps = [{ id: 'etapa', minutes: '1', speed: '6' }];
  const activeCardio = resumeCardio(startCardio(cardio), Date.parse('2026-09-30T12:00:00Z'));
  const cardioSession = finishCardio(activeCardio, '0.1', Date.parse('2026-09-30T12:01:00Z'));
  const database = {
    ...emptyDatabase(),
    routines: [routine],
    routineSets: [{ id: 'plano', name: 'Plano atual', routineIds: [routine.id] }],
    activeRoutineSetId: 'plano',
    workouts: [finished],
    active,
    cardioRoutines: [cardio],
    activeCardio,
    cardioHistory: [cardioSession],
    supplements: [
      {
        id: 'creatina',
        name: 'Creatina',
        note: '',
        createdAt: '2026-09-30T12:00:00.000Z',
        takenOn: ['2026-09-30'],
      },
    ],
  };
  const original = structuredClone(database);
  const json = createBackup(database, '2026-09-30T13:00:00.000Z');
  const parsed = parseBackup(json);
  assert.equal(JSON.parse(json).format, BACKUP_FORMAT);
  assert.deepEqual(parsed.database, database);
  assert.deepEqual(database, original);
  assert.deepEqual(backupSummary(parsed.database), {
    routines: 1,
    workouts: 1,
    cardioRoutines: 1,
    cardioHistory: 1,
    supplements: 1,
    activeWorkout: true,
    activeCardio: true,
  });
});

test('backup inválido é recusado antes de substituir dados', () => {
  const valid = JSON.parse(createBackup(emptyDatabase()));
  for (const bad of [
    'isto não é JSON',
    '{}',
    JSON.stringify({ ...valid, format: 'ritmo/1' }),
    JSON.stringify({ ...valid, exportedAt: 'sem data' }),
    JSON.stringify({ ...valid, database: { ...valid.database, version: 2 } }),
    JSON.stringify({ ...valid, database: { ...valid.database, workouts: [{}] } }),
    ' '.repeat(20_000_001),
  ]) {
    assert.throws(() => parseBackup(bad));
  }
});

test('backup com banco acima do limite Android e recusado antes de restaurar', () => {
  const database = emptyDatabase();
  database.routines[0] = newRoutine();
  database.routines[0].note = 'x'.repeat(MAX_DATABASE_BYTES);
  const contents = createBackup(database);
  assert.throws(() => parseBackup(contents), /limite seguro de armazenamento/);
  assert.equal(utf8ByteLength('a\u00e7\u{1F3CB}'), 7);
});
