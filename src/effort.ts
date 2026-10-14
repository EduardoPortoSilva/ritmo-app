import { volume, type Workout } from './model.ts';

const seriesColors = [
  '#176B69',
  '#8C4B13',
  '#6654A8',
  '#A93F50',
  '#2366A8',
  '#765B21',
  '#8D4387',
  '#407B2C',
  '#A94F38',
  '#39758E',
  '#66533F',
  '#4D568F',
];

export type EffortRecord = {
  workoutId: string;
  routineId: string;
  date: string;
  name: string;
  groupKey: string;
  label: string;
  part: number;
  color: string;
  volume: number;
  maxVolume: number;
  percent: number | null;
};

export type EffortGroup = {
  key: string;
  routineId: string;
  label: string;
  color: string;
  part: number;
  maxVolume: number;
  records: EffortRecord[];
};

export type EffortHistory = { groups: EffortGroup[]; records: EffortRecord[] };

export function workoutPlanSignature(workout: Workout): string {
  return JSON.stringify(
    workout.exercises.map((exercise) => [
      exercise.id,
      exercise.name.trim(),
      exercise.sets.map((set) => Number(set.target)),
    ]),
  );
}

export function effortHistory(history: readonly Workout[]): EffortHistory {
  const sorted = history
    .filter((workout) => workout.finishedAt && Number.isFinite(Date.parse(workout.finishedAt)))
    .sort((a, b) => Date.parse(a.finishedAt!) - Date.parse(b.finishedAt!));
  const lastByRoutine = new Map<string, { signature: string; group: EffortGroup }>();
  const groups: EffortGroup[] = [];

  for (const workout of sorted) {
    const signature = workoutPlanSignature(workout);
    const last = lastByRoutine.get(workout.routineId);
    let group = last?.group;
    if (!last || last.signature !== signature) {
      const part = (last?.group.part ?? 0) + 1;
      group = {
        key: JSON.stringify([workout.routineId, part]),
        routineId: workout.routineId,
        label: workout.name,
        color: seriesColors[groups.length % seriesColors.length],
        part,
        maxVolume: 0,
        records: [],
      };
      groups.push(group);
      lastByRoutine.set(workout.routineId, { signature, group });
    }
    group!.label = workout.name;
    const amount = volume(workout);
    group!.maxVolume = Math.max(group!.maxVolume, amount);
    group!.records.push({
      workoutId: workout.id,
      routineId: workout.routineId,
      date: workout.finishedAt!,
      name: workout.name,
      groupKey: group!.key,
      label: '',
      part: group!.part,
      color: group!.color,
      volume: amount,
      maxVolume: 0,
      percent: null,
    });
  }

  const names = new Map<string, string[]>();
  for (const group of groups) {
    const ids = names.get(group.label) ?? [];
    if (!ids.includes(group.routineId)) ids.push(group.routineId);
    names.set(group.label, ids);
  }
  const partsByRoutine = new Map<string, number>();
  for (const group of groups)
    partsByRoutine.set(
      group.routineId,
      Math.max(partsByRoutine.get(group.routineId) ?? 0, group.part),
    );

  for (const group of groups) {
    const matchingIds = names.get(group.label)!;
    const routineSuffix =
      matchingIds.length > 1 ? ' · treino ' + (matchingIds.indexOf(group.routineId) + 1) : '';
    const partSuffix =
      (partsByRoutine.get(group.routineId) ?? 0) > 1 ? ' · parte ' + group.part : '';
    group.label += routineSuffix + partSuffix;
    for (const record of group.records) {
      record.label = group.label;
      record.maxVolume = group.maxVolume;
      record.percent =
        group.maxVolume > 0 ? Math.floor((record.volume / group.maxVolume) * 100 + 1e-9) : null;
    }
  }

  return {
    groups,
    records: groups
      .flatMap((group) => group.records)
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
  };
}

export type ChartWindow = '30d' | '90d' | '1y' | 'all';
export const chartWindows: { key: ChartWindow; label: string; days: number | null }[] = [
  { key: '30d', label: '30 dias', days: 30 },
  { key: '90d', label: '90 dias', days: 90 },
  { key: '1y', label: '1 ano', days: 365 },
  { key: 'all', label: 'Tudo', days: null },
];

export function inChartWindow(date: string, window: ChartWindow, now = Date.now()): boolean {
  const days = chartWindows.find((option) => option.key === window)?.days;
  return days === null || (days !== undefined && Date.parse(date) >= now - days * 86_400_000);
}
