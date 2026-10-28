import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDatabase, parseDatabase } from '../src/model.ts';
import { createBackup, parseBackup } from '../src/backup.ts';
import {
  doseModelExample,
  recordDose,
  substanceAmount,
  type Substance,
} from '../src/substances.ts';
import {
  recordBlend,
  removeBlendIntake,
  blendError,
  validBlend,
  type SubstanceBlend,
} from '../src/substanceBlends.ts';
const now = Date.parse('2026-10-19T15:00:00Z');
const at = (hours: number) => new Date(now + hours * 3600000).toISOString();
const fixture = () => {
  const items: Substance[] = ['a', 'b', 'c'].map((id) => ({
    id,
    name: `Modelo ${id}`,
    unit: id === 'b' ? 'g' : 'mg',
    model: {
      ...doseModelExample(),
      halfLifeHours: id === 'b' ? 4 : 2,
      formula: {
        expression: 'd*0.5^(t/h)',
        parameters: {},
        reference: 'Modelo matemático de teste',
      },
    },
    doses: [],
  }));
  const blend: SubstanceBlend = {
    id: 'blend',
    name: 'Mistura',
    components: [
      { substanceId: 'a', unit: 'mg', amount: 100 },
      { substanceId: 'b', unit: 'g', amount: 0.05 },
    ],
  };
  return { items, blend };
};
test('blend multiplica porções e registra componentes no mesmo instante, com modelos e unidades independentes', () => {
  const { items, blend } = fixture();
  const original = structuredClone(items);
  const next = recordBlend(items, blend, { id: 'intake', at: at(-2), servings: 2 }, now);
  assert.deepEqual(items, original);
  assert.deepEqual(next[2], items[2]);
  assert.equal(next[0].doses[0].amount, 200);
  assert.equal(next[1].doses[0].amount, 0.1);
  assert.equal(next[0].doses[0].at, next[1].doses[0].at);
  assert.equal(next[0].doses[0].blend?.intakeId, 'intake');
  assert.equal(substanceAmount(next[0], now), 100);
  assert.ok(Math.abs(substanceAmount(next[1], now) - 0.1 / Math.sqrt(2)) < 1e-10);
  blend.components[0].amount = 500;
  blend.name = 'Alterado';
  assert.equal(next[0].doses[0].blend?.name, 'Mistura');
  assert.equal(next[0].doses[0].blend?.components[0].amount, 200);
  const db = { ...emptyDatabase(), substances: next, substanceBlends: [blend] };
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
});
test('falha no segundo componente não grava o primeiro e não aceita reaplicar a mesma ingestão', () => {
  const { items, blend } = fixture();
  items[1].model.formula.expression = '1/0';
  const original = structuredClone(items);
  assert.throws(() => recordBlend(items, blend, { id: 'bad', at: at(0), servings: 1 }, now));
  assert.deepEqual(items, original);
  assert.equal(items[0].doses.length, 0);
  items[1].model.formula.expression = 'd';
  const next = recordBlend(items, blend, { id: 'one', at: at(0), servings: 0.5 }, now);
  assert.throws(
    () => recordBlend(next, blend, { id: 'one', at: at(0), servings: 1 }, now),
    /já foi/,
  );
  for (const servings of [0, -1, NaN, Infinity, 1001])
    assert.throws(() => recordBlend(items, blend, { id: 'bad', at: at(0), servings }, now));
  assert.throws(
    () => recordBlend(items, blend, { id: 'future', at: at(1), servings: 1 }, now),
    /já ocorreu/,
  );
});
test('composição inválida, unidade alterada e substância removida impedem registro sem invalidar o banco antigo', () => {
  const { items, blend } = fixture();
  for (const components of [
    [],
    [blend.components[0]],
    [blend.components[0], blend.components[0]],
    [{ ...blend.components[0], amount: 0 }, blend.components[1]],
  ])
    assert.equal(validBlend({ ...blend, components }), false);
  const changed = structuredClone(items);
  changed[1].unit = 'mg';
  assert.match(blendError(blend, changed)!, /unidade mudou/);
  assert.match(blendError(blend, items.slice(0, 1))!, /removida/);
  const db = { ...emptyDatabase(), substances: items.slice(0, 1), substanceBlends: [blend] };
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  const invalid = structuredClone(db);
  invalid.substanceBlends[0].components[0].amount = -1;
  assert.throws(() => parseDatabase(JSON.stringify(invalid)));
});
test('excluir ingestão de blend desfaz todos os componentes e recalcula estados seguintes, preservando doses avulsas', () => {
  const { items, blend } = fixture();
  for (const item of items) {
    item.model.mode = 'state';
    item.model.formula.expression = '(p1+d)*0.5^(t/h)';
  }
  let next = recordBlend(items, blend, { id: 'group', at: at(-2), servings: 1 }, now);
  next = next.map((item) =>
    recordDose(item, { id: `avulsa-${item.id}`, at: at(0), amount: 10 }, now),
  );
  const original = structuredClone(next);
  const undone = removeBlendIntake(next, 'group');
  assert.deepEqual(next, original);
  assert.equal(undone[0].doses.length, 1);
  assert.equal(undone[1].doses.length, 1);
  assert.equal(undone[0].doses[0].prior[0], 0);
  assert.equal(substanceAmount(undone[0], now), 10);
  assert.deepEqual(undone[2], next[2]);
  const malformed = structuredClone(original);
  malformed[0].doses[0].blend!.components[0].amount++;
  assert.throws(() => parseDatabase(JSON.stringify({ ...emptyDatabase(), substances: malformed })));
  const afterRecipeDeletion = { ...emptyDatabase(), substances: next, substanceBlends: [] };
  assert.deepEqual(parseDatabase(JSON.stringify(afterRecipeDeletion)), afterRecipeDeletion);
});
