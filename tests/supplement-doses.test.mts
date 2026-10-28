import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDatabase, parseDatabase, type Database } from '../src/model.ts';
import { createBackup, parseBackup } from '../src/backup.ts';
import { dayKey, type Supplement } from '../src/supplements.ts';
import { doseModelExample, recordDose, type Substance } from '../src/substances.ts';
import {
  previewSupplementHistory,
  saveSupplementConfiguration,
  setSupplementTakenWithDoses,
} from '../src/supplementDoses.ts';

const now = new Date(2026, 9, 27, 14, 23, 45);
const iso = (day: number, hour = 8, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();
function fixture(): Database {
  const supplement: Supplement = {
    id: 'sup',
    name: 'Suplemento',
    note: '',
    createdAt: iso(1),
    takenOn: ['2026-10-24', '2026-10-25'],
    takenAt: { '2026-10-25': iso(25, 9, 41) },
    substanceDoses: [{ substanceId: 'a', amount: '100,5', unit: 'mg' }],
  };
  const substance: Substance = {
    id: 'a',
    name: 'Substância A',
    unit: 'mg',
    model: doseModelExample(),
    doses: [],
  };
  return { ...emptyDatabase(), supplements: [supplement], substances: [substance] };
}

test('confirmação salva instante real, cria dose configurada uma vez e desfaz só a dose gerada', () => {
  const db = fixture();
  db.substances![0] = recordDose(
    db.substances![0],
    { id: 'avulsa', at: iso(27, 7), amount: 5 },
    now.getTime(),
  );
  const original = structuredClone(db);
  const taken = setSupplementTakenWithDoses(db, 'sup', true, now);
  assert.deepEqual(db, original);
  assert.equal(taken.supplements![0].takenAt?.['2026-10-27'], now.toISOString());
  const dose = taken.substances![0].doses[1];
  assert.equal(dose.at, now.toISOString());
  assert.equal(dose.amount, 100.5);
  assert.equal(dose.supplement?.estimatedTime, false);
  assert.equal(
    setSupplementTakenWithDoses(taken, 'sup', true, new Date(now.getTime() + 60000)),
    taken,
  );
  const undone = setSupplementTakenWithDoses(taken, 'sup', false, now);
  assert.deepEqual(undone.substances, db.substances);
  assert.deepEqual(undone.supplements, db.supplements);
});

test('vincular ou mudar dose não reaplica histórico nem modifica ingestões anteriores', () => {
  const db = fixture();
  const taken = setSupplementTakenWithDoses(db, 'sup', true, now);
  const edited = {
    ...taken.supplements![0],
    substanceDoses: [{ substanceId: 'a', amount: '200', unit: 'mg' }],
  };
  const saved = saveSupplementConfiguration(taken, edited);
  assert.deepEqual(saved.substances, taken.substances);
  const next = setSupplementTakenWithDoses(saved, 'sup', true, new Date(2026, 9, 28, 10));
  assert.deepEqual(
    next.substances![0].doses.map((d) => d.amount),
    [100.5, 200],
  );
  assert.equal(next.substances![0].doses[0].at, now.toISOString());
});

test('prévia usa horário real salvo ou hora média, sem inventar timestamps de confirmação', () => {
  const db = fixture();
  const original = structuredClone(db);
  assert.throws(
    () => previewSupplementHistory(db, db.supplements![0], '', '', now.getTime()),
    /hora média/,
  );
  const plan = previewSupplementHistory(db, db.supplements![0], '08:30', '', now.getTime());
  assert.deepEqual(db, original);
  assert.deepEqual(
    plan.entries.map((e) => [e.at, e.estimatedTime, e.amount]),
    [
      [iso(24, 8, 30), true, 100.5],
      [iso(25, 9, 41), false, 100.5],
    ],
  );
  const applied = saveSupplementConfiguration(db, db.supplements![0], plan, now.getTime());
  assert.deepEqual(applied.supplements![0].takenAt, db.supplements![0].takenAt);
  assert.deepEqual(applied.supplements![0].takenOn, db.supplements![0].takenOn);
  assert.deepEqual(
    applied.substances![0].doses.map((d) => d.supplement?.estimatedTime),
    [true, false],
  );
});

test('histórico evita doses já existentes no dia, reimportação e horários futuros', () => {
  const db = fixture();
  db.supplements![0].takenOn.push('2026-10-27');
  db.substances![0] = recordDose(
    db.substances![0],
    { id: 'manual', at: iso(24, 20), amount: 30 },
    now.getTime(),
  );
  const plan = previewSupplementHistory(db, db.supplements![0], '23:00', '', now.getTime());
  assert.deepEqual(
    plan.entries.map((e) => e.status),
    ['existing', 'add', 'future'],
  );
  const applied = saveSupplementConfiguration(db, db.supplements![0], plan, now.getTime());
  assert.equal(applied.substances![0].doses.length, 2);
  assert.equal(applied.substances![0].doses[0].amount, 30);
  const again = previewSupplementHistory(
    applied,
    applied.supplements![0],
    '23:00',
    '',
    now.getTime(),
  );
  assert.equal(again.entries.filter((e) => e.status === 'add').length, 0);
});

test('prévia inválida, modelo/unidade removidos ou alterações posteriores cancelam sem escrita parcial', () => {
  const db = fixture();
  const original = structuredClone(db);
  const plan = previewSupplementHistory(db, db.supplements![0], '08:00', '', now.getTime());
  const changed = structuredClone(db);
  changed.substances![0].model.halfLifeHours = 9;
  assert.throws(
    () => saveSupplementConfiguration(changed, changed.supplements![0], plan, now.getTime()),
    /mudaram/,
  );
  const changedDose = {
    ...db.supplements![0],
    substanceDoses: [{ substanceId: 'a', amount: '200', unit: 'mg' }],
  };
  assert.throws(() => saveSupplementConfiguration(db, changedDose, plan, now.getTime()), /mudaram/);
  assert.throws(
    () => setSupplementTakenWithDoses({ ...db, substances: [] }, 'sup', true, now),
    /removida/,
  );
  const changedUnit = structuredClone(db);
  changedUnit.substances![0].unit = 'g';
  assert.throws(() => setSupplementTakenWithDoses(changedUnit, 'sup', true, now), /unidade/);
  const badModel = structuredClone(db);
  badModel.substances![0].model.formula.expression = '1 / (t-t)';
  assert.throws(() =>
    previewSupplementHistory(badModel, badModel.supplements![0], '08:00', '', now.getTime()),
  );
  assert.deepEqual(db, original);
});

test('histórico acumulado recalcula residuais sem substituir o modelo dos eventos existentes', () => {
  const db = fixture();
  const substance = db.substances![0];
  substance.model = {
    ...substance.model,
    mode: 'state',
    formula: { expression: 'p1 + d', reference: 'Teste de estado', parameters: {} },
  };
  db.substances![0] = recordDose(
    substance,
    { id: 'existente', at: iso(26), amount: 5 },
    now.getTime(),
  );
  const model = structuredClone(db.substances![0].doses[0].model);
  const plan = previewSupplementHistory(db, db.supplements![0], '08:00', '', now.getTime());
  const applied = saveSupplementConfiguration(db, db.supplements![0], plan, now.getTime());
  const tail = applied.substances![0].doses.at(-1)!;
  assert.equal(tail.id, 'existente');
  assert.equal(tail.prior[0], 201);
  assert.deepEqual(tail.model, model);
});

test('limite histórico não trunca registros e pode ser resolvido com data inicial', () => {
  const db = fixture();
  db.supplements![0].takenOn = Array.from({ length: 201 }, (_, i) =>
    dayKey(new Date(2026, 0, i + 1)),
  );
  db.supplements![0].takenAt = undefined;
  assert.throws(
    () => previewSupplementHistory(db, db.supplements![0], '08:00', '', now.getTime()),
    /200 ingestões/,
  );
  const from = db.supplements![0].takenOn.at(-3)!;
  assert.equal(
    previewSupplementHistory(db, db.supplements![0], '08:00', from, now.getTime()).entries.length,
    3,
  );
});

test('backup preserva doses, origem e horários; parser recusa dados inválidos e aceita legados', () => {
  const db = setSupplementTakenWithDoses(fixture(), 'sup', true, now);
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
  for (const override of [
    { substanceDoses: [{ substanceId: 'a', amount: '1e2', unit: 'mg' }] },
    { substanceDoses: [{ substanceId: 'a', amount: '0', unit: 'mg' }] },
    { takenAt: { '2099-01-01': now.toISOString() } },
    { takenAt: { '2026-10-24': 'invalido' } },
  ]) {
    const invalid = { ...db, supplements: [{ ...db.supplements![0], ...override }] };
    assert.throws(() => parseDatabase(JSON.stringify(invalid)));
  }
  const invalidDose = structuredClone(db);
  invalidDose.substances![0].doses[0].supplement!.estimatedTime = 'sim' as any;
  assert.throws(() => parseDatabase(JSON.stringify(invalidDose)));
  const legacy = fixture();
  delete legacy.supplements![0].substanceDoses;
  delete legacy.supplements![0].takenAt;
  assert.deepEqual(parseDatabase(JSON.stringify(legacy)), legacy);
});
