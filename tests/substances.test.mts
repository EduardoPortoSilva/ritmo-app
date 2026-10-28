import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDatabase, parseDatabase } from '../src/model.ts';
import { createBackup, parseBackup } from '../src/backup.ts';
import {
  doseModelExample,
  recordDose,
  removeDose,
  substanceAmount,
  substanceCurve,
  validSubstance,
  type Substance,
} from '../src/substances.ts';
const time = Date.parse('2026-10-19T10:00:00Z');
const at = (hours: number) => new Date(time + hours * 3600000).toISOString();
const initial = (): Substance => ({
  id: 's',
  name: 'Modelo matemático',
  unit: 'mg',
  model: {
    ...doseModelExample(),
    formula: { expression: 'd * 0.5^(t/h)', parameters: {}, reference: 'Teste exponencial' },
    halfLifeHours: 2,
  },
  doses: [],
});
const dose = (s: Substance, id: string, hour: number, amount = 100) =>
  recordDose(s, { id, at: at(hour), amount }, time + 10 * 3600000);
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
test('doses independentes somam remanescentes, preservam horários, snapshots e backup', () => {
  const original = initial();
  let s = dose(original, 'a', 0);
  assert.equal(original.doses.length, 0);
  close(substanceAmount(s, time - 1), 0);
  close(substanceAmount(s, time + 2 * 3600000), 50);
  s = dose(s, 'b', 2);
  close(substanceAmount(s, time + 2 * 3600000), 150);
  close(substanceAmount(s, time + 4 * 3600000), 75);
  s.model.formula.expression = 'd*0.25^(t/h)';
  close(substanceAmount(s, time + 4 * 3600000), 75);
  assert.equal(s.doses[0].model.formula.expression, 'd * 0.5^(t/h)');
  s = dose(s, 'c', 4);
  close(substanceAmount(s, time + 6 * 3600000), 62.5);
  assert.ok(validSubstance(s));
  const db = { ...emptyDatabase(), substances: [s] };
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
  assert.equal(substanceCurve(s, time).length, 33);
});
test('modelo acumulado usa até quatro residuais armazenados e permite resposta não linear', () => {
  let s = initial();
  s.model.mode = 'state';
  s.model.formula.expression = '(p1 + d/(1+d/100)) * 0.5^(t/h)';
  s = dose(s, 'a', 0);
  s = dose(s, 'b', 2);
  s = dose(s, 'c', 4);
  assert.deepEqual(
    s.doses.map((d) => d.prior),
    [
      [0, 0, 0, 0],
      [25, 0, 0, 0],
      [37.5, 25, 0, 0],
    ],
  );
  close(substanceAmount(s, time + 4 * 3600000), 87.5);
  const saved = structuredClone(s);
  const removed = removeDose(s, 'b');
  close(substanceAmount(removed, time + 4 * 3600000), 62.5);
  assert.deepEqual(s, saved);
  const retro = dose(removed, 'retro', 1);
  assert.deepEqual(
    retro.doses.map((d) => d.id),
    ['a', 'retro', 'c'],
  );
  assert.ok(validSubstance(retro));
  const tampered = structuredClone(retro);
  tampered.doses[2].prior[0]++;
  assert.equal(validSubstance(tampered), false);
  assert.throws(() =>
    parseDatabase(JSON.stringify({ ...emptyDatabase(), substances: [tampered] })),
  );
});
test('dados antigos continuam válidos e entradas perigosas ou inconsistentes não são aceitas', () => {
  assert.deepEqual(parseDatabase(JSON.stringify(emptyDatabase())), emptyDatabase());
  const s = initial();
  for (const amount of [0, -1, Infinity, NaN, 1e10]) assert.throws(() => dose(s, 'bad', 0, amount));
  assert.throws(() => recordDose(s, { id: 'future', at: at(1), amount: 10 }, time));
  assert.throws(() => recordDose(s, { id: 'invalid', at: 'x', amount: 10 }, time));
  const registered = dose(s, 'a', 0);
  assert.throws(() => dose(registered, 'a', 1), /repetido/);
  for (const mutate of [
    (s: Substance) => (s.model.mode = 'state'),
    (s: Substance) => (s.doses[0].amount = -1),
    (s: Substance) => (s.doses[0].model.formula.expression = 'F(t)'),
    (s: Substance) => (s.model.halfLifeHours = 0),
  ]) {
    const copy = structuredClone(registered);
    mutate(copy);
    assert.equal(validSubstance(copy), false);
  }
  const invalid = initial();
  invalid.model.formula.expression = '1/0';
  assert.throws(() => dose(invalid, 'a', 0));
});

test('ingestões no mesmo horário mantêm ordem de registro em modelos não comutativos', () => {
  let s = initial();
  s.model.mode = 'state';
  s.model.formula.expression = 'p1^2+d';
  s = dose(s, 'z', 0, 2);
  s = dose(s, 'a', 0, 3);
  assert.deepEqual(
    s.doses.map((d) => d.id),
    ['z', 'a'],
  );
  assert.equal(substanceAmount(s, time), 7);
  assert.ok(validSubstance(s));
});

test('histórico e fórmulas pesadas têm limite de registros e orçamento compartilhado na curva', () => {
  const s = initial();
  s.model.formula.expression = Array(80).fill('d').join('+');
  s.doses = Array.from({ length: 200 }, (_, i) => ({
    id: String(i),
    at: at(0),
    amount: 1,
    model: structuredClone(s.model),
    prior: [],
  }));
  assert.ok(validSubstance(s));
  assert.throws(() => substanceCurve(s, time), /limite de operações/);
  assert.throws(() => dose(s, 'extra', 1), /200 ingestões/);
});
