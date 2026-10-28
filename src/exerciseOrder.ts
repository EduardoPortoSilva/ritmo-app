import type { Workout } from './model.ts';

export type ExerciseOrderCheck = {
  beforeId: string;
  afterId: string;
  confirmed: boolean | null;
};
export type ExerciseOrderChange = {
  beforeId: string;
  afterId: string;
  beforeName: string;
  afterName: string;
};
export type PreviousExerciseOrder = { workoutId: string; changes: ExerciseOrderChange[] };

const pairKey = (pair: { beforeId: string; afterId: string }) =>
  JSON.stringify([pair.beforeId, pair.afterId]);
const complete = (exercise: Workout['exercises'][number]) =>
  exercise.sets.length > 0 && exercise.sets.every((set) => set.done);

// Called before toggling the set: filled fields alone are not evidence of completion.
export function newOrderChecks(workout: Workout, exerciseId: string, setId: string) {
  const index = workout.exercises.findIndex((exercise) => exercise.id === exerciseId);
  const first = workout.exercises[index]?.sets[0];
  if (!first || first.id !== setId || first.done) return [];
  const checked = new Set(workout.orderChecks?.map(pairKey));
  return workout.exercises.slice(index + 1).flatMap((exercise): ExerciseOrderCheck[] => {
    const pair = { beforeId: exerciseId, afterId: exercise.id, confirmed: null };
    return complete(exercise) && !checked.has(pairKey(pair)) ? [pair] : [];
  });
}

function eligibleChecks(workout: Workout) {
  const byId = new Map(workout.exercises.map((exercise) => [exercise.id, exercise]));
  return (workout.orderChecks ?? []).filter((check) => {
    const before = byId.get(check.beforeId);
    const after = byId.get(check.afterId);
    return before?.sets[0]?.done && after && complete(after);
  });
}
export function pendingOrderChecks(workout: Workout): ExerciseOrderCheck[] {
  const pending = eligibleChecks(workout).filter((check) => check.confirmed === null);
  // Each pair gets its own answer: one confirmed swap does not confirm other candidates.
  return pending.slice(0, 1);
}
export function answerOrderChecks(workout: Workout, confirmed: boolean): Workout {
  const pending = new Set(pendingOrderChecks(workout).map(pairKey));
  return {
    ...workout,
    orderChecks: workout.orderChecks?.map((check) =>
      pending.has(pairKey(check)) ? { ...check, confirmed } : check,
    ),
  };
}
export function describeOrderChecks(
  workout: Workout,
  checks: readonly ExerciseOrderCheck[],
): ExerciseOrderChange[] {
  const byId = new Map(workout.exercises.map((exercise) => [exercise.id, exercise]));
  return checks.flatMap((check) => {
    const before = byId.get(check.beforeId);
    const after = byId.get(check.afterId);
    return before && after
      ? [{ beforeId: before.id, afterId: after.id, beforeName: before.name, afterName: after.name }]
      : [];
  });
}
export function confirmedOrderChanges(workout: Workout): ExerciseOrderChange[] {
  return describeOrderChecks(
    workout,
    eligibleChecks(workout).filter((check) => check.confirmed === true),
  );
}
export function previousExerciseOrder(
  previous: Workout | undefined,
  exerciseIds: readonly string[],
): PreviousExerciseOrder | undefined {
  if (!previous) return;
  const ids = new Set(exerciseIds);
  const changes = confirmedOrderChanges(previous).filter(
    (change) => ids.has(change.beforeId) && ids.has(change.afterId),
  );
  return changes.length ? { workoutId: previous.id, changes } : undefined;
}
export const orderChangesFor = (changes: readonly ExerciseOrderChange[], exerciseId: string) =>
  changes.filter((change) => change.beforeId === exerciseId || change.afterId === exerciseId);

// Optional fields preserve old v1 databases; IDs are scoped to this workout snapshot.
export function validExerciseOrder(workout: Workout): boolean {
  const indices = new Map(workout.exercises.map((exercise, index) => [exercise.id, index]));
  const pair = (value: ExerciseOrderCheck | ExerciseOrderChange) =>
    value &&
    indices.has(value.beforeId) &&
    indices.has(value.afterId) &&
    value.beforeId !== value.afterId;
  const uniquePairs = (values: { beforeId: string; afterId: string }[]) =>
    new Set(values.map(pairKey)).size === values.length;
  if (
    workout.orderChecks !== undefined &&
    (!Array.isArray(workout.orderChecks) ||
      !workout.orderChecks.every(
        (check) =>
          pair(check) &&
          indices.get(check.beforeId)! < indices.get(check.afterId)! &&
          (check.confirmed === null || typeof check.confirmed === 'boolean'),
      ) ||
      !uniquePairs(workout.orderChecks))
  )
    return false;
  const previous = workout.previousOrder;
  if (
    previous !== undefined &&
    (!previous ||
      typeof previous.workoutId !== 'string' ||
      !previous.workoutId.trim() ||
      !Array.isArray(previous.changes) ||
      !previous.changes.length ||
      !previous.changes.every(
        (change) =>
          pair(change) &&
          typeof change.beforeName === 'string' &&
          !!change.beforeName.trim() &&
          typeof change.afterName === 'string' &&
          !!change.afterName.trim(),
      ) ||
      !uniquePairs(previous.changes))
  )
    return false;
  return (
    workout.orderNoticesSeen === undefined ||
    (Array.isArray(workout.orderNoticesSeen) &&
      new Set(workout.orderNoticesSeen).size === workout.orderNoticesSeen.length &&
      workout.orderNoticesSeen.every(
        (id) => typeof id === 'string' && orderChangesFor(previous?.changes ?? [], id).length > 0,
      ))
  );
}
