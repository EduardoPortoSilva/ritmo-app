import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newExercise, newRoutine, startWorkout } from '../src/model.ts';
import {
  exerciseComplete,
  currentWorkoutSet,
  markLongRestAfterRestart,
  visibleExerciseIndices,
} from '../src/workoutFlow.ts';
import { pauseRestTimer, startRestTimer } from '../src/restTimer.ts';

function fixture() {
  const routine = newRoutine();
  routine.name = 'Treino';
  routine.exercises.push(newExercise());
  return startWorkout(routine);
}

test('série atual é a primeira pendente na ordem do treino, sem pular lacunas ou concluir fora de ordem', () => {
  const workout = fixture();
  assert.deepEqual(currentWorkoutSet(workout), {
    exerciseIndex: 0,
    setIndex: 0,
    exerciseId: workout.exercises[0].id,
    setId: workout.exercises[0].sets[0].id,
  });
  workout.exercises[0].sets[2].done = true;
  assert.equal(currentWorkoutSet(workout)?.setIndex, 0);
  workout.exercises[0].sets[0].done = true;
  assert.equal(currentWorkoutSet(workout)?.setIndex, 1);
  const before = structuredClone(workout);
  currentWorkoutSet(workout);
  assert.deepEqual(workout, before);
});

test('concluir exercício aponta à série pendente do próximo; desfazer uma conclusão recupera a anterior', () => {
  const workout = fixture();
  workout.exercises[0].sets.forEach((s) => (s.done = true));
  workout.exercises[1].sets[0].done = true;
  assert.deepEqual(currentWorkoutSet(workout), {
    exerciseIndex: 1,
    setIndex: 1,
    exerciseId: workout.exercises[1].id,
    setId: workout.exercises[1].sets[1].id,
  });
  workout.exercises[0].sets[2].done = false;
  assert.equal(currentWorkoutSet(workout)?.exerciseIndex, 0);
  assert.equal(currentWorkoutSet(workout)?.setIndex, 2);
});

test('todas concluídas ou treino vazio não inventam outra série atual', () => {
  const workout = fixture();
  workout.exercises.forEach((e) => e.sets.forEach((s) => (s.done = true)));
  assert.equal(currentWorkoutSet(workout), null);
  assert.equal(currentWorkoutSet({ ...workout, exercises: [] }), null);
});

test('só reiniciar descanso terminado marca a próxima série pendente do mesmo exercício', () => {
  const workout = fixture();
  const [first, second] = workout.exercises[0].sets;
  const timer = startRestTimer(workout.exercises[0].id, first.id, 60, 1000);
  const original = structuredClone(workout);
  assert.equal(markLongRestAfterRestart(workout, timer, 60_999), workout);
  assert.equal(markLongRestAfterRestart(workout, pauseRestTimer(timer, 5000), 100_000), workout);
  const result = markLongRestAfterRestart(workout, timer, 61_000);
  assert.equal(result.exercises[0].sets[1].id, second.id);
  assert.equal(result.exercises[0].sets[1].longRest, true);
  assert.equal(result.exercises[0].sets[1].done, false);
  assert.deepEqual(result.exercises[0].sets[0], first);
  assert.deepEqual(result.exercises[1], workout.exercises[1]);
  assert.deepEqual(workout, original);
  assert.equal(markLongRestAfterRestart(result, timer, 70_000), result);
});

test('descanso não atravessa exercícios nem reclassifica série já concluída ou timer inválido', () => {
  const workout = fixture();
  const exercise = workout.exercises[0];
  const last = exercise.sets.at(-1)!;
  const ended = startRestTimer(exercise.id, last.id, 1, 0);
  assert.equal(markLongRestAfterRestart(workout, ended, 1000), workout);
  assert.equal(
    markLongRestAfterRestart(workout, { ...ended, exerciseId: 'ausente' }, 1000),
    workout,
  );
  assert.equal(markLongRestAfterRestart(workout, { ...ended, setId: 'ausente' }, 1000), workout);
  const firstTimer = startRestTimer(exercise.id, exercise.sets[0].id, 1, 0);
  exercise.sets[1].done = true;
  assert.equal(markLongRestAfterRestart(workout, firstTimer, 1000), workout);
  exercise.sets[1].done = false;
  assert.equal(markLongRestAfterRestart(workout, { ...firstTimer, durationMs: 0 }, 1000), workout);
});

test('ocultar concluídos preserva ordem, índices originais e séries, incluindo todos concluídos', () => {
  const workout = fixture();
  assert.deepEqual(visibleExerciseIndices(workout, true), [0, 1]);
  workout.exercises[0].sets[2].done = true;
  assert.equal(exerciseComplete(workout.exercises[0]), false);
  assert.deepEqual(visibleExerciseIndices(workout, true), [0, 1]);
  workout.exercises[0].sets.forEach((set) => (set.done = true));
  assert.equal(exerciseComplete(workout.exercises[0]), true);
  const original = structuredClone(workout);
  assert.deepEqual(visibleExerciseIndices(workout, true), [1]);
  assert.deepEqual(visibleExerciseIndices(workout, false), [0, 1]);
  assert.deepEqual(workout, original);
  workout.exercises[1].sets.forEach((set) => (set.done = true));
  assert.deepEqual(visibleExerciseIndices(workout, true), []);
  assert.equal(exerciseComplete({ ...workout.exercises[0], sets: [] }), false);
});
