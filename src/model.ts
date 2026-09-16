export type PlannedExercise = { id: string; name: string; reps: string[] };
export type Routine = { id: string; name: string; note: string; exercises: PlannedExercise[]; updatedAt: string };
export type LoggedSet = { id: string; target: string; reps: string; weight: string; done: boolean };
export type Workout = {
  id: string; routineId: string; name: string; startedAt: string; finishedAt?: string;
  exercises: { id: string; name: string; sets: LoggedSet[] }[];
};
export type Database = { version: 1; routines: Routine[]; workouts: Workout[]; active: Workout | null };
export const emptyDatabase = (): Database => ({ version: 1, routines: [], workouts: [], active: null });
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const newExercise = (): PlannedExercise => ({ id: uid(), name: '', reps: ['12', '12', '12'] });
export const newRoutine = (): Routine => ({ id: uid(), name: '', note: '', exercises: [newExercise()], updatedAt: new Date().toISOString() });
export const numberValue = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value.trim()) ? Number(value.trim().replace(',', '.')) : NaN;
export const validReps = (value: string) => /^\d+$/.test(value.trim()) && Number(value) > 0 && Number(value) <= 999;
export const validWeight = (value: string) => Number.isFinite(numberValue(value)) && numberValue(value) >= 0 && numberValue(value) <= 9999;
export function routineError(routine: Routine): string | null {
  if (!routine.name.trim()) return 'Dê um nome para a rotina.';
  if (!routine.exercises.length) return 'Adicione pelo menos um exercício.';
  for (const [index, exercise] of routine.exercises.entries()) {
    if (!exercise.name.trim()) return `Informe o nome do exercício ${index + 1}.`;
    if (!exercise.reps.length || exercise.reps.length > 20) return 'Cada exercício precisa ter entre 1 e 20 séries.';
    if (exercise.reps.some(rep => !validReps(rep))) return `Use repetições inteiras de 1 a 999 em ${exercise.name}.`;
  }
  return null;
}
export function startWorkout(routine: Routine): Workout {
  return {
    id: uid(), routineId: routine.id, name: routine.name, startedAt: new Date().toISOString(),
    exercises: routine.exercises.map(exercise => ({ id: exercise.id, name: exercise.name,
      sets: exercise.reps.map(target => ({ id: uid(), target, reps: target, weight: '', done: false })),
    })),
  };
}
export const allSets = (workout: Workout) => workout.exercises.flatMap(exercise => exercise.sets);
export function workoutError(workout: Workout): string | null {
  const completed = allSets(workout).filter(set => set.done);
  if (!completed.length) return 'Conclua pelo menos uma série antes de salvar o treino.';
  if (completed.some(set => !validReps(set.reps) || !validWeight(set.weight))) return 'Confira as repetições e a carga das séries concluídas.';
  return null;
}
export function finishWorkout(db: Database): Database {
  if (!db.active) throw new Error('Nenhum treino em andamento.');
  const error = workoutError(db.active);
  if (error) throw new Error(error);
  return { ...db, active: null, workouts: [{ ...db.active, finishedAt: new Date().toISOString() }, ...db.workouts] };
}
export const volume = (workout: Workout) => allSets(workout).filter(set => set.done).reduce((sum, set) => sum + numberValue(set.reps) * numberValue(set.weight), 0);
export const totalRoutineSets = (routine: Routine) => routine.exercises.reduce((sum, exercise) => sum + exercise.reps.length, 0);
export const formatNumber = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
export const duration = (workout: Workout) => Math.max(1, Math.round((new Date(workout.finishedAt ?? new Date()).getTime() - new Date(workout.startedAt).getTime()) / 60000));

// Validate stored data before using it. Invalid data is never silently replaced.
export function parseDatabase(raw: string): Database {
  const value = JSON.parse(raw);
  const string = (v: unknown) => typeof v === 'string';
  const date = (v: unknown) => string(v) && Number.isFinite(Date.parse(v as string));
  const routine = (r: any) => r && string(r.id) && string(r.name) && string(r.note) && date(r.updatedAt) && Array.isArray(r.exercises) && r.exercises.every((e: any) => e && string(e.id) && string(e.name) && Array.isArray(e.reps) && e.reps.every(string));
  const workout = (w: any) => w && string(w.id) && string(w.routineId) && string(w.name) && date(w.startedAt) && (w.finishedAt === undefined || date(w.finishedAt)) && Array.isArray(w.exercises) && w.exercises.every((e: any) => e && string(e.id) && string(e.name) && Array.isArray(e.sets) && e.sets.every((s: any) => s && string(s.id) && string(s.target) && string(s.reps) && string(s.weight) && typeof s.done === 'boolean'));
  if (value?.version !== 1 || !Array.isArray(value.routines) || !value.routines.every(routine) || !Array.isArray(value.workouts) || !value.workouts.every(workout) || !(value.active === null || workout(value.active))) throw new Error('Não foi possível ler os dados salvos. Eles foram preservados.');
  return value as Database;
}
