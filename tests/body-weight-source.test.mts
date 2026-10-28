import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  latestBodyWeight,
  bodyWeightIsStale,
  startWorkout,
  newRoutine,
  emptyDatabase,
  parseDatabase,
  type Workout,
} from '../src/model.ts';
import { validProfile, estimateWorkoutEnergy } from '../src/energy.ts';
import { createBackup, parseBackup } from '../src/backup.ts';

const now = new Date('2026-10-20T15:00:00Z');
const routine = newRoutine();
routine.name = 'Teste';
routine.exercises[0].name = 'Supino';
const session = (weight: string, finishedAt: string): Workout => ({
  ...startWorkout(routine),
  bodyWeight: weight,
  finishedAt,
});
const profile = { weightKg: '80', heightCm: '180', weightRecordedAt: '2026-10-12T15:00:00Z' };

test('peso mais recente compara perfil e todas as sessões, sem depender da ordem ou da rotina', () => {
  const history = [
    session('79', '2026-10-10T15:00:00Z'),
    session('81,5', '2026-10-18T15:00:00Z'),
    session('78', '2026-10-05T15:00:00Z'),
  ];
  assert.equal(latestBodyWeight(history, profile)?.weight, '81,5');
  assert.equal(latestBodyWeight(history.toReversed(), profile)?.weight, '81,5');
  assert.equal(
    latestBodyWeight(history, { ...profile, weightRecordedAt: '2026-10-19T15:00:00Z' })?.weight,
    '80',
  );
  assert.equal(
    latestBodyWeight(
      [
        session('', now.toISOString()),
        session('0', now.toISOString()),
        { ...history[2], finishedAt: undefined },
        ...history,
      ],
      profile,
    )?.weight,
    '81,5',
  );
  assert.equal(
    latestBodyWeight([session('81', profile.weightRecordedAt)], profile)?.source,
    'history',
  );
});

test('perfil antigo sem data continua utilizável, mas não se sobrepõe ao histórico datado', () => {
  const legacy = { weightKg: '80', heightCm: '180' };
  assert.equal(latestBodyWeight([], legacy)?.weight, '80');
  assert.equal(latestBodyWeight([session('75', '2026-01-01T15:00:00Z')], legacy)?.weight, '75');
  assert.equal(latestBodyWeight([], { weightKg: '', heightCm: '' }), undefined);
});

test('aviso exige mais de sete dias desde o registro mais recente; ausência de data pede confirmação', () => {
  const exactWeek = { ...profile, weightRecordedAt: '2026-10-13T15:00:00Z' };
  assert.equal(bodyWeightIsStale(latestBodyWeight([], exactWeek), now), false);
  assert.equal(
    bodyWeightIsStale(latestBodyWeight([], exactWeek), new Date(now.getTime() + 1)),
    true,
  );
  assert.equal(
    bodyWeightIsStale(latestBodyWeight([session('81', '2026-10-12T16:00:00Z')], profile), now),
    true,
  );
  assert.equal(
    bodyWeightIsStale(latestBodyWeight([session('81', '2026-10-19T15:00:00Z')], profile), now),
    false,
  );
  assert.equal(
    bodyWeightIsStale(latestBodyWeight([session('81', '2026-10-01T15:00:00Z')], exactWeek), now),
    false,
  );
  assert.equal(
    bodyWeightIsStale(latestBodyWeight([], { weightKg: '80', heightCm: '' }), now),
    true,
  );
  assert.equal(bodyWeightIsStale(undefined, now), false);
});

test('novos treinos usam o peso mais recente nas calorias e mantêm cópias independentes', () => {
  const r = structuredClone(routine);
  r.exercises[0].energyModel = {
    formula: { expression: 'bodyWeight', parameters: {}, reference: 'Teste matemático' },
    loadBasis: 'total',
    loadMultiplier: 1,
    secondsPerRep: 3,
  };
  const history = [session('82', '2026-10-19T15:00:00Z')];
  const snapshot = structuredClone(history);
  const active = startWorkout(r, history, profile);
  assert.equal(active.bodyWeight, '82');
  assert.equal(active.bodyHeight, '180');
  Object.assign(active.exercises[0].sets[0], { done: true, weight: '20' });
  assert.equal(estimateWorkoutEnergy(active).kcal, 82);
  history[0].bodyWeight = '90';
  assert.equal(active.bodyWeight, '82');
  assert.equal(
    startWorkout(r, snapshot, { ...profile, weightRecordedAt: now.toISOString() }).bodyWeight,
    '80',
  );
});

test('data do peso no perfil é opcional, validada e preservada em backup sem mudar bancos antigos', () => {
  const db = { ...emptyDatabase(), bodyProfile: profile };
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.ok(validProfile({ weightKg: '80', heightCm: '' }));
  for (const date of [null, 123, '', 'inválida'])
    assert.ok(!validProfile({ ...profile, weightRecordedAt: date }));
  assert.ok(!validProfile({ ...profile, weightKg: '' }));
  assert.throws(() =>
    parseDatabase(
      JSON.stringify({ ...db, bodyProfile: { ...profile, weightRecordedAt: 'inválida' } }),
    ),
  );
});
