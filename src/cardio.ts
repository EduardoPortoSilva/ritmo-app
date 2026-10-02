export type CardioStep = { id: string; minutes: string; speed: string };
export type CardioRoutine = {
  id: string;
  name: string;
  weekdays?: number[];
  steps: CardioStep[];
  updatedAt: string;
};
export type CardioRunStep = { durationSeconds: number; speed: number };
export type CardioRun = {
  id: string;
  routineId: string;
  name: string;
  steps: CardioRunStep[];
  elapsedMs: number;
  runningSince?: string;
  startedAt?: string;
};
export type CardioSession = {
  id: string;
  routineId: string;
  name: string;
  steps: CardioRunStep[];
  startedAt: string;
  finishedAt: string;
  elapsedMs: number;
  distanceKm?: string;
};

const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const decimal = (value: string) =>
  /^\d+(?:[.,]\d+)?$/.test(value.trim()) ? Number(value.trim().replace(',', '.')) : NaN;
const validDays = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  value.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
  new Set(value).size === value.length;

export const newCardioRoutine = (): CardioRoutine => ({
  id: id(),
  name: '',
  weekdays: [],
  steps: [{ id: id(), minutes: '1', speed: '5' }],
  updatedAt: new Date().toISOString(),
});
export const newCardioStep = (previous?: CardioStep): CardioStep => ({
  id: id(),
  minutes: previous?.minutes ?? '1',
  speed: previous?.speed ?? '5',
});
export const stepSeconds = (step: CardioStep) => Math.round(decimal(step.minutes) * 60);
export const cardioDuration = (steps: readonly CardioRunStep[]) =>
  steps.reduce((total, step) => total + step.durationSeconds, 0);
export const cardioPlanDuration = (routine: CardioRoutine) =>
  routine.steps.reduce((total, step) => total + stepSeconds(step), 0);
export const cardioForDate = (routines: readonly CardioRoutine[], date: Date) =>
  routines.filter((routine) => routine.weekdays?.includes(date.getDay()));
export const cardioDraftKey = (routine: CardioRoutine) =>
  JSON.stringify({
    name: routine.name,
    weekdays: [...(routine.weekdays ?? [])].sort(),
    steps: routine.steps.map((step) => [step.id, step.minutes, step.speed]),
  });

export function cardioRoutineError(routine: CardioRoutine): string | null {
  if (!routine.name.trim()) return 'Dê um nome para o cardio.';
  if (routine.weekdays !== undefined && !validDays(routine.weekdays))
    return 'Selecione dias da semana válidos.';
  if (!routine.steps.length || routine.steps.length > 50)
    return 'Inclua de 1 a 50 etapas no cardio.';
  let total = 0;
  for (const [index, step] of routine.steps.entries()) {
    const minutes = decimal(step.minutes);
    const seconds = stepSeconds(step);
    if (!Number.isFinite(minutes) || minutes < 0.1 || minutes > 60 || !Number.isInteger(seconds))
      return `Use duração entre 0,1 e 60 minutos na etapa ${index + 1}.`;
    const speed = decimal(step.speed);
    if (!Number.isFinite(speed) || speed < 0 || speed > 40)
      return `Use velocidade entre 0 e 40 km/h na etapa ${index + 1}.`;
    total += seconds;
  }
  if (total > 4 * 3600) return 'O cardio pode ter no máximo 4 horas.';
  return null;
}
export const cleanCardioRoutine = (routine: CardioRoutine): CardioRoutine => ({
  ...routine,
  name: routine.name.trim(),
  steps: routine.steps.map((step) => ({
    ...step,
    minutes: step.minutes.trim().replace(',', '.'),
    speed: step.speed.trim().replace(',', '.'),
  })),
  updatedAt: new Date().toISOString(),
});
export function startCardio(routine: CardioRoutine): CardioRun {
  const error = cardioRoutineError(routine);
  if (error) throw new Error(error);
  return {
    id: id(),
    routineId: routine.id,
    name: routine.name,
    steps: routine.steps.map((step) => ({
      durationSeconds: stepSeconds(step),
      speed: decimal(step.speed),
    })),
    elapsedMs: 0,
  };
}
export function expectedCardioDistance(steps: readonly CardioRunStep[], elapsedMs: number) {
  let remaining = Math.max(0, elapsedMs) / 1000;
  return steps.reduce((km, step) => {
    const seconds = Math.min(step.durationSeconds, remaining);
    remaining -= seconds;
    return km + (seconds * step.speed) / 3600;
  }, 0);
}
export const validCardioDistance = (value: string) =>
  value.trim() === '' || (Number.isFinite(decimal(value)) && decimal(value) <= 1000);
export const cardioDistanceValue = (value: string) => decimal(value);
export function cardioDistanceDifference(actualKm: number, expectedKm: number): number {
  // Round only floating-point noise near the 0.01 km boundary, not the displayed distance.
  const difference = Math.round((actualKm - expectedKm) * 1e9) / 1e9;
  return Math.abs(difference) < 0.01 ? 0 : difference;
}
export function finishCardio(run: CardioRun, distanceKm = '', now = Date.now()): CardioSession {
  if (!validCardioDistance(distanceKm))
    throw new Error('Informe a distância em km ou deixe em branco.');
  const elapsedMs = cardioProgress(run, now).elapsedMs;
  if (elapsedMs < 1000) throw new Error('Inicie o cardio antes de salvá-lo.');
  return {
    id: run.id,
    routineId: run.routineId,
    name: run.name,
    steps: run.steps.map((step) => ({ ...step })),
    startedAt: run.startedAt ?? new Date(now - elapsedMs).toISOString(),
    finishedAt: new Date(now).toISOString(),
    elapsedMs,
    ...(distanceKm.trim() ? { distanceKm: String(decimal(distanceKm)) } : {}),
  };
}
export function cardioCueBoundary(run: CardioRun, now = Date.now()): number | null {
  if (!run.runningSince) return null;
  const elapsed = cardioProgress(run, now).elapsedMs;
  let boundary = 0;
  for (let i = 0; i < run.steps.length - 1; i++) {
    boundary += run.steps[i].durationSeconds * 1000;
    if (
      run.steps[i].speed !== run.steps[i + 1].speed &&
      elapsed >= boundary - 3000 &&
      elapsed < boundary - 2000
    )
      return i;
  }
  return null;
}
export function cardioProgress(run: CardioRun, now = Date.now()) {
  const totalSeconds = cardioDuration(run.steps);
  const elapsedMs = Math.min(
    totalSeconds * 1000,
    run.elapsedMs + (run.runningSince ? Math.max(0, now - Date.parse(run.runningSince)) : 0),
  );
  let boundarySeconds = 0;
  for (const [index, step] of run.steps.entries()) {
    boundarySeconds += step.durationSeconds;
    if (elapsedMs < boundarySeconds * 1000)
      return {
        index,
        elapsedMs,
        elapsedSeconds: Math.floor(elapsedMs / 1000),
        remainingSeconds: Math.ceil((boundarySeconds * 1000 - elapsedMs) / 1000),
        totalSeconds,
        complete: false,
      };
  }
  return {
    index: run.steps.length,
    elapsedMs,
    elapsedSeconds: totalSeconds,
    remainingSeconds: 0,
    totalSeconds,
    complete: true,
  };
}
export const pauseCardio = (run: CardioRun, now = Date.now()): CardioRun => ({
  ...run,
  elapsedMs: cardioProgress(run, now).elapsedMs,
  runningSince: undefined,
});
export const resumeCardio = (run: CardioRun, now = Date.now()): CardioRun =>
  run.runningSince || cardioProgress(run, now).complete
    ? run
    : {
        ...run,
        startedAt: run.startedAt ?? new Date(now).toISOString(),
        runningSince: new Date(now).toISOString(),
      };

export const formatCardioTime = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;
export const formatCardioSpeed = (speed: number) =>
  speed.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function isCardioRoutine(value: unknown): value is CardioRoutine {
  if (!value || typeof value !== 'object') return false;
  const routine = value as CardioRoutine;
  return (
    typeof routine.id === 'string' &&
    !!routine.id.trim() &&
    typeof routine.name === 'string' &&
    (routine.weekdays === undefined || validDays(routine.weekdays)) &&
    typeof routine.updatedAt === 'string' &&
    Number.isFinite(Date.parse(routine.updatedAt)) &&
    Array.isArray(routine.steps) &&
    routine.steps.every(
      (step) =>
        step &&
        typeof step.id === 'string' &&
        !!step.id.trim() &&
        typeof step.minutes === 'string' &&
        typeof step.speed === 'string',
    ) &&
    new Set(routine.steps.map((step) => step.id)).size === routine.steps.length &&
    cardioRoutineError(routine) === null
  );
}
export function isCardioRun(value: unknown): value is CardioRun {
  if (!value || typeof value !== 'object') return false;
  const run = value as CardioRun;
  const steps = run.steps;
  return (
    typeof run.id === 'string' &&
    !!run.id.trim() &&
    typeof run.routineId === 'string' &&
    typeof run.name === 'string' &&
    !!run.name.trim() &&
    Array.isArray(steps) &&
    steps.length > 0 &&
    steps.length <= 50 &&
    steps.every(
      (step) =>
        step &&
        Number.isInteger(step.durationSeconds) &&
        step.durationSeconds >= 6 &&
        step.durationSeconds <= 3600 &&
        typeof step.speed === 'number' &&
        Number.isFinite(step.speed) &&
        step.speed >= 0 &&
        step.speed <= 40,
    ) &&
    cardioDuration(steps) <= 4 * 3600 &&
    typeof run.elapsedMs === 'number' &&
    Number.isFinite(run.elapsedMs) &&
    run.elapsedMs >= 0 &&
    run.elapsedMs <= cardioDuration(steps) * 1000 &&
    (run.startedAt === undefined ||
      (typeof run.startedAt === 'string' && Number.isFinite(Date.parse(run.startedAt)))) &&
    (run.runningSince === undefined ||
      (typeof run.runningSince === 'string' && Number.isFinite(Date.parse(run.runningSince))))
  );
}
export function isCardioSession(value: unknown): value is CardioSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as CardioSession;
  return (
    isCardioRun({ ...session, runningSince: undefined }) &&
    typeof session.startedAt === 'string' &&
    Number.isFinite(Date.parse(session.startedAt)) &&
    typeof session.finishedAt === 'string' &&
    Number.isFinite(Date.parse(session.finishedAt)) &&
    (session.distanceKm === undefined ||
      (typeof session.distanceKm === 'string' &&
        session.distanceKm.trim() !== '' &&
        validCardioDistance(session.distanceKm)))
  );
}
