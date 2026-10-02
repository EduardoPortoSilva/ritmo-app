export type RestTimer = {
  exerciseId: string;
  setId: string;
  durationMs: number;
  remainingMs: number;
  runningSince: number | null;
};

export function startRestTimer(
  exerciseId: string,
  setId: string,
  seconds: number,
  now = Date.now(),
): RestTimer {
  return {
    exerciseId,
    setId,
    durationMs: seconds * 1000,
    remainingMs: seconds * 1000,
    runningSince: now,
  };
}

export function restRemainingMs(timer: RestTimer, now = Date.now()): number {
  return Math.max(
    0,
    timer.remainingMs - (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince)),
  );
}

export function pauseRestTimer(timer: RestTimer, now = Date.now()): RestTimer {
  return { ...timer, remainingMs: restRemainingMs(timer, now), runningSince: null };
}

export function resumeRestTimer(timer: RestTimer, now = Date.now()): RestTimer {
  return { ...timer, runningSince: timer.remainingMs > 0 ? now : null };
}

export function formatRestRemaining(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
