export const localDate = (now: Date) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export const localTime = (now: Date) =>
  `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
export function doseTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error('Use data AAAA-MM-DD e horário HH:mm.');
  const parsed = new Date(`${date}T${time}:00`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    localDate(parsed) !== date ||
    localTime(parsed) !== time
  )
    throw new Error('Data ou horário inválido.');
  return parsed.toISOString();
}
