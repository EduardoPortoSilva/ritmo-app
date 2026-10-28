export type SupplementSubstanceDose = { substanceId: string; amount: string; unit: string };
export type SupplementDoseSource = {
  supplementId: string;
  supplementName: string;
  day: string;
  estimatedTime: boolean;
};

export function configuredDoseAmount(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) return;
  const amount = Number(value.trim().replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 && amount <= 1e9 ? amount : undefined;
}
export function validSupplementDoses(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 30) return false;
  const ids = new Set<string>();
  return value.every((dose) => {
    if (
      !dose ||
      typeof dose.substanceId !== 'string' ||
      !dose.substanceId.trim() ||
      dose.substanceId.length > 160 ||
      ids.has(dose.substanceId) ||
      configuredDoseAmount(dose.amount) === undefined ||
      typeof dose.unit !== 'string' ||
      !dose.unit.trim() ||
      dose.unit.length > 16
    )
      return false;
    ids.add(dose.substanceId);
    return true;
  });
}
export function validSupplementDoseSource(value: unknown): value is SupplementDoseSource {
  if (!value || typeof value !== 'object') return false;
  const source = value as SupplementDoseSource;
  if (
    typeof source.supplementId !== 'string' ||
    !source.supplementId.trim() ||
    typeof source.supplementName !== 'string' ||
    !source.supplementName.trim() ||
    source.supplementName.length > 80 ||
    typeof source.estimatedTime !== 'boolean' ||
    typeof source.day !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(source.day)
  )
    return false;
  const parsed = new Date(`${source.day}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === source.day;
}
