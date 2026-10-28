import type { Database } from './model.ts';
import { energyModelError, type EnergyModel } from './energy.ts';
import { substanceModelError, type SubstanceModel } from './substances.ts';
import { assertStorableDatabase } from './backupLimits.ts';

export const MAX_FORMULA_BULK_CHARS = 250_000;
const key = (value: unknown): string => {
  if (value === undefined || value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(key).join(',')}]`;
  if (typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${key(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
};
const object = (value: unknown, allowed: string[], path: string) => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${path}: informe um objeto.`);
  const raw = value as Record<string, unknown>;
  if (Object.keys(raw).some((k) => !allowed.includes(k)))
    throw new Error(`${path}: campo desconhecido.`);
  return raw;
};
export function exportFormulaCatalog(db: Database) {
  return JSON.stringify(
    {
      formato: 'ritmo-formulas/1',
      exercicios: db.routines.flatMap((r) =>
        r.exercises.map((e) => ({
          rotinaId: r.id,
          rotina: r.name,
          exercicioId: e.id,
          exercicio: e.name,
          calorias: e.energyModel ?? null,
        })),
      ),
      substancias: (db.substances ?? []).map((s) => ({ id: s.id, nome: s.name, modelo: s.model })),
    },
    null,
    2,
  );
}
export type FormulaBulkPlan = {
  exercises: {
    routineId: string;
    exerciseId: string;
    name: string;
    before: string;
    model: EnergyModel | null;
  }[];
  substances: { id: string; name: string; before: string; model: SubstanceModel }[];
};
export function parseFormulaBulk(text: string, db: Database): FormulaBulkPlan {
  if (text.length > MAX_FORMULA_BULK_CHARS)
    throw new Error('Limite de 250.000 caracteres por lote de fórmulas.');
  let parsed;
  try {
    parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i, '$1'));
  } catch {
    throw new Error('JSON inválido. Confira aspas, vírgulas e chaves.');
  }
  const root = object(parsed, ['formato', 'exercicios', 'substancias'], 'raiz');
  if (root.formato !== 'ritmo-formulas/1')
    throw new Error('Use formato ritmo-formulas/1. Exporte o catálogo atual para obter os IDs.');
  const plan: FormulaBulkPlan = { exercises: [], substances: [] };
  const seen = new Set<string>();
  for (const field of ['exercicios', 'substancias'])
    if (root[field] !== undefined && !Array.isArray(root[field]))
      throw new Error(`${field}: informe uma lista.`);
  for (const [index, value] of ((root.exercicios ?? []) as unknown[]).entries()) {
    const path = `exercicios[${index}]`;
    const raw = object(value, ['rotinaId', 'rotina', 'exercicioId', 'exercicio', 'calorias'], path);
    if (
      typeof raw.rotinaId !== 'string' ||
      typeof raw.exercicioId !== 'string' ||
      !Object.hasOwn(raw, 'calorias')
    )
      throw new Error(`${path}: informe rotinaId, exercicioId e calorias (modelo ou null).`);
    const id = JSON.stringify([raw.rotinaId, raw.exercicioId]);
    if (seen.has(id)) throw new Error(`${path}: exercício repetido.`);
    seen.add(id);
    const routine = db.routines.find((r) => r.id === raw.rotinaId),
      exercise = routine?.exercises.find((e) => e.id === raw.exercicioId);
    if (!routine || !exercise)
      throw new Error(`${path}: exercício não encontrado. Exporte o catálogo atualizado.`);
    if (raw.calorias !== null) {
      const error = energyModelError(raw.calorias);
      if (error) throw new Error(`${path}: ${error}`);
    }
    if (key(raw.calorias) !== key(exercise.energyModel))
      plan.exercises.push({
        routineId: routine.id,
        exerciseId: exercise.id,
        name: `${routine.name} · ${exercise.name}`,
        before: key(exercise.energyModel),
        model: raw.calorias as EnergyModel | null,
      });
  }
  seen.clear();
  for (const [index, value] of ((root.substancias ?? []) as unknown[]).entries()) {
    const path = `substancias[${index}]`,
      raw = object(value, ['id', 'nome', 'modelo'], path);
    if (typeof raw.id !== 'string') throw new Error(`${path}: informe id.`);
    if (seen.has(raw.id)) throw new Error(`${path}: substância repetida.`);
    seen.add(raw.id);
    const item = db.substances?.find((s) => s.id === raw.id);
    if (!item)
      throw new Error(`${path}: substância não encontrada. Exporte o catálogo atualizado.`);
    const error = substanceModelError(raw.modelo);
    if (error) throw new Error(`${path}: ${error}`);
    const model = raw.modelo as SubstanceModel;
    if (item.doses.length && item.model.mode !== model.mode)
      throw new Error(`${path}: o modo não pode mudar com ingestões existentes.`);
    if (key(model) !== key(item.model))
      plan.substances.push({ id: item.id, name: item.name, before: key(item.model), model });
  }
  if (!plan.exercises.length && !plan.substances.length)
    throw new Error('Nenhuma fórmula ou parâmetro foi alterado.');
  return plan;
}
export function applyFormulaBulk(db: Database, plan: FormulaBulkPlan): Database {
  // Validate the entire plan against the current database before making changes.
  for (const update of plan.exercises) {
    const exercise = db.routines
      .find((r) => r.id === update.routineId)
      ?.exercises.find((e) => e.id === update.exerciseId);
    if (!exercise || key(exercise.energyModel) !== update.before)
      throw new Error(`${update.name}: os dados mudaram após a prévia. Confira o lote novamente.`);
    const error = update.model === null ? null : energyModelError(update.model);
    if (error) throw new Error(error);
  }
  for (const update of plan.substances) {
    const item = db.substances?.find((s) => s.id === update.id);
    if (
      !item ||
      key(item.model) !== update.before ||
      (item.doses.length && item.model.mode !== update.model.mode)
    )
      throw new Error(`${update.name}: os dados mudaram após a prévia. Confira o lote novamente.`);
    const error = substanceModelError(update.model);
    if (error) throw new Error(error);
  }
  const next: Database = {
    ...db,
    routines: db.routines.map((r) => {
      const updates = plan.exercises.filter((u) => u.routineId === r.id);
      if (!updates.length) return r;
      return {
        ...r,
        updatedAt: new Date().toISOString(),
        exercises: r.exercises.map((e) => {
          const update = updates.find((u) => u.exerciseId === e.id);
          return update
            ? {
                ...e,
                energyModel: update.model ? JSON.parse(JSON.stringify(update.model)) : undefined,
              }
            : e;
        }),
      };
    }),
    ...(db.substances
      ? {
          substances: db.substances.map((s) => {
            const update = plan.substances.find((u) => u.id === s.id);
            return update ? { ...s, model: JSON.parse(JSON.stringify(update.model)) } : s;
          }),
        }
      : {}),
  };
  assertStorableDatabase(JSON.stringify(next));
  return next;
}
export const formulaBulkPrompt = `Edite o catálogo JSON do Ritmo fornecido pelo usuário e devolva somente JSON com formato ritmo-formulas/1. Preserve os IDs; nomes são só rótulos. Não inclua ingestões, séries, histórico nem novos exercícios. Pode omitir itens que não precisam mudar. exercicios: [{rotinaId, exercicioId, calorias: modelo ou null}]; null remove o modelo de calorias do planejamento. Modelo de calorias usa as chaves internas {formula:{expression,steps:[],parameters:{},reference},loadBasis,loadMultiplier,secondsPerRep}. loadBasis: total, per-side (2 lados), per-hand (2 halteres) ou unilateral (1 lado por série). loadMultiplier:0.01..20; secondsPerRep:0.1..60. Saída em kcal por série concluída; variáveis bodyWeight (kg), height (cm), load (kg digitados), sides (1 ou 2), totalLoad (load*sides*loadMultiplier), reps, seconds (reps*secondsPerRep). Não invente coeficientes: informe referência e hipóteses, omita se não houver base. substancias:[{id,modelo:{formula:{expression,steps:[],parameters:{},reference},mode,absorptionHours,halfLifeHours,horizonHours}}]. mode=sum soma curvas independentes, com t (horas desde ingestão), d (quantidade), a (absorção em horas), h (meia-vida em horas). mode=state usa só a curva da última ingestão e permite p1..p4: p1 é residual anterior na ingestão, p2..p4 são os três residuais anteriores tal como registrados. Inicialização zero. Não mude mode com ingestões existentes. Não equivale a concentração sanguínea nem recomendação de dose. Defina o significado do parâmetro de absorção na referência. Não invente parâmetros farmacológicos ou validade clínica. Fórmulas: expressão explícita sem recursão; até 4 steps sequenciais v1..v4; sintaxe + - * / % ^, comparações < <= > >= == != && ||, if(condição,sim,não), exp, ln, log, sqrt, abs, sin, cos, min, max, pow, clamp, floor, ceil, round; pi e e. Ponto decimal, até 1200 caracteres/expressão, 256 tokens, 24 níveis, 16 parâmetros finitos de módulo <=1e9; nomes não colidem com variáveis, funções, constantes ou v1..v4. reference obrigatória até 500 caracteres. Alterações só valem para próximos treinos/ingestões; não reescrevem registros anteriores.`;

export const formulaBulkCorrectionPrompt = `Revise e corrija somente os modelos de cálculo do catálogo abaixo, seguindo o pedido do usuário. Confira sintaxe, variáveis, unidades, passos intermediários e coerência dos parâmetros com a referência e as hipóteses informadas. Preserve os IDs e devolva somente os itens que precisarem mudar, no formato ritmo-formulas/1. Não remova modelos, não preencha modelos ausentes nem altere parâmetros de equipamento ou substâncias sem solicitação e fundamentação. Se faltarem informações, não invente fórmulas, fontes ou coeficientes; omita o item. Se nada precisar mudar, devolva {"formato":"ritmo-formulas/1","exercicios":[],"substancias":[]}. Não inclua explicações fora do JSON; registre a referência e as hipóteses no campo reference de cada modelo corrigido.\n\nRegras do formato:\n${formulaBulkPrompt}`;
