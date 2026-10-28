import { evaluateFormula, formulaError, formulaBudget, type Formula } from './formulas.ts';
import type { Workout } from './model.ts';

export const energyVariables = [
  'bodyWeight',
  'height',
  'load',
  'totalLoad',
  'reps',
  'seconds',
  'sides',
] as const;
export const loadBases = {
  total: 'Carga total',
  'per-side': 'Por lado (2 lados)',
  'per-hand': 'Por halter (2 halteres)',
  unilateral: 'Um lado por série',
} as const;
export type EnergyModel = {
  formula: Formula;
  loadBasis: keyof typeof loadBases;
  loadMultiplier: number;
  secondsPerRep: number;
};
export type BodyProfile = { weightKg: string; heightCm: string; weightRecordedAt?: string };
const number = (s: string) =>
  /^\d+(?:[.,]\d+)?$/.test(s.trim()) ? Number(s.trim().replace(',', '.')) : NaN;
export const validHeight = (s: unknown): s is string =>
  typeof s === 'string' && number(s) >= 50 && number(s) <= 250;
export function validProfile(value: unknown): value is BodyProfile {
  if (!value || typeof value !== 'object') return false;
  const p = value as BodyProfile;
  return (
    typeof p.weightKg === 'string' &&
    (p.weightKg === '' || (number(p.weightKg) > 0 && number(p.weightKg) <= 999)) &&
    (p.weightRecordedAt === undefined ||
      (!!p.weightKg &&
        typeof p.weightRecordedAt === 'string' &&
        Number.isFinite(Date.parse(p.weightRecordedAt)))) &&
    typeof p.heightCm === 'string' &&
    (p.heightCm === '' || validHeight(p.heightCm))
  );
}
export function energyModelError(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Informe o modelo de calorias.';
  const model = value as EnergyModel;
  if (
    Object.keys(model).some(
      (key) => !['formula', 'loadBasis', 'loadMultiplier', 'secondsPerRep'].includes(key),
    )
  )
    return 'Campo desconhecido no modelo de calorias.';
  if (!Object.hasOwn(loadBases, model.loadBasis)) return 'Defina como a carga foi registrada.';
  if (
    !Number.isFinite(model.loadMultiplier) ||
    model.loadMultiplier < 0.01 ||
    model.loadMultiplier > 20
  )
    return 'Multiplicador da carga: use de 0,01 a 20.';
  if (
    !Number.isFinite(model.secondsPerRep) ||
    model.secondsPerRep < 0.1 ||
    model.secondsPerRep > 60
  )
    return 'Tempo por repetição: use de 0,1 a 60 segundos.';
  return formulaError(model.formula, energyVariables);
}
export function estimateWorkoutEnergy(workout: Workout) {
  let kcal = 0,
    covered = 0,
    total = 0;
  const issues: string[] = [];
  const budget = formulaBudget();
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets.filter((s) => s.done)) {
      total++;
      if (!exercise.energyModel) {
        issues.push(`${exercise.name}: sem fórmula.`);
        continue;
      }
      const m = exercise.energyModel;
      try {
        const error = energyModelError(m);
        if (error) throw new Error(error);
        const reps = number(set.reps),
          load = number(set.weight);
        const sides = m.loadBasis === 'per-side' || m.loadBasis === 'per-hand' ? 2 : 1;
        const input: Record<string, number> = {
          reps,
          load,
          sides,
          totalLoad: load * sides * m.loadMultiplier,
          seconds: reps * m.secondsPerRep,
        };
        if (workout.bodyWeight) input.bodyWeight = number(workout.bodyWeight);
        if (workout.bodyHeight) input.height = number(workout.bodyHeight);
        const value = evaluateFormula(m.formula, input, budget);
        if (value < 0 || value > 10_000)
          throw new Error('Resultado fora de 0 a 10.000 kcal por série.');
        kcal += value;
        covered++;
      } catch (e) {
        issues.push(`${exercise.name}: ${(e as Error).message}`);
      }
    }
  }
  return { kcal: covered ? kcal : null, covered, total, issues: [...new Set(issues)] };
}
