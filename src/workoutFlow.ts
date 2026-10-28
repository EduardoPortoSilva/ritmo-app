import type { LoggedExercise, Workout } from './model.ts';
import { restRemainingMs, type RestTimer } from './restTimer.ts';

export function exerciseComplete(exercise: LoggedExercise): boolean {
  return exercise.sets.length > 0 && exercise.sets.every((set) => set.done);
}

export function currentWorkoutSet(workout: Workout): {
  exerciseIndex: number;
  setIndex: number;
  exerciseId: string;
  setId: string;
} | null {
  for (const [exerciseIndex, exercise] of workout.exercises.entries()) {
    const setIndex = exercise.sets.findIndex((set) => !set.done);
    if (setIndex >= 0)
      return {
        exerciseIndex,
        setIndex,
        exerciseId: exercise.id,
        setId: exercise.sets[setIndex].id,
      };
  }
  return null;
}

export function visibleExerciseIndices(workout: Workout, hideCompleted: boolean): number[] {
  return workout.exercises.flatMap((exercise, index) =>
    hideCompleted && exerciseComplete(exercise) ? [] : [index],
  );
}

export function markLongRestAfterRestart(workout: Workout, timer: RestTimer, now: number): Workout {
  if (timer.durationMs <= 0 || restRemainingMs(timer, now) > 0) return workout;
  const exercise = workout.exercises.find((item) => item.id === timer.exerciseId);
  if (!exercise) return workout;
  const index = exercise.sets.findIndex((set) => set.id === timer.setId);
  if (index < 0) return workout;
  const next = exercise.sets[index + 1];
  if (!next || next.done || next.longRest) return workout;
  return {
    ...workout,
    exercises: workout.exercises.map((item) =>
      item.id !== exercise.id
        ? item
        : {
            ...item,
            sets: item.sets.map((set) => (set.id === next.id ? { ...set, longRest: true } : set)),
          },
    ),
  };
}
