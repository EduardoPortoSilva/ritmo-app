import {
  evaluateFormula,
  formulaError,
  formulaBudget,
  type Formula,
  type FormulaBudget,
} from './formulas.ts';
import { validBlendIntake, type BlendIntake } from './substanceBlendSchema.ts';

export const substanceVariables = ['t', 'd', 'a', 'h', 'p1', 'p2', 'p3', 'p4'] as const;
export type SubstanceModel = {
  formula: Formula;
  mode: 'sum' | 'state';
  absorptionHours: number;
  halfLifeHours: number;
  horizonHours: number;
};
export type SubstanceDose = {
  blend?: BlendIntake;
  id: string;
  at: string;
  amount: number;
  model: SubstanceModel;
  prior: number[];
};
export type Substance = {
  id: string;
  name: string;
  unit: string;
  model: SubstanceModel;
  doses: SubstanceDose[];
};
const positive = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max;
export const doseModelExample = (): SubstanceModel => ({
  mode: 'sum',
  absorptionHours: 1,
  halfLifeHours: 5,
  horizonHours: 24,
  formula: {
    expression: 'd * (1 - exp(-ln(2) * t / a)) * exp(-ln(2) * t / h)',
    parameters: {},
    reference:
      'Exemplo matemático ilustrativo. a é a meia-vida de absorção, h a meia-vida de eliminação, em horas. Parâmetros devem ser definidos para a substância.',
  },
});
export function substanceModelError(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Informe o modelo da substância.';
  const m = value as SubstanceModel;
  if (
    Object.keys(m).some(
      (k) => !['formula', 'mode', 'absorptionHours', 'halfLifeHours', 'horizonHours'].includes(k),
    )
  )
    return 'Campo desconhecido no modelo da substância.';
  if (m.mode !== 'sum' && m.mode !== 'state') return 'Escolha soma de doses ou estado acumulado.';
  if (!positive(m.absorptionHours, 8760) || !positive(m.halfLifeHours, 8760))
    return 'Absorção e meia-vida: use horas maiores que zero, até 8.760.';
  if (!positive(m.horizonHours, 8760))
    return 'Janela do gráfico: use de mais de zero até 8.760 horas.';
  return formulaError(
    m.formula,
    m.mode === 'sum' ? substanceVariables.slice(0, 4) : substanceVariables,
  );
}
const quantity = (value: number) => {
  if (!Number.isFinite(value) || value < 0 || value > 1e9)
    throw new Error('O modelo retornou uma quantidade fora de 0 a 1 bilhão.');
  return value;
};
function contribution(dose: SubstanceDose, time: number, budget: FormulaBudget) {
  const t = (time - Date.parse(dose.at)) / 3_600_000;
  if (t < 0) return 0;
  return quantity(
    evaluateFormula(
      dose.model.formula,
      {
        t,
        d: dose.amount,
        a: dose.model.absorptionHours,
        h: dose.model.halfLifeHours,
        p1: dose.prior[0] ?? 0,
        p2: dose.prior[1] ?? 0,
        p3: dose.prior[2] ?? 0,
        p4: dose.prior[3] ?? 0,
      },
      budget,
    ),
  );
}
export function substanceAmount(substance: Substance, time: number, budget = formulaBudget()) {
  if (!Number.isFinite(time)) throw new Error('Horário inválido.');
  const doses = substance.doses.filter((d) => Date.parse(d.at) <= time);
  if (!doses.length) return 0;
  // Mode cannot change within a tracker with records: additive and joint models differ.
  return quantity(
    substance.model.mode === 'state'
      ? contribution(doses[doses.length - 1], time, budget)
      : doses.reduce((sum, dose) => sum + contribution(dose, time, budget), 0),
  );
}
export function rebuildDoses(doses: SubstanceDose[], budget = formulaBudget()): SubstanceDose[] {
  if (doses.length > 200)
    throw new Error(
      'Limite de 200 ingestões por acompanhamento. Exporte um backup antes de remover registros antigos.',
    );
  const sorted = doses
    .map((dose, index) => ({ dose, index }))
    .sort((a, b) => Date.parse(a.dose.at) - Date.parse(b.dose.at) || a.index - b.index)
    .map((item) => item.dose);
  const result: SubstanceDose[] = [];
  for (const dose of sorted) {
    const prior =
      dose.model.mode === 'state'
        ? [
            result.length
              ? contribution(result[result.length - 1], Date.parse(dose.at), budget)
              : 0,
            ...(result.at(-1)?.prior.slice(0, 3) ?? [0, 0, 0]),
          ]
        : [];
    const next = { ...dose, prior };
    contribution(next, Date.parse(dose.at), budget);
    result.push(next);
  }
  return result;
}
export function recordDose(
  substance: Substance,
  dose: { id: string; at: string; amount: number },
  now = Date.now(),
  budget = formulaBudget(),
): Substance {
  if (
    !positive(dose.amount, 1e9) ||
    !Number.isFinite(Date.parse(dose.at)) ||
    Date.parse(dose.at) > now
  )
    throw new Error('Informe uma quantidade positiva e um horário de ingestão que já ocorreu.');
  if (substance.doses.some((d) => d.id === dose.id))
    throw new Error('Identificador de ingestão repetido.');
  const error = substanceModelError(substance.model);
  if (error) throw new Error(error);
  const snapshot = JSON.parse(JSON.stringify(substance.model)) as SubstanceModel;
  return {
    ...substance,
    doses: rebuildDoses([...substance.doses, { ...dose, model: snapshot, prior: [] }], budget),
  };
}
export function removeDose(substance: Substance, id: string): Substance {
  return { ...substance, doses: rebuildDoses(substance.doses.filter((d) => d.id !== id)) };
}
export function substanceCurve(substance: Substance, from: number) {
  const budget = formulaBudget();
  return Array.from({ length: 33 }, (_, i) => {
    const time = from + (substance.model.horizonHours * 3_600_000 * i) / 32;
    return { time, amount: substanceAmount(substance, time, budget) };
  });
}
export function validSubstance(value: unknown): value is Substance {
  if (!value || typeof value !== 'object') return false;
  const s = value as Substance;
  if (
    typeof s.id !== 'string' ||
    !s.id.trim() ||
    typeof s.name !== 'string' ||
    !s.name.trim() ||
    s.name.length > 80 ||
    typeof s.unit !== 'string' ||
    !s.unit.trim() ||
    s.unit.length > 16 ||
    substanceModelError(s.model) ||
    !Array.isArray(s.doses) ||
    s.doses.length > 200 ||
    new Set(s.doses.map((d) => d?.id)).size !== s.doses.length
  )
    return false;
  try {
    for (const [i, d] of s.doses.entries()) {
      if (
        !d ||
        typeof d.id !== 'string' ||
        !d.id.trim() ||
        typeof d.at !== 'string' ||
        !Number.isFinite(Date.parse(d.at)) ||
        !positive(d.amount, 1e9) ||
        (d.blend !== undefined && !validBlendIntake(d.blend, s.id, d.amount, s.unit)) ||
        substanceModelError(d.model) ||
        d.model.mode !== s.model.mode ||
        !Array.isArray(d.prior) ||
        d.prior.length !== (s.model.mode === 'state' ? 4 : 0) ||
        d.prior.some((v) => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1e9) ||
        (i > 0 && Date.parse(d.at) < Date.parse(s.doses[i - 1].at))
      )
        return false;
    }
    const rebuilt = rebuildDoses(s.doses);
    return rebuilt.every((d, i) =>
      d.prior.every((v, j) => Math.abs(v - s.doses[i].prior[j]) <= 1e-8 * Math.max(1, Math.abs(v))),
    );
  } catch {
    return false;
  }
}
