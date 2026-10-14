import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inChartWindow, effortHistory, workoutPlanSignature } from '../src/effort.ts';
import { newRoutine, startWorkout, type Routine, type Workout } from '../src/model.ts';

function logged(routine: Routine, id: string, date: string, weight: string): Workout {
  const workout = startWorkout(routine);
  workout.id = id;
  workout.finishedAt = date;
  workout.exercises[0].sets[0].done = true;
  workout.exercises[0].sets[0].reps = '10';
  workout.exercises[0].sets[0].weight = weight;
  return workout;
}

test('esforço compara cada treino ao máximo da própria rotina e fase', () => {
  const a = newRoutine();
  a.name = 'A';
  a.exercises[0].name = 'Supino';
  a.exercises[0].reps = ['10'];
  const anotherA = structuredClone(a);
  anotherA.id = 'outro-a';
  const first = logged(a, 'a-max', '2026-01-01T12:00:00Z', '150');
  const second = logged(a, 'a-two-thirds', '2026-01-02T12:00:00Z', '100');
  const other = logged(anotherA, 'other', '2026-01-03T12:00:00Z', '200');
  const before = structuredClone([other, second, first]);
  const result = effortHistory([other, second, first]);
  assert.deepEqual([other, second, first], before);
  assert.equal(result.groups.length, 2);
  assert.equal(result.records.find((record) => record.workoutId === 'a-max')?.percent, 100);
  assert.equal(result.records.find((record) => record.workoutId === 'a-two-thirds')?.percent, 66);
  assert.equal(
    result.records.find((record) => record.workoutId === 'a-two-thirds')?.maxVolume,
    1500,
  );
  assert.equal(result.records.find((record) => record.workoutId === 'other')?.percent, 100);
  assert.notEqual(result.groups[0].color, result.groups[1].color);
  assert.notEqual(result.groups[0].label, result.groups[1].label);
});

test('mudança de exercícios ou metas abre nova fase; nome e descanso não abrem', () => {
  const a = newRoutine();
  a.name = 'A';
  a.exercises[0].name = 'Supino';
  a.exercises[0].reps = ['10'];
  const first = logged(a, 'first', '2026-01-01T12:00:00Z', '150');
  const renamed = structuredClone(first);
  renamed.id = 'renamed';
  renamed.name = 'A atualizado';
  renamed.finishedAt = '2026-01-02T12:00:00Z';
  renamed.exercises[0].sets[0].rest = '90';
  assert.equal(workoutPlanSignature(first), workoutPlanSignature(renamed));
  const targetChange = structuredClone(renamed);
  targetChange.id = 'target';
  targetChange.finishedAt = '2026-01-03T12:00:00Z';
  targetChange.exercises[0].sets[0].target = '8';
  targetChange.exercises[0].sets[0].weight = '80';
  const samePhase = structuredClone(targetChange);
  samePhase.id = 'same-phase';
  samePhase.finishedAt = '2026-01-04T12:00:00Z';
  samePhase.exercises[0].sets[0].weight = '120';
  const exerciseChange = structuredClone(samePhase);
  exerciseChange.id = 'exercise';
  exerciseChange.finishedAt = '2026-01-05T12:00:00Z';
  exerciseChange.exercises[0].name = 'Supino inclinado';
  const result = effortHistory([exerciseChange, samePhase, targetChange, renamed, first]);
  assert.equal(result.groups.length, 3);
  assert.deepEqual(
    result.groups.map((group) => group.part),
    [1, 2, 3],
  );
  assert.deepEqual(
    result.groups.map((group) => group.records.map((record) => record.workoutId)),
    [['first', 'renamed'], ['target', 'same-phase'], ['exercise']],
  );
  assert.equal(result.records.find((record) => record.workoutId === 'target')?.percent, 66);
  assert.equal(result.records.find((record) => record.workoutId === 'same-phase')?.percent, 100);
  assert.notEqual(result.groups[0].color, result.groups[1].color);
});

test('janela filtra datas sem alterar o máximo histórico e carga zero não inventa percentual', () => {
  const a = newRoutine();
  a.name = 'A';
  a.exercises[0].reps = ['10'];
  const olderMax = logged(a, 'older-max', '2026-01-01T12:00:00Z', '150');
  const recent = logged(a, 'recent', '2026-09-30T12:00:00Z', '100');
  const zeroRoutine = structuredClone(a);
  zeroRoutine.id = 'zero-routine';
  const zero = logged(zeroRoutine, 'zero', '2026-10-01T12:00:00Z', '0');
  const result = effortHistory([recent, olderMax, zero]);
  const now = Date.parse('2026-10-05T12:00:00Z');
  assert.equal(inChartWindow(olderMax.finishedAt!, '90d', now), false);
  assert.equal(inChartWindow(recent.finishedAt!, '90d', now), true);
  assert.equal(inChartWindow(olderMax.finishedAt!, 'all', now), true);
  assert.equal(result.records.find((record) => record.workoutId === 'recent')?.percent, 66);
  assert.equal(result.records.find((record) => record.workoutId === 'zero')?.percent, null);
});
