import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFormula, formulaError, formulaBudget, type Formula } from '../src/formulas.ts';
const f = (expression: string, steps: string[] = []): Formula => ({
  expression,
  steps,
  parameters: {},
  reference: 'Teste matemático, sem interpretação fisiológica.',
});
test('expressões respeitam precedência, potência, funções, condições e passos finitos', () => {
  for (const [expression, expected] of [
    ['2+3*4', 14],
    ['2^3^2', 512],
    ['-2^2', -4],
    ['(-2)^2', 4],
    ['1e-2+0.5', 0.51],
    ['if(1, 7, 1/0)', 7],
    ['0 && sqrt(-1)', 0],
    ['1 || 1/0', 1],
    ['clamp(8,1,5)', 5],
    ['ln(exp(2))', 2],
  ] as const) {
    assert.equal(formulaError(f(expression), []), null);
    assert.equal(evaluateFormula(f(expression), {}), expected);
  }
  const formula = f('v4 + x', ['x^2', 'sqrt(v1)', 'v2 * 2', 'v3 + 1']);
  assert.equal(formulaError(formula, ['x']), null);
  assert.equal(evaluateFormula(formula, { x: 3 }), 10);
});
test('linguagem recusa código, referências recursivas, passos futuros e complexidade excessiva', () => {
  for (const expression of [
    'F(t-1)',
    'Math.exp(t)',
    'globalThis',
    'constructor.constructor(1)',
    'x=2',
    'x[0]',
    '(()=>1)()',
    'new Function(1)',
    '__proto__',
    'while(1)',
    'v1',
    '1;2',
    '1e999',
    'sin()',
  ])
    assert.ok(formulaError(f(expression), ['t', 'x']), expression);
  assert.ok(formulaError(f('v1', ['v1+1']), []));
  assert.ok(formulaError(f('v2', ['v2+1', '2']), []));
  assert.ok(formulaError(f('1', ['1', '2', '3', '4', '5']), []));
  assert.ok(formulaError(f('('.repeat(30) + '1' + ')'.repeat(30)), []));
  assert.ok(formulaError(f('1+'.repeat(140) + '1'), []));
  for (const name of ['x', 'v1', 'exp', 'pi', 'constructor', '__proto__']) {
    const formula = { ...f('1'), parameters: JSON.parse(`{"${name}":1}`) };
    assert.ok(formulaError(formula, ['x']));
  }
  assert.throws(() => evaluateFormula(f('1/0'), {}), /inválido/);
  assert.throws(() => evaluateFormula(f('sqrt(-1)'), {}), /inválido/);
  assert.throws(() => evaluateFormula(f('x+2'), {}), /Falta/);
  assert.throws(() => evaluateFormula(f('2+3'), {}, formulaBudget(1)), /limite/);
});
