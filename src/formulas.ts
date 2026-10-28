// Small arithmetic language: no JavaScript, property access, user functions or loops.
export type Formula = {
  expression: string;
  steps?: string[];
  parameters: Record<string, number>;
  reference: string;
};
type Node = { value: number } | { variable: string } | { op: string; args: Node[] };
const functions: Record<string, [number, number, (...args: number[]) => number]> = {
  exp: [1, 1, Math.exp],
  ln: [1, 1, Math.log],
  log: [1, 1, Math.log],
  sqrt: [1, 1, Math.sqrt],
  abs: [1, 1, Math.abs],
  sin: [1, 1, Math.sin],
  cos: [1, 1, Math.cos],
  floor: [1, 1, Math.floor],
  ceil: [1, 1, Math.ceil],
  round: [1, 1, Math.round],
  min: [2, 8, Math.min],
  max: [2, 8, Math.max],
  pow: [2, 2, Math.pow],
  clamp: [3, 3, (x, lo, hi) => Math.min(hi, Math.max(lo, x))],
  if: [3, 3, () => 0],
};
const precedence: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '==': 3,
  '!=': 3,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6,
  '^': 8,
};
const constants: Record<string, number> = { pi: Math.PI, e: Math.E };
const cache = new Map<string, { node: Node; variables: Set<string> }>();
export const formulaBudget = (remaining = 300_000) => ({ remaining });
export type FormulaBudget = ReturnType<typeof formulaBudget>;
const own = (object: object, key: string) => Object.hasOwn(object, key);
const finite = (value: number) => {
  if (!Number.isFinite(value) || Math.abs(value) > 1e12)
    throw new Error('A fórmula produziu um valor inválido ou grande demais.');
  return value;
};

function compile(expression: string) {
  const saved = cache.get(expression);
  if (saved) return saved;
  if (!expression.trim() || expression.length > 1200)
    throw new Error('Use uma expressão de 1 a 1.200 caracteres.');
  const tokens: string[] = [];
  const regex =
    /\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(<=|>=|==|!=|&&|\|\||[+\-*/%^<>()!,]))/y;
  let offset = 0;
  while (offset < expression.trimEnd().length) {
    regex.lastIndex = offset;
    const match = regex.exec(expression);
    if (!match) throw new Error(`Símbolo não permitido na posição ${offset + 1}.`);
    tokens.push(match[1] ?? match[2] ?? match[3]);
    offset = regex.lastIndex;
    if (tokens.length > 256) throw new Error('A fórmula ultrapassa 256 elementos.');
  }
  let cursor = 0;
  const variables = new Set<string>();
  function parse(minimum = 0, depth = 0): Node {
    if (depth > 24) throw new Error('A fórmula tem parênteses ou operações aninhadas demais.');
    const token = tokens[cursor++];
    let node: Node;
    if (token === '+' || token === '-' || token === '!') {
      node = { op: `unary${token}`, args: [parse(7, depth + 1)] };
    } else if (token === '(') {
      node = parse(0, depth + 1);
      if (tokens[cursor++] !== ')') throw new Error('Feche os parênteses da fórmula.');
    } else if (token && /^(?:\d|\.)/.test(token)) {
      node = { value: finite(Number(token)) };
    } else if (token && /^[A-Za-z_]/.test(token)) {
      if (tokens[cursor] === '(') {
        if (!own(functions, token)) throw new Error(`Função não permitida: ${token}.`);
        cursor++;
        const args: Node[] = [];
        if (tokens[cursor] !== ')') {
          do {
            args.push(parse(0, depth + 1));
            if (tokens[cursor] !== ',') break;
            cursor++;
          } while (true);
        }
        if (tokens[cursor++] !== ')') throw new Error('Confira os argumentos da função.');
        const [min, max] = functions[token];
        if (args.length < min || args.length > max)
          throw new Error(`Argumentos inválidos em ${token}.`);
        node = { op: token, args };
      } else if (own(constants, token)) node = { value: constants[token] };
      else {
        variables.add(token);
        node = { variable: token };
      }
    } else throw new Error('Falta um número, variável ou expressão.');
    while (own(precedence, tokens[cursor] ?? '') && precedence[tokens[cursor]] >= minimum) {
      const op = tokens[cursor++];
      node = { op, args: [node, parse(precedence[op] + (op === '^' ? 0 : 1), depth + 1)] };
    }
    return node;
  }
  const node = parse();
  if (cursor !== tokens.length) throw new Error('Confira a sequência de operações da fórmula.');
  const result = { node, variables };
  if (cache.size >= 64) cache.delete(cache.keys().next().value!);
  cache.set(expression, result);
  return result;
}

export function formulaError(value: unknown, allowed: readonly string[]): string | null {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Informe uma fórmula.');
    const f = value as Formula;
    if (
      Object.keys(f).some(
        (key) => !['expression', 'steps', 'parameters', 'reference'].includes(key),
      )
    )
      throw new Error('Campo desconhecido na fórmula.');
    if (typeof f.reference !== 'string' || !f.reference.trim() || f.reference.length > 500)
      throw new Error('Informe a referência e as hipóteses do modelo (até 500 caracteres).');
    if (
      !f.parameters ||
      typeof f.parameters !== 'object' ||
      Array.isArray(f.parameters) ||
      Object.keys(f.parameters).length > 16
    )
      throw new Error('Use até 16 parâmetros numéricos.');
    const names = new Set(allowed);
    for (const [key, number] of Object.entries(f.parameters)) {
      if (
        !/^[a-zA-Z][a-zA-Z0-9_]{0,23}$/.test(key) ||
        names.has(key) ||
        own(constants, key) ||
        own(functions, key) ||
        /^v\d+$/.test(key) ||
        ['__proto__', 'constructor', 'prototype'].includes(key)
      )
        throw new Error(`Nome de parâmetro inválido ou reservado: ${key}.`);
      if (typeof number !== 'number' || !Number.isFinite(number) || Math.abs(number) > 1e9)
        throw new Error(`Parâmetro inválido: ${key}.`);
      names.add(key);
    }
    if (f.steps !== undefined && (!Array.isArray(f.steps) || f.steps.length > 4))
      throw new Error('Use no máximo quatro passos intermediários.');
    for (const [index, expression] of [...(f.steps ?? []), f.expression].entries()) {
      if (typeof expression !== 'string') throw new Error('A expressão precisa ser um texto.');
      for (const name of compile(expression).variables)
        if (!names.has(name)) throw new Error(`Variável desconhecida ou recursiva: ${name}.`);
      if (index < (f.steps?.length ?? 0)) names.add(`v${index + 1}`);
    }
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

export function evaluateFormula(
  f: Formula,
  input: Record<string, number>,
  budget = formulaBudget(),
): number {
  const values: Record<string, number> = { ...f.parameters, ...input };
  function evaluate(node: Node, depth = 0): number {
    if (--budget.remaining < 0 || depth > 280)
      throw new Error('O cálculo excedeu o limite de operações. Simplifique o modelo.');
    if ('value' in node) return node.value;
    if ('variable' in node) {
      if (!own(values, node.variable)) throw new Error(`Falta informar ${node.variable}.`);
      return finite(values[node.variable]);
    }
    const read = (index: number) => evaluate(node.args[index], depth + 1);
    const a = read(0);
    if (node.op === 'if') return read(a ? 1 : 2);
    if (node.op === '&&') return a ? Number(Boolean(read(1))) : 0;
    if (node.op === '||') return a ? 1 : Number(Boolean(read(1)));
    if (node.op === 'unary-') return finite(-a);
    if (node.op === 'unary+') return a;
    if (node.op === 'unary!') return Number(!a);
    if (own(functions, node.op))
      return finite(
        functions[node.op][2](a, ...node.args.slice(1).map((n) => evaluate(n, depth + 1))),
      );
    const b = read(1);
    switch (node.op) {
      case '+':
        return finite(a + b);
      case '-':
        return finite(a - b);
      case '*':
        return finite(a * b);
      case '/':
        return finite(a / b);
      case '%':
        return finite(a % b);
      case '^':
        return finite(a ** b);
      case '<':
        return Number(a < b);
      case '<=':
        return Number(a <= b);
      case '>':
        return Number(a > b);
      case '>=':
        return Number(a >= b);
      case '==':
        return Number(a === b);
      case '!=':
        return Number(a !== b);
      default:
        throw new Error('Operação não reconhecida.');
    }
  }
  for (const [index, expression] of (f.steps ?? []).entries())
    values[`v${index + 1}`] = evaluate(compile(expression).node);
  return evaluate(compile(f.expression).node);
}
