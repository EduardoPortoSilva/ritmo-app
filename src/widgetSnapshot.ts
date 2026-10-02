import type { Database } from './model';
import { activeRoutines } from './routineSets.ts';

// Only the schedule and completion times leave the app's database. The native
// widget determines "today" itself, even when JavaScript is not running.
export function widgetSnapshot(db: Database): string {
  const routines = activeRoutines(db)
    .filter((routine) => routine.weekdays?.length)
    .map(({ id, name, weekdays }) => ({ id, name, weekdays }));
  const ids = new Set(routines.map((routine) => routine.id));
  const completions = db.workouts
    .filter(
      (workout) =>
        ids.has(workout.routineId) &&
        workout.finishedAt &&
        workout.exercises.some((exercise) => exercise.sets.some((set) => set.done)),
    )
    .map((workout) => ({
      routineId: workout.routineId,
      finishedAt: new Date(workout.finishedAt!).getTime(),
    }))
    .filter((completion) => Number.isFinite(completion.finishedAt));
  return JSON.stringify({ routines, completions });
}
