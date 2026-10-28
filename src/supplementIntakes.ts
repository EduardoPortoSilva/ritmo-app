import { dayKey, type Supplement } from './supplements.ts';
import type { Substance } from './substances.ts';

export function linkedSupplements(
  supplements: readonly Supplement[],
  substanceIds: readonly string[],
  blendId?: string,
): Supplement[] {
  const ids = new Set(substanceIds);
  return supplements.filter(
    (s) =>
      s.substanceIds?.some((id) => ids.has(id)) ||
      (blendId !== undefined && s.blendIds?.includes(blendId)),
  );
}

// Only newly recorded doses trigger the daily check. Editing models, removing doses
// or changing links must not replay older intakes or undo a manual daily record.
export function markSupplementsForNewDoses(
  supplements: readonly Supplement[],
  previous: readonly Substance[],
  next: readonly Substance[],
): Supplement[] {
  const daysBySupplement = new Map<string, Set<string>>();
  for (const item of next) {
    const known = new Set(previous.find((s) => s.id === item.id)?.doses.map((d) => d.id));
    for (const dose of item.doses) {
      if (known.has(dose.id)) continue;
      const day = dayKey(new Date(dose.at));
      for (const supplement of linkedSupplements(supplements, [item.id], dose.blend?.blendId)) {
        let days = daysBySupplement.get(supplement.id);
        if (!days) {
          days = new Set(supplement.takenOn);
          daysBySupplement.set(supplement.id, days);
        }
        days.add(day);
      }
    }
  }
  return supplements.map((s) => {
    const days = daysBySupplement.get(s.id);
    return days ? { ...s, takenOn: [...days].sort() } : s;
  });
}
