import type { Database } from './model.ts';
import {
  dayKey,
  setSupplementTaken,
  supplementError,
  validDay,
  validReminderTime,
  type Supplement,
} from './supplements.ts';
import { configuredDoseAmount } from './supplementDoseSchema.ts';
import { recordDose, rebuildDoses, type Substance } from './substances.ts';
import { formulaBudget } from './formulas.ts';
import { doseTime } from './substanceTime.ts';

export type SupplementHistoryEntry = {
  substanceId: string;
  name: string;
  unit: string;
  day: string;
  at: string;
  amount: number;
  estimatedTime: boolean;
  status: 'add' | 'existing' | 'future';
};
export type SupplementHistoryPlan = {
  signature: string;
  doseConfiguration: string;
  entries: SupplementHistoryEntry[];
};
const historySignature = (database: Database, id: string) =>
  JSON.stringify({
    supplement: database.supplements?.find((s) => s.id === id),
    substances: database.substances ?? [],
  });

function materializeHistory(
  database: Database,
  supplement: Supplement,
  entries: readonly SupplementHistoryEntry[],
) {
  const budget = formulaBudget();
  return (database.substances ?? []).map((substance) => {
    const additions = entries.filter((e) => e.substanceId === substance.id && e.status === 'add');
    if (!additions.length) return substance;
    const doses = additions.map((entry) => ({
      id: `supplement:${JSON.stringify([supplement.id, substance.id, entry.day])}`,
      at: entry.at,
      amount: entry.amount,
      model: JSON.parse(JSON.stringify(substance.model)),
      prior: [],
      supplement: {
        supplementId: supplement.id,
        supplementName: supplement.name.trim(),
        day: entry.day,
        estimatedTime: entry.estimatedTime,
      },
    }));
    if (doses.some((dose) => substance.doses.some((existing) => existing.id === dose.id)))
      throw new Error('Há uma ingestão com o mesmo identificador. Confira o histórico novamente.');
    return { ...substance, doses: rebuildDoses([...substance.doses, ...doses], budget) };
  });
}

export function previewSupplementHistory(
  database: Database,
  supplement: Supplement,
  averageTime: string,
  from = '',
  now = Date.now(),
): SupplementHistoryPlan {
  const error =
    supplementError(supplement) ?? supplementDoseError(supplement, database.substances ?? []);
  if (error) throw new Error(error);
  if (!supplement.substanceDoses?.length)
    throw new Error('Selecione uma substância e configure a dose antes de aproveitar o histórico.');
  if (from && !validDay(from))
    throw new Error('Use uma data inicial válida no formato AAAA-MM-DD.');
  const existing = database.supplements?.find((s) => s.id === supplement.id);
  const days = (existing?.takenOn ?? []).filter((day) => !from || day >= from).sort();
  if (days.some((day) => !existing?.takenAt?.[day]) && !validReminderTime(averageTime))
    throw new Error('Informe a hora média de ingestão (HH:mm) para os dias sem horário salvo.');
  const entries: SupplementHistoryEntry[] = [];
  for (const configured of supplement.substanceDoses) {
    const substance = database.substances!.find((s) => s.id === configured.substanceId)!;
    for (const day of days) {
      const actualTime = existing?.takenAt?.[day];
      const at = actualTime ?? doseTime(day, averageTime);
      const duplicate = substance.doses.some(
        (d) =>
          (d.supplement?.supplementId === supplement.id && d.supplement.day === day) ||
          dayKey(new Date(d.at)) === day,
      );
      entries.push({
        substanceId: substance.id,
        name: substance.name,
        unit: substance.unit,
        day,
        at,
        amount: configuredDoseAmount(configured.amount)!,
        estimatedTime: !actualTime,
        status: duplicate ? 'existing' : Date.parse(at) > now ? 'future' : 'add',
      });
    }
    if (
      substance.doses.length +
        entries.filter((e) => e.substanceId === substance.id && e.status === 'add').length >
      200
    )
      throw new Error(
        `${substance.name} ultrapassaria 200 ingestões. Escolha uma data inicial mais recente; nenhum registro será apagado.`,
      );
  }
  // Preview also validates the formula and accumulated residuals, atomically.
  materializeHistory(database, supplement, entries);
  return {
    signature: historySignature(database, supplement.id),
    doseConfiguration: JSON.stringify(supplement.substanceDoses),
    entries,
  };
}

export function saveSupplementConfiguration(
  database: Database,
  supplement: Supplement,
  plan?: SupplementHistoryPlan,
  now = Date.now(),
): Database {
  const error =
    supplementError(supplement) ?? supplementDoseError(supplement, database.substances ?? []);
  if (error) throw new Error(error);
  if (
    plan &&
    (plan.signature !== historySignature(database, supplement.id) ||
      plan.doseConfiguration !== JSON.stringify(supplement.substanceDoses))
  )
    throw new Error(
      'Os registros ou as doses mudaram depois da prévia. Confira o histórico novamente.',
    );
  if (plan?.entries.some((e) => e.status === 'add' && Date.parse(e.at) > now))
    throw new Error('O horário do aparelho mudou. Confira a prévia novamente.');
  const items = database.supplements ?? [];
  const existing = items.find((s) => s.id === supplement.id);
  const cleaned = {
    ...supplement,
    name: supplement.name.trim(),
    note: supplement.note.trim(),
    takenOn: existing?.takenOn ?? [],
    takenAt: existing?.takenAt,
  };
  return {
    ...database,
    ...(plan ? { substances: materializeHistory(database, cleaned, plan.entries) } : {}),
    supplements: existing
      ? items.map((s) => (s.id === cleaned.id ? cleaned : s))
      : [...items, cleaned],
  };
}

export function supplementDoseError(
  supplement: Supplement,
  substances: readonly Substance[],
): string | null {
  for (const dose of supplement.substanceDoses ?? []) {
    const substance = substances.find((s) => s.id === dose.substanceId);
    if (!substance)
      return 'Uma substância vinculada foi removida. Edite o suplemento para corrigir o vínculo.';
    if (substance.unit !== dose.unit)
      return `A unidade de ${substance.name} mudou. Confira a dose no suplemento.`;
    if (configuredDoseAmount(dose.amount) === undefined)
      return `Confira a dose de ${substance.name}.`;
  }
  return null;
}

export function setSupplementTakenWithDoses(
  database: Database,
  id: string,
  taken: boolean,
  now: Date,
): Database {
  const supplement = database.supplements?.find((s) => s.id === id);
  if (!supplement) return database;
  const day = dayKey(now);
  if (supplement.takenOn.includes(day) === taken) return database;
  const budget = formulaBudget();
  let substances = database.substances;
  if (taken && supplement.substanceDoses?.length) {
    const error = supplementDoseError(supplement, substances ?? []);
    if (error) throw new Error(error);
    substances = (substances ?? []).map((substance) => {
      const configured = supplement.substanceDoses!.find((d) => d.substanceId === substance.id);
      if (
        !configured ||
        substance.doses.some((d) => d.supplement?.supplementId === id && d.supplement.day === day)
      )
        return substance;
      return recordDose(
        substance,
        {
          id: `supplement:${JSON.stringify([id, substance.id, day])}`,
          at: now.toISOString(),
          amount: configuredDoseAmount(configured.amount)!,
          supplement: {
            supplementId: id,
            supplementName: supplement.name,
            day,
            estimatedTime: false,
          },
        },
        now.getTime(),
        budget,
      );
    });
  } else if (!taken && substances) {
    substances = substances.map((substance) => {
      const doses = substance.doses.filter(
        (d) => !(d.supplement?.supplementId === id && d.supplement.day === day),
      );
      return doses.length === substance.doses.length
        ? substance
        : { ...substance, doses: rebuildDoses(doses, budget) };
    });
  }
  return {
    ...database,
    ...(substances !== undefined ? { substances } : {}),
    supplements: database.supplements!.map((s) =>
      s.id === id ? setSupplementTaken(s, taken, now) : s,
    ),
  };
}
