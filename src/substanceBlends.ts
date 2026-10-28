import { formulaBudget } from './formulas.ts';
import { recordDose, rebuildDoses, type Substance } from './substances.ts';

import { validBlend, type SubstanceBlend, type BlendIntake } from './substanceBlendSchema.ts';
export {
  validBlend,
  type SubstanceBlend,
  type BlendIntake,
  type BlendComponent,
} from './substanceBlendSchema.ts';
const identity = (v: unknown, max = 160): v is string =>
  typeof v === 'string' && !!v.trim() && v.length <= max;
const positive = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max;
export function blendError(blend: unknown, items: readonly Substance[]): string | null {
  if (!validBlend(blend))
    return 'Dê um nome ao blend e escolha de 2 a 30 substâncias diferentes, com quantidades positivas.';
  for (const component of blend.components) {
    const item = items.find((s) => s.id === component.substanceId);
    if (!item)
      return 'Uma substância do blend foi removida. Edite a composição antes de registrar.';
    if (item.unit !== component.unit)
      return `${item.name}: a unidade mudou. Confira a quantidade e salve a composição novamente.`;
  }
  return null;
}
export function recordBlend(
  items: readonly Substance[],
  blend: SubstanceBlend,
  input: { id: string; at: string; servings: number },
  now = Date.now(),
): Substance[] {
  const error = blendError(blend, items);
  if (error) throw new Error(error);
  if (!identity(input.id) || !positive(input.servings, 1000))
    throw new Error('Informe de mais de zero até 1.000 porções.');
  if (items.some((s) => s.doses.some((d) => d.blend?.intakeId === input.id)))
    throw new Error('Esta ingestão do blend já foi registrada.');
  const tag: BlendIntake = {
    intakeId: input.id,
    blendId: blend.id,
    name: blend.name,
    servings: input.servings,
    components: blend.components.map((c) => ({
      ...c,
      amount: c.amount * input.servings,
      name: items.find((s) => s.id === c.substanceId)!.name,
    })),
  };
  if (!tag.components.every((c) => positive(c.amount, 1e9)))
    throw new Error('A quantidade total de um componente ultrapassa o limite permitido.');
  const budget = formulaBudget();
  // Build the entire result before the caller persists anything.
  return items.map((item) => {
    const component = tag.components.find((c) => c.substanceId === item.id);
    if (!component) return item;
    const id = `${input.id}/${item.id}`;
    const next = recordDose(item, { id, at: input.at, amount: component.amount }, now, budget);
    return {
      ...next,
      doses: next.doses.map((d) =>
        d.id === id ? { ...d, blend: JSON.parse(JSON.stringify(tag)) as BlendIntake } : d,
      ),
    };
  });
}
export function removeBlendIntake(items: readonly Substance[], intakeId: string): Substance[] {
  const budget = formulaBudget();
  return items.map((s) =>
    s.doses.some((d) => d.blend?.intakeId === intakeId)
      ? {
          ...s,
          doses: rebuildDoses(
            s.doses.filter((d) => d.blend?.intakeId !== intakeId),
            budget,
          ),
        }
      : s,
  );
}
export const formatSubstanceQuantity = (value: number) =>
  value.toLocaleString('pt-BR', { maximumSignificantDigits: 8 });
