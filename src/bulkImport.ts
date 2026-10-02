import {
  cleanCardioRoutine,
  cardioRoutineError,
  newCardioRoutine,
  type CardioRoutine,
} from './cardio.ts';
import {
  cleanRoutine,
  newRoutine,
  routineError,
  uid,
  type Database,
  type Routine,
} from './model.ts';
import { muscleById, muscleCatalog, validMuscleLinks, type MuscleLink } from './muscles.ts';

export type BulkPlan = {
  divisions: { id: string; name: string; routines: Routine[] }[];
  routines: Routine[];
  cardios: CardioRoutine[];
};

const dayNumbers: Record<string, number> = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6,
};
const object = (value: unknown, path: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${path}: deve ser um objeto.`);
  return value as Record<string, unknown>;
};
const fields = (value: Record<string, unknown>, allowed: string[], path: string) => {
  const extra = Object.keys(value).find((key) => !allowed.includes(key));
  if (extra) throw new Error(`${path}.${extra}: campo desconhecido.`);
};
const list = (value: unknown, path: string): unknown[] => {
  if (!Array.isArray(value)) throw new Error(`${path}: deve ser uma lista.`);
  return value;
};
const name = (value: unknown, path: string, limit = 80): string => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > limit)
    throw new Error(`${path}: informe um texto de 1 a ${limit} caracteres.`);
  return value.trim();
};
const integer = (value: unknown, path: string, min: number, max: number): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new Error(`${path}: use um número inteiro de ${min} a ${max}.`);
  return value;
};
const weekdays = (value: unknown, path: string): number[] => {
  if (value === undefined) return [];
  const days = list(value, path).map((day, index) => {
    if (typeof day !== 'string' || dayNumbers[day] === undefined)
      throw new Error(`${path}[${index}]: use seg, ter, qua, qui, sex, sab ou dom.`);
    return dayNumbers[day];
  });
  if (new Set(days).size !== days.length) throw new Error(`${path}: não repita dias.`);
  return days;
};

function exercise(value: unknown, path: string) {
  const data = object(value, path);
  fields(data, ['nome', 'repeticoes', 'descanso', 'musculos'], path);
  const reps = list(data.repeticoes, `${path}.repeticoes`);
  if (reps.length < 1 || reps.length > 20)
    throw new Error(`${path}.repeticoes: inclua de 1 a 20 séries.`);
  const rests =
    data.descanso === undefined
      ? undefined
      : Array.isArray(data.descanso)
        ? data.descanso.map((rest, index) =>
            String(integer(rest, `${path}.descanso[${index}]`, 0, 3600)),
          )
        : reps.map(() => String(integer(data.descanso, `${path}.descanso`, 0, 3600)));
  if (rests && rests.length !== reps.length)
    throw new Error(`${path}.descanso: informe um valor por série.`);
  const muscles: MuscleLink[] | undefined =
    data.musculos === undefined
      ? undefined
      : list(data.musculos, `${path}.musculos`).map((item, index) => {
          const location = `${path}.musculos[${index}]`;
          const link = object(item, location);
          fields(link, ['id', 'papel'], location);
          if (typeof link.id !== 'string' || !muscleById.has(link.id))
            throw new Error(`${location}.id: use um ID do catálogo muscular.`);
          if (link.papel !== 'principal' && link.papel !== 'secundario')
            throw new Error(`${location}.papel: use principal ou secundario.`);
          return { nodeId: link.id, role: link.papel === 'principal' ? 'primary' : 'secondary' };
        });
  if (muscles && !validMuscleLinks(muscles))
    throw new Error(`${path}.musculos: não repita o mesmo músculo.`);
  return {
    id: uid(),
    name: name(data.nome, `${path}.nome`),
    reps: reps.map((rep, index) => String(integer(rep, `${path}.repeticoes[${index}]`, 1, 999))),
    ...(rests ? { rests } : {}),
    ...(muscles ? { muscles } : {}),
  };
}

function routine(value: unknown, path: string, division?: { id: string; name: string }): Routine {
  const data = object(value, path);
  fields(data, ['nome', 'dias', 'nota', 'exercicios'], path);
  const exercises = list(data.exercicios, `${path}.exercicios`);
  if (exercises.length < 1 || exercises.length > 50)
    throw new Error(`${path}.exercicios: inclua de 1 a 50 exercícios.`);
  if (data.nota !== undefined && (typeof data.nota !== 'string' || data.nota.length > 300))
    throw new Error(`${path}.nota: use até 300 caracteres.`);
  const result: Routine = {
    ...newRoutine(),
    name: name(data.nome, `${path}.nome`),
    note: (data.nota as string | undefined)?.trim() ?? '',
    weekdays: weekdays(data.dias, `${path}.dias`),
    exercises: exercises.map((item, index) => exercise(item, `${path}.exercicios[${index}]`)),
    ...(division ? { division } : {}),
  };
  const error = routineError(result);
  if (error) throw new Error(`${path}: ${error}`);
  return cleanRoutine(result);
}

function cardio(value: unknown, path: string): CardioRoutine {
  const data = object(value, path);
  fields(data, ['nome', 'dias', 'etapas'], path);
  const steps = list(data.etapas, `${path}.etapas`).map((item, index) => {
    const location = `${path}.etapas[${index}]`;
    const step = object(item, location);
    fields(step, ['minutos', 'velocidade'], location);
    if (
      typeof step.minutos !== 'number' ||
      !Number.isFinite(step.minutos) ||
      step.minutos < 0.1 ||
      step.minutos > 60
    )
      throw new Error(`${location}.minutos: use número de 0,1 a 60.`);
    if (
      typeof step.velocidade !== 'number' ||
      !Number.isFinite(step.velocidade) ||
      step.velocidade < 0 ||
      step.velocidade > 40
    )
      throw new Error(`${location}.velocidade: use km/h de 0 a 40.`);
    return { id: uid(), minutes: String(step.minutos), speed: String(step.velocidade) };
  });
  const result: CardioRoutine = {
    ...newCardioRoutine(),
    name: name(data.nome, `${path}.nome`),
    weekdays: weekdays(data.dias, `${path}.dias`),
    steps,
  };
  const error = cardioRoutineError(result);
  if (error) throw new Error(`${path}: ${error}`);
  return cleanCardioRoutine(result);
}

export const MAX_BULK_IMPORT_CHARS = 100_000;

export function parseBulkImport(text: string): BulkPlan {
  if (text.length > MAX_BULK_IMPORT_CHARS)
    throw new Error('O texto pode ter no máximo 100.000 caracteres.');
  const content = text.trim().replace(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i, '$1');
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('JSON inválido. Confira vírgulas, aspas duplas e chaves.');
  }
  const data = object(parsed, 'raiz');
  fields(data, ['formato', 'divisoes', 'treinos', 'cardios'], 'raiz');
  if (data.formato !== 'ritmo/1') throw new Error('raiz.formato: use "ritmo/1".');
  const divisions = (data.divisoes === undefined ? [] : list(data.divisoes, 'divisoes')).map(
    (item, index) => {
      const path = `divisoes[${index}]`;
      const division = object(item, path);
      fields(division, ['nome', 'treinos'], path);
      const members = list(division.treinos, `${path}.treinos`);
      if (!members.length) throw new Error(`${path}.treinos: inclua pelo menos um treino.`);
      const group = { id: uid(), name: name(division.nome, `${path}.nome`) };
      return {
        ...group,
        routines: members.map((member, position) =>
          routine(member, `${path}.treinos[${position}]`, group),
        ),
      };
    },
  );
  const routines = (data.treinos === undefined ? [] : list(data.treinos, 'treinos')).map(
    (item, index) => routine(item, `treinos[${index}]`),
  );
  const cardios = (data.cardios === undefined ? [] : list(data.cardios, 'cardios')).map(
    (item, index) => cardio(item, `cardios[${index}]`),
  );
  const total =
    routines.length +
    divisions.reduce((sum, group) => sum + group.routines.length, 0) +
    cardios.length;
  if (!total) throw new Error('Inclua ao menos um treino ou cardio.');
  if (divisions.length > 20 || total > 50)
    throw new Error('Limite de 20 divisões e 50 rotinas por importação.');
  return { divisions, routines, cardios };
}

const comparable = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
export function applyBulkImport(db: Database, plan: BulkPlan): Database {
  const existingDivisions = new Set(
    db.routines.flatMap((item) => (item.division ? [comparable(item.division.name)] : [])),
  );
  const divisionNames = new Set(existingDivisions);
  for (const group of plan.divisions) {
    const key = comparable(group.name);
    if (divisionNames.has(key))
      throw new Error(`A divisão “${group.name}” já existe ou está repetida no texto.`);
    divisionNames.add(key);
  }
  const names = new Set(
    db.routines.map((item) => `${comparable(item.division?.name ?? '')}/${comparable(item.name)}`),
  );
  const importedRoutines = [...plan.routines, ...plan.divisions.flatMap((group) => group.routines)];
  for (const item of importedRoutines) {
    const key = `${comparable(item.division?.name ?? '')}/${comparable(item.name)}`;
    if (names.has(key))
      throw new Error(`O treino “${item.name}” já existe neste local ou está repetido no texto.`);
    names.add(key);
    const error = routineError(item);
    if (error) throw new Error(error);
  }
  const cardioNames = new Set((db.cardioRoutines ?? []).map((item) => comparable(item.name)));
  for (const item of plan.cardios) {
    const key = comparable(item.name);
    if (cardioNames.has(key))
      throw new Error(`O cardio “${item.name}” já existe ou está repetido no texto.`);
    cardioNames.add(key);
    const error = cardioRoutineError(item);
    if (error) throw new Error(error);
  }
  return {
    ...db,
    routines: [...db.routines, ...importedRoutines],
    cardioRoutines: [...(db.cardioRoutines ?? []), ...plan.cardios],
  };
}

export const bulkImportExample = JSON.stringify(
  {
    formato: 'ritmo/1',
    divisoes: [
      {
        nome: 'ABC',
        treinos: [
          {
            nome: 'A - Peito',
            dias: ['seg', 'qui'],
            exercicios: [
              {
                nome: 'Supino reto',
                repeticoes: [12, 10, 8],
                descanso: 90,
                musculos: [{ id: 'chest', papel: 'principal' }],
              },
            ],
          },
        ],
      },
    ],
    cardios: [
      {
        nome: 'HIIT curto',
        dias: ['ter'],
        etapas: [
          { minutos: 1, velocidade: 5 },
          { minutos: 1, velocidade: 8 },
        ],
      },
    ],
  },
  null,
  2,
);

export const bulkImportPrompt = `Gere exclusivamente um JSON válido para importar rotinas no app Ritmo. Não escreva explicações nem comentários. Use o formato exato abaixo, com "formato": "ritmo/1". Você pode omitir divisoes, treinos ou cardios quando vazios, mas inclua pelo menos uma rotina. Todos os nomes devem ter até 80 caracteres. Não invente chaves nem IDs musculares.

Estrutura: divisoes é uma lista de {"nome": texto, "treinos": [treino...]}; treinos é uma lista de treinos avulsos; cardios é uma lista de cardios. Treino: {"nome": texto, "dias": ["seg","ter","qua","qui","sex","sab","dom"], "nota": texto opcional, "exercicios": [exercicio...]}. Dias são opcionais; ausência ou [] significa sem dia fixo. Exercício: {"nome": texto, "repeticoes": [inteiros de 1 a 999], "descanso": inteiro de 0 a 3600 segundos para todas as séries OU lista de um valor por série, "musculos": [{"id": ID do catálogo, "papel": "principal" ou "secundario"}]}. Descanso e músculos são opcionais. Cada exercício tem 1 a 20 séries. Cardio: {"nome": texto, "dias": lista opcional, "etapas": [{"minutos": número de 0.1 a 60, "velocidade": número de 0 a 40 em km/h}]}. Máximo 50 etapas e 4 horas por cardio. Use números JSON, não números entre aspas. Use nomes de campos sem acentos exatamente como no exemplo. Não inclua cargas/pesos, pois são registrados durante a execução. Se não souber o músculo específico, use o ID do grupo; se não souber o grupo, omita musculos. IDs musculares válidos (ID: nome):
${muscleCatalog.map((node) => `${node.id}: ${node.name}`).join('\n')}

Exemplo completo:
${bulkImportExample}`;
