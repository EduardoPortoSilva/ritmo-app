import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cardioForDate,
  cardioProgress,
  cardioCueBoundary,
  expectedCardioDistance,
  cardioDistanceDifference,
  finishCardio,
  validCardioDistance,
  cardioRoutineError,
  cleanCardioRoutine,
  newCardioRoutine,
  pauseCardio,
  resumeCardio,
  startCardio,
} from '../src/cardio.ts';
import { emptyDatabase, parseDatabase } from '../src/model.ts';

function hiit() {
  const routine = newCardioRoutine();
  routine.name = 'HIIT';
  routine.weekdays = [1, 3];
  routine.steps = [
    { id: 'a', minutes: '1', speed: '5' },
    { id: 'b', minutes: '1', speed: '7' },
    { id: 'c', minutes: '0,5', speed: '12,5' },
  ];
  return routine;
}

test('cardio aceita dias e etapas decimais, valida limites e mantém bancos antigos', () => {
  const routine = hiit();
  assert.equal(cardioRoutineError(routine), null);
  assert.deepEqual(cardioForDate([routine], new Date(2026, 8, 28)), [routine]);
  assert.deepEqual(cardioForDate([routine], new Date(2026, 8, 29)), []);
  const cleaned = cleanCardioRoutine(routine);
  assert.equal(cleaned.steps[2].minutes, '0.5');
  assert.equal(cleaned.steps[2].speed, '12.5');
  assert.deepEqual(parseDatabase(JSON.stringify(emptyDatabase())), emptyDatabase());
  assert.equal(
    parseDatabase(JSON.stringify({ ...emptyDatabase(), cardioRoutines: [cleaned] }))
      .cardioRoutines?.[0].steps[2].speed,
    '12.5',
  );
  assert.match(
    cardioRoutineError({ ...routine, steps: [{ ...routine.steps[0], minutes: '0' }] })!,
    /duração/,
  );
  assert.match(
    cardioRoutineError({ ...routine, steps: [{ ...routine.steps[0], speed: '41' }] })!,
    /velocidade/,
  );
  assert.throws(() =>
    parseDatabase(
      JSON.stringify({ ...emptyDatabase(), cardioRoutines: [{ ...cleaned, weekdays: [8] }] }),
    ),
  );
});

test('distância esperada acompanha o tempo executado e feedback é opcional', () => {
  const routine = hiit();
  const t0 = Date.parse('2026-09-28T10:00:00.000Z');
  const run = resumeCardio(startCardio(routine), t0);
  assert.equal(expectedCardioDistance(run.steps, 60_000), 5 / 60);
  assert.equal(expectedCardioDistance(run.steps, 90_000), 5 / 60 + 7 / 120);
  assert.equal(expectedCardioDistance(run.steps, 999_000), 5 / 60 + 7 / 60 + 12.5 / 120);
  assert.equal(validCardioDistance(''), true);
  assert.equal(validCardioDistance('0,15'), true);
  assert.equal(validCardioDistance('-1'), false);
  const partial = finishCardio(run, '0,15', t0 + 90_000);
  assert.equal(partial.elapsedMs, 90_000);
  assert.equal(partial.distanceKm, '0.15');
  assert.equal(partial.startedAt, new Date(t0).toISOString());
  assert.equal(
    parseDatabase(JSON.stringify({ ...emptyDatabase(), cardioHistory: [partial] })).cardioHistory
      ?.length,
    1,
  );
  routine.steps[0].speed = '30';
  assert.equal(partial.steps[0].speed, 5);
  assert.throws(() =>
    parseDatabase(
      JSON.stringify({ ...emptyDatabase(), cardioHistory: [{ ...partial, elapsedMs: -1 }] }),
    ),
  );
});

test('diferenças menores que 0,01 km são neutras em ambos os sentidos', () => {
  assert.equal(cardioDistanceDifference(0.04, 0.04), 0);
  assert.equal(cardioDistanceDifference(0.04, 0.04000000000000001), 0);
  assert.equal(cardioDistanceDifference(0.049, 0.04), 0);
  assert.equal(cardioDistanceDifference(0.031, 0.04), 0);
  assert.equal(cardioDistanceDifference(0.05, 0.04), 0.01);
  assert.equal(cardioDistanceDifference(0.05, 0.06), -0.01);
  assert.equal(cardioDistanceDifference(0.051, 0.04), 0.011);
  assert.equal(cardioDistanceDifference(0.029, 0.04), -0.011);
});

test('aviso ocorre uma vez perto da troca de velocidade, somente em execução', () => {
  const t0 = Date.parse('2026-09-28T10:00:00.000Z');
  const run = resumeCardio(startCardio(hiit()), t0);
  assert.equal(cardioCueBoundary(run, t0 + 56_000), null);
  assert.equal(cardioCueBoundary(run, t0 + 57_000), 0);
  assert.equal(cardioCueBoundary(run, t0 + 58_100), null);
  assert.equal(cardioCueBoundary(pauseCardio(run, t0 + 57_000), t0 + 57_100), null);
  assert.equal(cardioCueBoundary(run, t0 + 117_000), 1);
});

test('modo cardio troca etapa no limite, pausa sem avançar e retoma pelo tempo real', () => {
  const routine = hiit();
  const initial = startCardio(routine);
  const t0 = Date.parse('2026-09-28T10:00:00.000Z');
  let run = resumeCardio(initial, t0);
  assert.equal(cardioProgress(run, t0 + 59_999).index, 0);
  assert.equal(cardioProgress(run, t0 + 60_000).index, 1);
  assert.equal(cardioProgress(run, t0 + 60_000).remainingSeconds, 60);
  run = pauseCardio(run, t0 + 75_000);
  assert.equal(cardioProgress(run, t0 + 100_000).elapsedSeconds, 75);
  run = resumeCardio(run, t0 + 100_000);
  assert.equal(cardioProgress(run, t0 + 145_000).index, 2);
  assert.equal(cardioProgress(run, t0 + 175_000).complete, true);
  assert.equal(cardioProgress(run, t0 + 999_000).elapsedSeconds, 150);
  assert.equal(resumeCardio(run, t0 + 100_001), run);
  assert.equal(routine.steps[2].speed, '12,5');
});

test('sessão salva uma cópia independente e pode ser retomada após recarregar', () => {
  const routine = hiit();
  const t0 = Date.parse('2026-09-28T10:00:00.000Z');
  const activeCardio = resumeCardio(startCardio(routine), t0);
  routine.steps[0].speed = '20';
  const db = parseDatabase(
    JSON.stringify({ ...emptyDatabase(), cardioRoutines: [routine], activeCardio }),
  );
  assert.equal(db.activeCardio?.steps[0].speed, 5);
  assert.equal(cardioProgress(db.activeCardio!, t0 + 61_000).index, 1);
  assert.throws(() =>
    parseDatabase(
      JSON.stringify({ ...emptyDatabase(), activeCardio: { ...activeCardio, elapsedMs: -1 } }),
    ),
  );
});
