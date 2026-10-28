export type BlendComponent = { substanceId: string; amount: number; unit: string };
export type SubstanceBlend = { id: string; name: string; components: BlendComponent[] };
export type BlendIntake = {
  intakeId: string;
  blendId: string;
  name: string;
  servings: number;
  components: (BlendComponent & { name: string })[];
};
const identity = (v: unknown, max = 160): v is string =>
  typeof v === 'string' && !!v.trim() && v.length <= max;
const positive = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max;
function validComponents(value: unknown): value is BlendComponent[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.length <= 30 &&
    value.every(
      (c) => c && identity(c.substanceId) && positive(c.amount, 1e9) && identity(c.unit, 16),
    ) &&
    new Set(value.map((c) => c.substanceId)).size === value.length
  );
}
export function validBlend(value: unknown): value is SubstanceBlend {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const b = value as SubstanceBlend;
  return identity(b.id) && identity(b.name, 80) && validComponents(b.components);
}
export function validBlendIntake(
  value: unknown,
  substanceId: string,
  amount: number,
  unit: string,
): value is BlendIntake {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const intake = value as BlendIntake;
  return (
    identity(intake.intakeId) &&
    identity(intake.blendId) &&
    identity(intake.name, 80) &&
    positive(intake.servings, 1000) &&
    validComponents(intake.components) &&
    intake.components.every((c) => identity(c.name, 80)) &&
    intake.components.some(
      (c) => c.substanceId === substanceId && c.amount === amount && c.unit === unit,
    )
  );
}
