import { isSupplement, type Supplement } from './supplements.ts';
import {
  previousExerciseOrder,
  validExerciseOrder,
  type ExerciseOrderCheck,
  type PreviousExerciseOrder,
} from './exerciseOrder.ts';
import {
  energyModelError,
  validHeight,
  validProfile,
  type EnergyModel,
  type BodyProfile,
} from './energy.ts';
import { validSubstance, type Substance } from './substances.ts';
import { validBlend, type SubstanceBlend } from './substanceBlendSchema.ts';
import { validMuscleLinks, muscleLinksKey, type MuscleLink } from './muscles.ts';
import {
  isCardioRoutine,
  isCardioRun,
  isCardioSession,
  type CardioRoutine,
  type CardioRun,
  type CardioSession,
} from './cardio.ts';

export type PlannedExercise = {
  energyModel?: EnergyModel;
  id: string;
  name: string;
  note?: string;
  reps: string[];
  rests?: string[];
  muscles?: MuscleLink[];
};
export type Routine = {
  id: string;
  name: string;
  note: string;
  weekdays?: number[];
  division?: { id: string; name: string };
  exercises: PlannedExercise[];
  updatedAt: string;
};
export type RoutineSet = {
  id: string;
  name: string;
  routineIds: string[];
};
export type LoggedSet = {
  id: string;
  target: string;
  reps: string;
  weight: string;
  done: boolean;
  rest?: string;
  longRest?: boolean;
  restPause?: boolean;
  cramp?: boolean;
};
export const loadAdjustments = {
  increase: 'Aumentar carga',
  maintain: 'Manter carga',
  decrease: 'Diminuir carga',
} as const;
export type LoadAdjustment = keyof typeof loadAdjustments;
export type LoggedExercise = {
  energyModel?: EnergyModel;
  id: string;
  name: string;
  note?: string;
  sets: LoggedSet[];
  muscles?: MuscleLink[];
  loadAdjustment?: LoadAdjustment;
  // Legacy exercise-wide impediment; new cramps are recorded on LoggedSet.
  cramp?: boolean;
  externalImpediment?: boolean;
};
export type Workout = {
  orderChecks?: ExerciseOrderCheck[];
  previousOrder?: PreviousExerciseOrder;
  orderNoticesSeen?: string[];
  bodyHeight?: string;
  id: string;
  routineId: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  bodyWeight?: string;
  exercises: LoggedExercise[];
};
export type Database = {
  bodyProfile?: BodyProfile;
  substances?: Substance[];
  substanceBlends?: SubstanceBlend[];
  version: 1;
  routines: Routine[];
  routineSets?: RoutineSet[];
  activeRoutineSetId?: string;
  strengthPaused?: boolean;
  workouts: Workout[];
  active: Workout | null;
  supplements?: Supplement[];
  cardioRoutines?: CardioRoutine[];
  activeCardio?: CardioRun | null;
  cardioHistory?: CardioSession[];
};
export const emptyDatabase = (): Database => ({
  version: 1,
  routines: [],
  workouts: [],
  active: null,
});
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const newExercise = (): PlannedExercise => ({
  id: uid(),
  name: '',
  reps: ['12', '12', '12'],
});
export const newRoutine = (): Routine => ({
  id: uid(),
  name: '',
  note: '',
  weekdays: [],
  exercises: [newExercise()],
  updatedAt: new Date().toISOString(),
});
export const weekdays = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
] as const;
const validWeekdays = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
  new Set(value).size === value.length;
export const routineDays = (routine: Routine) =>
  weekdays
    .filter((day) => routine.weekdays?.includes(day.value))
    .map((day) => day.short)
    .join(' · ') || 'Sem dia definido';
export const routinesForDate = (routines: readonly Routine[], date: Date) =>
  routines.filter((routine) => routine.weekdays?.includes(date.getDay()));
export const numberValue = (value: string) =>
  /^\d+(?:[.,]\d+)?$/.test(value.trim()) ? Number(value.trim().replace(',', '.')) : NaN;
export const validReps = (value: string) =>
  /^\d+$/.test(value.trim()) && Number(value) > 0 && Number(value) <= 999;
// Empty means unspecified; zero explicitly means no rest.
export const validRest = (value: string) =>
  value.trim() === '' || (/^\d+$/.test(value.trim()) && Number(value) <= 3600);
export const validExerciseNote = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 300;
export const restLabel = (value?: string) =>
  value === undefined || value.trim() === ''
    ? 'Descanso não definido'
    : `Descanso: ${Number(value)} s`;
export const routineDraftKey = (routine: Routine) =>
  JSON.stringify({
    name: routine.name,
    note: routine.note,
    weekdays: [...(routine.weekdays ?? [])].sort(),
    exercises: routine.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      note: exercise.note ?? '',
      muscles: muscleLinksKey(exercise.muscles),
      reps: exercise.reps,
      rests: exercise.reps.map((_, i) => exercise.rests?.[i] ?? ''),
      energyModel: exercise.energyModel,
    })),
  });
export const validWeight = (value: string) =>
  Number.isFinite(numberValue(value)) && numberValue(value) >= 0 && numberValue(value) <= 9999;
export const validBodyWeight = (value: string) =>
  Number.isFinite(numberValue(value)) && numberValue(value) > 0 && numberValue(value) <= 999;
export function previousBodyWeight(history: readonly Workout[]): string {
  return latestBodyWeight(history)?.weight ?? '';
}
export type BodyWeightRecord = {
  weight: string;
  recordedAt?: string;
  source: 'profile' | 'history';
};
export function latestBodyWeight(
  history: readonly Workout[],
  profile?: BodyProfile,
): BodyWeightRecord | undefined {
  let latest: BodyWeightRecord | undefined =
    profile?.weightKg && validBodyWeight(profile.weightKg)
      ? { weight: profile.weightKg, recordedAt: profile.weightRecordedAt, source: 'profile' }
      : undefined;
  for (const workout of history) {
    if (
      !workout.finishedAt ||
      !Number.isFinite(Date.parse(workout.finishedAt)) ||
      !workout.bodyWeight ||
      !validBodyWeight(workout.bodyWeight)
    )
      continue;
    if (!latest?.recordedAt || Date.parse(workout.finishedAt) >= Date.parse(latest.recordedAt))
      latest = { weight: workout.bodyWeight, recordedAt: workout.finishedAt, source: 'history' };
  }
  return latest;
}
export function bodyWeightIsStale(record: BodyWeightRecord | undefined, now: Date): boolean {
  return (
    !!record &&
    (!record.recordedAt || now.getTime() - Date.parse(record.recordedAt) > 7 * 24 * 60 * 60 * 1000)
  );
}
export function bodyWeightHistory(
  history: readonly Workout[],
): { workoutId: string; date: string; weight: number }[] {
  return history
    .flatMap((workout) =>
      workout.finishedAt && workout.bodyWeight && validBodyWeight(workout.bodyWeight)
        ? [
            {
              workoutId: workout.id,
              date: workout.finishedAt,
              weight: numberValue(workout.bodyWeight),
            },
          ]
        : [],
    )
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
export function routineError(routine: Routine): string | null {
  if (routine.weekdays !== undefined && !validWeekdays(routine.weekdays))
    return 'Selecione dias da semana válidos.';
  if (!routine.name.trim()) return 'Dê um nome para a rotina.';
  if (!routine.exercises.length) return 'Adicione pelo menos um exercício.';
  for (const [index, exercise] of routine.exercises.entries()) {
    if (exercise.energyModel !== undefined) {
      const error = energyModelError(exercise.energyModel);
      if (error) return `${exercise.name || `Exercício ${index + 1}`}: ${error}`;
    }
    if (exercise.note !== undefined && !validExerciseNote(exercise.note))
      return `Use até 300 caracteres nas observações de ${exercise.name}.`;
    if (exercise.muscles !== undefined && !validMuscleLinks(exercise.muscles))
      return `Confira os vínculos musculares do exercício ${index + 1}.`;
    if (!exercise.name.trim()) return `Informe o nome do exercício ${index + 1}.`;
    if (!exercise.reps.length || exercise.reps.length > 20)
      return 'Cada exercício precisa ter entre 1 e 20 séries.';
    if (exercise.reps.some((rep) => !validReps(rep)))
      return `Use repetições inteiras de 1 a 999 em ${exercise.name}.`;
    if (
      exercise.rests &&
      (exercise.rests.length !== exercise.reps.length ||
        exercise.rests.some((rest) => !validRest(rest)))
    )
      return `Use descansos inteiros de 0 a 3600 segundos em ${exercise.name}, ou deixe em branco.`;
  }
  return null;
}
export const cleanRoutine = (routine: Routine): Routine => ({
  ...routine,
  name: routine.name.trim(),
  note: routine.note.trim(),
  updatedAt: new Date().toISOString(),
  exercises: routine.exercises.map((exercise) => ({
    ...exercise,
    name: exercise.name.trim(),
    ...(exercise.note !== undefined ? { note: exercise.note.trim() } : {}),
    reps: exercise.reps.map((rep) => String(Number(rep))),
    rests: exercise.rests?.map((rest) => (rest.trim() === '' ? '' : String(Number(rest)))),
  })),
});
export type DivisionDraft = { id: string; name: string; routines: Routine[] };
export const newDivision = (): DivisionDraft => ({ id: uid(), name: '', routines: [newRoutine()] });
export const divisionDraftKey = (division: DivisionDraft) =>
  JSON.stringify({
    name: division.name,
    routines: division.routines.map((routine) => [routine.id, routineDraftKey(routine)]),
  });
export function divisionError(division: DivisionDraft): string | null {
  if (!division.name.trim()) return 'Dê um nome para a divisão.';
  if (!division.routines.length) return 'Adicione pelo menos um treino.';
  for (const [index, routine] of division.routines.entries()) {
    const error = routineError(routine);
    if (error) return `Treino ${index + 1}: ${error}`;
  }
  return null;
}
export function saveDivision(db: Database, division: DivisionDraft): Database {
  const error = divisionError(division);
  if (error) throw new Error(error);
  const ids = new Set(division.routines.map((routine) => routine.id));
  if (
    ids.size !== division.routines.length ||
    db.routines.some((routine) => ids.has(routine.id) && routine.division?.id !== division.id)
  )
    throw new Error('Os treinos desta divisão precisam ter identificadores próprios.');
  const routines = division.routines.map((routine) => ({
    ...cleanRoutine(routine),
    division: { id: division.id, name: division.name.trim() },
  }));
  const first = db.routines.findIndex((routine) => routine.division?.id === division.id);
  const others = db.routines.filter((routine) => routine.division?.id !== division.id);
  others.splice(first < 0 ? others.length : first, 0, ...routines);
  return { ...db, routines: others };
}
// Keep routine IDs and set positions as the history identity; never mutate history order.
export function previousRoutineWorkouts(history: readonly Workout[], routineId: string): Workout[] {
  return history
    .filter(
      (workout) =>
        workout.routineId === routineId &&
        workout.finishedAt &&
        Number.isFinite(Date.parse(workout.finishedAt)),
    )
    .slice()
    .sort((a, b) => Date.parse(b.finishedAt!) - Date.parse(a.finishedAt!));
}
export function suggestsLoadIncrease(
  exercise: LoggedExercise,
  previous: readonly Workout[],
): boolean {
  const recent = previous
    .slice(0, 2)
    .map((workout) => workout.exercises.find((item) => item.id === exercise.id));
  if (recent.length < 2 || !recent[0] || !recent[1] || !exercise.sets.length) return false;
  if (recent.some((item) => item!.externalImpediment)) return false;
  if (
    recent[0].cramp ||
    recent[0].loadAdjustment === 'maintain' ||
    recent[0].loadAdjustment === 'decrease'
  )
    return false;
  if (recent.some((item) => item!.sets.length !== exercise.sets.length)) return false;
  return exercise.sets.every((set, index) => {
    const a = recent[0]!.sets[index];
    const b = recent[1]!.sets[index];
    return (
      validReps(set.target) &&
      [a, b].every(
        (item) =>
          item.done &&
          validReps(item.reps) &&
          validReps(item.target) &&
          validWeight(item.weight) &&
          Number(item.target) === Number(set.target) &&
          Number(item.reps) >= Number(set.target),
      ) &&
      numberValue(a.weight) === numberValue(b.weight)
    );
  });
}
export function suggestsLoadDecrease(
  exercise: LoggedExercise,
  previous: readonly Workout[],
): boolean {
  const recent = previous
    .slice(0, 2)
    .map((workout) => workout.exercises.find((item) => item.id === exercise.id));
  if (recent.length < 2 || !recent[0] || !recent[1] || !exercise.sets.length) return false;
  if (recent.some((item) => item!.externalImpediment)) return false;
  return recent.every((item) => {
    if (
      item!.sets.length !== exercise.sets.length ||
      item!.sets.some(
        (set, index) =>
          !validReps(set.target) ||
          !validReps(exercise.sets[index].target) ||
          Number(set.target) !== Number(exercise.sets[index].target),
      )
    )
      return false;
    const belowHalf = item!.sets.filter(
      (set) =>
        set.done &&
        validReps(set.reps) &&
        validWeight(set.weight) &&
        Number(set.reps) < Number(set.target) / 2,
    ).length;
    return belowHalf > exercise.sets.length / 2;
  });
}
export function startWorkout(
  routine: Routine,
  history: readonly Workout[] = [],
  profile?: BodyProfile,
): Workout {
  const previous = previousRoutineWorkouts(history, routine.id)[0];
  const previousExercises = new Map(previous?.exercises.map((exercise) => [exercise.id, exercise]));
  const weight = latestBodyWeight(history, profile)?.weight;
  const previousOrder = previousExerciseOrder(
    previous,
    routine.exercises.map((exercise) => exercise.id),
  );

  return {
    id: uid(),
    routineId: routine.id,
    name: routine.name,
    startedAt: new Date().toISOString(),
    ...(previousOrder ? { previousOrder } : {}),
    ...(profile?.heightCm ? { bodyHeight: profile.heightCm } : {}),
    ...(weight ? { bodyWeight: weight } : {}),
    exercises: routine.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      ...(exercise.energyModel
        ? { energyModel: JSON.parse(JSON.stringify(exercise.energyModel)) as EnergyModel }
        : {}),
      ...(exercise.note ? { note: exercise.note } : {}),
      ...(exercise.muscles ? { muscles: exercise.muscles.map((link) => ({ ...link })) } : {}),
      sets: exercise.reps.map((target, index) => {
        const previousSet = previousExercises.get(exercise.id)?.sets[index];
        return {
          id: uid(),
          target,
          ...(exercise.rests?.[index]?.trim() ? { rest: exercise.rests[index].trim() } : {}),
          reps: target,
          weight: previousSet?.done && validWeight(previousSet.weight) ? previousSet.weight : '',
          done: false,
        };
      }),
    })),
  };
}
export const allSets = (workout: Workout) => workout.exercises.flatMap((exercise) => exercise.sets);
export function setActiveExerciseNote(
  database: Database,
  exerciseId: string,
  note: string,
): Database {
  if (!validExerciseNote(note))
    throw new Error('Use até 300 caracteres nas observações do exercício.');
  const active = database.active;
  if (!active?.exercises.some((exercise) => exercise.id === exerciseId)) return database;
  return {
    ...database,
    active: {
      ...active,
      exercises: active.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, note } : exercise,
      ),
    },
    routines: database.routines.map((routine) =>
      routine.id === active.routineId &&
      routine.exercises.some((exercise) => exercise.id === exerciseId)
        ? {
            ...routine,
            updatedAt: new Date().toISOString(),
            exercises: routine.exercises.map((exercise) =>
              exercise.id === exerciseId ? { ...exercise, note } : exercise,
            ),
          }
        : routine,
    ),
  };
}
export type ExerciseLoadRecord = {
  workoutId: string;
  date: string;
  weight: number;
  reps: number;
};
export function exerciseLoadHistory(
  history: readonly Workout[],
  routineId: string,
  exerciseId: string,
): ExerciseLoadRecord[] {
  return history
    .filter((workout) => workout.routineId === routineId && workout.finishedAt)
    .flatMap((workout) => {
      const exercise = workout.exercises.find((item) => item.id === exerciseId);
      const heaviest = exercise?.sets
        .filter((set) => set.done && validWeight(set.weight) && validReps(set.reps))
        .map((set) => ({ weight: numberValue(set.weight), reps: Number(set.reps) }))
        .reduce<{ weight: number; reps: number } | undefined>((best, set) => {
          // For equal loads, use the completed set with the most repetitions.
          return !best ||
            set.weight > best.weight ||
            (set.weight === best.weight && set.reps > best.reps)
            ? set
            : best;
        }, undefined);
      return heaviest ? [{ workoutId: workout.id, date: workout.finishedAt!, ...heaviest }] : [];
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
export function exerciseTotalLoadHistory(
  history: readonly Workout[],
  routineId: string,
  exerciseId: string,
): { workoutId: string; date: string; weight: number }[] {
  return history
    .filter((workout) => workout.routineId === routineId && workout.finishedAt)
    .flatMap((workout) => {
      const sets =
        workout.exercises
          .find((exercise) => exercise.id === exerciseId)
          ?.sets.filter((set) => set.done && validReps(set.reps) && validWeight(set.weight)) ?? [];
      return sets.length
        ? [
            {
              workoutId: workout.id,
              date: workout.finishedAt!,
              weight: sets.reduce(
                (total, set) => total + Number(set.reps) * numberValue(set.weight),
                0,
              ),
            },
          ]
        : [];
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
// IDs keep equally named exercises in distinct routines separate, including deleted routines.
export function exerciseHistoryOptions(history: readonly Workout[]) {
  const options = new Map<
    string,
    {
      key: string;
      routineId: string;
      exerciseId: string;
      routineName: string;
      exerciseName: string;
    }
  >();
  for (const workout of [...history]
    .filter((item) => item.finishedAt)
    .sort((a, b) => Date.parse(a.finishedAt!) - Date.parse(b.finishedAt!))) {
    for (const exercise of workout.exercises) {
      if (!exercise.sets.some((set) => set.done && validReps(set.reps) && validWeight(set.weight)))
        continue;
      const key = JSON.stringify([workout.routineId, exercise.id]);
      options.set(key, {
        key,
        routineId: workout.routineId,
        exerciseId: exercise.id,
        routineName: workout.name,
        exerciseName: exercise.name,
      });
    }
  }
  return [...options.values()];
}
export function workoutError(workout: Workout): string | null {
  const completed = allSets(workout).filter((set) => set.done);
  if (!completed.length) return 'Conclua pelo menos uma série antes de salvar o treino.';
  if (completed.some((set) => !validReps(set.reps) || !validWeight(set.weight)))
    return 'Confira as repetições e a carga das séries concluídas.';
  return null;
}
export function finishWorkout(db: Database, bodyWeight = '', bodyHeight?: string): Database {
  if (!db.active) throw new Error('Nenhum treino em andamento.');
  const error = workoutError(db.active);
  if (error) throw new Error(error);
  const weight = bodyWeight.trim();
  if (weight && !validBodyWeight(weight))
    throw new Error('Informe um peso maior que 0 e até 999 kg.');
  if (bodyHeight && !validHeight(bodyHeight)) throw new Error('Informe uma altura de 50 a 250 cm.');
  return {
    ...db,
    active: null,
    workouts: [
      {
        ...db.active,
        bodyWeight: weight || undefined,
        ...(bodyHeight !== undefined ? { bodyHeight: bodyHeight || undefined } : {}),
        finishedAt: new Date().toISOString(),
      },
      ...db.workouts,
    ],
  };
}
export const volume = (workout: Workout) =>
  allSets(workout)
    .filter((set) => set.done)
    .reduce((sum, set) => sum + numberValue(set.reps) * numberValue(set.weight), 0);
export const totalRoutineSets = (routine: Routine) =>
  routine.exercises.reduce((sum, exercise) => sum + exercise.reps.length, 0);
export const formatNumber = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
export const duration = (workout: Workout) =>
  Math.max(
    1,
    Math.round(
      (new Date(workout.finishedAt ?? new Date()).getTime() -
        new Date(workout.startedAt).getTime()) /
        60000,
    ),
  );

// Validate stored data before using it. Invalid data is never silently replaced.
export function parseDatabase(raw: string): Database {
  const value = JSON.parse(raw);
  const string = (v: unknown) => typeof v === 'string';
  const identity = (v: unknown) => string(v) && (v as string).trim().length > 0;
  // IDs are unique within their editing/deletion scope. Historical snapshots may
  // reuse the planned exercise ID across different workouts and routines.
  const uniqueIds = (items: readonly { id: string }[]) =>
    new Set(items.map((item) => item.id)).size === items.length;
  const date = (v: unknown) => string(v) && Number.isFinite(Date.parse(v as string));
  const routine = (r: any) =>
    r &&
    identity(r.id) &&
    string(r.name) &&
    string(r.note) &&
    (r.division === undefined ||
      (r.division &&
        string(r.division.id) &&
        r.division.id.trim() &&
        string(r.division.name) &&
        r.division.name.trim())) &&
    (r.weekdays === undefined || validWeekdays(r.weekdays)) &&
    date(r.updatedAt) &&
    Array.isArray(r.exercises) &&
    r.exercises.every(
      (e: any) =>
        e &&
        identity(e.id) &&
        string(e.name) &&
        (e.note === undefined || validExerciseNote(e.note)) &&
        (e.energyModel === undefined || energyModelError(e.energyModel) === null) &&
        (e.muscles === undefined || validMuscleLinks(e.muscles)) &&
        Array.isArray(e.reps) &&
        e.reps.every(string) &&
        (e.rests === undefined ||
          (Array.isArray(e.rests) &&
            e.rests.length === e.reps.length &&
            e.rests.every((rest: unknown) => string(rest) && validRest(rest as string)))),
    ) &&
    uniqueIds(r.exercises) &&
    routineError(r) === null;
  const workout = (w: any) =>
    w &&
    identity(w.id) &&
    identity(w.routineId) &&
    identity(w.name) &&
    date(w.startedAt) &&
    (w.finishedAt === undefined || date(w.finishedAt)) &&
    (w.bodyWeight === undefined || (string(w.bodyWeight) && validBodyWeight(w.bodyWeight))) &&
    (w.bodyHeight === undefined || validHeight(w.bodyHeight)) &&
    Array.isArray(w.exercises) &&
    w.exercises.length > 0 &&
    w.exercises.every(
      (e: any) =>
        e &&
        identity(e.id) &&
        identity(e.name) &&
        (e.energyModel === undefined || energyModelError(e.energyModel) === null) &&
        (e.note === undefined || validExerciseNote(e.note)) &&
        (e.muscles === undefined || validMuscleLinks(e.muscles)) &&
        (e.loadAdjustment === undefined ||
          (typeof e.loadAdjustment === 'string' &&
            Object.hasOwn(loadAdjustments, e.loadAdjustment))) &&
        (e.cramp === undefined || typeof e.cramp === 'boolean') &&
        (e.externalImpediment === undefined || typeof e.externalImpediment === 'boolean') &&
        Array.isArray(e.sets) &&
        e.sets.length > 0 &&
        e.sets.length <= 20 &&
        e.sets.every(
          (s: any) =>
            s &&
            identity(s.id) &&
            string(s.target) &&
            validReps(s.target) &&
            string(s.reps) &&
            string(s.weight) &&
            (s.rest === undefined || (string(s.rest) && validRest(s.rest))) &&
            (s.longRest === undefined || typeof s.longRest === 'boolean') &&
            (s.restPause === undefined || typeof s.restPause === 'boolean') &&
            (s.cramp === undefined || typeof s.cramp === 'boolean') &&
            typeof s.done === 'boolean' &&
            (!s.done || (validReps(s.reps) && validWeight(s.weight))),
        ) &&
        uniqueIds(e.sets),
    ) &&
    uniqueIds(w.exercises) &&
    validExerciseOrder(w);
  if (
    value?.version !== 1 ||
    (value.bodyProfile !== undefined && !validProfile(value.bodyProfile)) ||
    (value.substanceBlends !== undefined &&
      (!Array.isArray(value.substanceBlends) ||
        value.substanceBlends.length > 50 ||
        !value.substanceBlends.every(validBlend) ||
        !uniqueIds(value.substanceBlends))) ||
    (value.substances !== undefined &&
      (!Array.isArray(value.substances) ||
        value.substances.length > 30 ||
        !value.substances.every(validSubstance) ||
        !uniqueIds(value.substances))) ||
    !Array.isArray(value.routines) ||
    !value.routines.every(routine) ||
    !uniqueIds(value.routines) ||
    (value.routineSets !== undefined &&
      (!Array.isArray(value.routineSets) ||
        !value.routineSets.length ||
        !value.routineSets.every(
          (set: any) =>
            set &&
            string(set.id) &&
            set.id.trim() &&
            string(set.name) &&
            set.name.trim() &&
            Array.isArray(set.routineIds) &&
            set.routineIds.every(
              (id: unknown) => string(id) && value.routines.some((r: Routine) => r.id === id),
            ) &&
            new Set(set.routineIds).size === set.routineIds.length,
        ) ||
        new Set(value.routineSets.map((set: RoutineSet) => set.id)).size !==
          value.routineSets.length)) ||
    (value.routineSets === undefined
      ? value.activeRoutineSetId !== undefined
      : !value.routineSets.some((set: RoutineSet) => set.id === value.activeRoutineSetId)) ||
    (value.strengthPaused !== undefined && typeof value.strengthPaused !== 'boolean') ||
    !Array.isArray(value.workouts) ||
    !value.workouts.every(
      (w: any) => workout(w) && date(w.finishedAt) && workoutError(w) === null,
    ) ||
    !uniqueIds(value.workouts) ||
    (value.supplements !== undefined &&
      (!Array.isArray(value.supplements) ||
        !value.supplements.every(isSupplement) ||
        new Set(value.supplements.map((item: Supplement) => item.id)).size !==
          value.supplements.length)) ||
    (value.cardioRoutines !== undefined &&
      (!Array.isArray(value.cardioRoutines) ||
        !value.cardioRoutines.every(isCardioRoutine) ||
        new Set(value.cardioRoutines.map((item: CardioRoutine) => item.id)).size !==
          value.cardioRoutines.length)) ||
    (value.activeCardio !== undefined &&
      value.activeCardio !== null &&
      !isCardioRun(value.activeCardio)) ||
    (value.cardioHistory !== undefined &&
      (!Array.isArray(value.cardioHistory) ||
        !value.cardioHistory.every(isCardioSession) ||
        new Set(value.cardioHistory.map((item: CardioSession) => item.id)).size !==
          value.cardioHistory.length)) ||
    !(value.active === null || workout(value.active))
  )
    throw new Error('Não foi possível ler os dados salvos. Eles foram preservados.');
  return value as Database;
}
