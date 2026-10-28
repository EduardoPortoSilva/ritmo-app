import { validSupplementDoses, type SupplementSubstanceDose } from './supplementDoseSchema.ts';

export type Supplement = {
  substanceDoses?: SupplementSubstanceDose[];
  id: string;
  name: string;
  note: string;
  createdAt: string;
  takenOn: string[];
  takenAt?: Record<string, string>;
  reminderTime?: string;
  substanceIds?: string[];
  blendIds?: string[];
};

export function dayKey(date: Date): string {
  return `${date.getFullYear().toString().padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export const validReminderTime = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

const validLinks = (value: unknown, max: number): boolean =>
  value === undefined ||
  (Array.isArray(value) &&
    value.length <= max &&
    value.every((id) => typeof id === 'string' && !!id.trim() && id.length <= 160) &&
    new Set(value).size === value.length);

export function supplementError(supplement: Supplement): string | null {
  if (!supplement.name.trim()) return 'Informe o nome do suplemento.';
  if (supplement.name.trim().length > 80) return 'Use até 80 caracteres no nome.';
  if (supplement.note.length > 300) return 'Use até 300 caracteres na observação.';
  if (!validLinks(supplement.substanceIds, 30) || !validLinks(supplement.blendIds, 50))
    return 'Confira os vínculos de substâncias e blends do suplemento.';
  if (!validSupplementDoses(supplement.substanceDoses))
    return 'Informe uma dose positiva válida para cada substância selecionada.';
  if (supplement.reminderTime !== undefined && !validReminderTime(supplement.reminderTime))
    return 'Use um horário válido: hora de 00 a 23 e minutos de 00 a 59.';
  return null;
}
export function isSupplement(value: any): value is Supplement {
  return (
    !!value &&
    typeof value.id === 'string' &&
    !!value.id &&
    typeof value.name === 'string' &&
    typeof value.note === 'string' &&
    typeof value.createdAt === 'string' &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    Array.isArray(value.takenOn) &&
    value.takenOn.every(validDay) &&
    new Set(value.takenOn).size === value.takenOn.length &&
    (value.takenAt === undefined ||
      (value.takenAt &&
        typeof value.takenAt === 'object' &&
        !Array.isArray(value.takenAt) &&
        Object.entries(value.takenAt).every(
          ([day, at]) =>
            value.takenOn.includes(day) &&
            typeof at === 'string' &&
            Number.isFinite(Date.parse(at)),
        ))) &&
    supplementError(value) === null
  );
}

function previousDay(key: string): string {
  // Calendar dates, not elapsed local hours: unaffected by daylight-saving days.
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
export function supplementStreak(supplement: Supplement, now: Date): number {
  const days = new Set(supplement.takenOn);
  let cursor = dayKey(now);
  if (!days.has(cursor)) cursor = previousDay(cursor);
  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor = previousDay(cursor);
  }
  return count;
}
export function setSupplementTaken(supplement: Supplement, taken: boolean, now: Date): Supplement {
  const day = dayKey(now);
  if (supplement.takenOn.includes(day) === taken) return supplement;
  const days = new Set(supplement.takenOn);
  if (taken) days.add(day);
  else days.delete(day);
  const takenAt = { ...supplement.takenAt };
  if (taken) takenAt[day] = now.toISOString();
  else delete takenAt[day];
  const { takenAt: _previousTimes, ...base } = supplement;
  return {
    ...base,
    takenOn: [...days].sort(),
    ...(Object.keys(takenAt).length ? { takenAt } : {}),
  };
}
export function recentSupplementDays(now: Date): string[] {
  const days = [dayKey(now)];
  while (days.length < 7) days.unshift(previousDay(days[0]));
  return days;
}
export function reminderSnapshot(supplements: readonly Supplement[]): string {
  return JSON.stringify(
    supplements
      .filter((item) => item.reminderTime)
      .map(({ id, name, reminderTime, takenOn }) => ({ id, name, time: reminderTime, takenOn })),
  );
}

export function supplementWidgetSnapshot(supplements: readonly Supplement[]): string {
  return JSON.stringify(supplements.map(({ id, name, takenOn }) => ({ id, name, takenOn })));
}
