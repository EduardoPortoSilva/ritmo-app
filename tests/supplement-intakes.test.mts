import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDatabase, parseDatabase } from '../src/model.ts';
import { createBackup, parseBackup } from '../src/backup.ts';
import { dayKey, setSupplementTaken, type Supplement } from '../src/supplements.ts';
import { doseModelExample, recordDose, type Substance } from '../src/substances.ts';
import { recordBlend, removeBlendIntake, type SubstanceBlend } from '../src/substanceBlends.ts';
import { linkedSupplements, markSupplementsForNewDoses } from '../src/supplementIntakes.ts';

const now = new Date(2026, 9, 19, 15).getTime();
const at = new Date(2026, 9, 18, 23, 59).toISOString();
const items = (): Substance[] =>
  ['a', 'b', 'c'].map((id) => ({
    id,
    name: id,
    unit: 'mg',
    model: doseModelExample(),
    doses: [],
  }));
const supplement = (id: string, extra: Partial<Supplement> = {}): Supplement => ({
  id,
  name: id,
  note: '',
  createdAt: new Date(now).toISOString(),
  takenOn: [],
  ...extra,
});
const blend: SubstanceBlend = {
  id: 'mix',
  name: 'Mistura',
  components: ['a', 'b'].map((substanceId) => ({ substanceId, amount: 10, unit: 'mg' })),
};

test('blend marca vínculos N:N de componentes e receita, uma vez no dia local da ingestão', () => {
  const previous = items();
  const supplements = [
    supplement('s1', { substanceIds: ['a', 'b'], blendIds: ['mix'] }),
    supplement('s2', { substanceIds: ['b'], takenOn: ['2026-10-17'] }),
    supplement('s3', { blendIds: ['mix'] }),
    supplement('s4', { substanceIds: ['c'] }),
  ];
  const next = recordBlend(previous, blend, { id: 'dose', at, servings: 2 }, now);
  const snapshot = structuredClone(supplements);
  const marked = markSupplementsForNewDoses(supplements, previous, next);
  assert.deepEqual(
    marked.map((s) => s.takenOn),
    [['2026-10-18'], ['2026-10-17', '2026-10-18'], ['2026-10-18'], []],
  );
  assert.deepEqual(supplements, snapshot);
  assert.deepEqual(
    linkedSupplements(supplements, ['a', 'b'], 'mix').map((s) => s.id),
    ['s1', 's2', 's3'],
  );
  assert.deepEqual(markSupplementsForNewDoses(marked, previous, next), marked);
  const twice = recordBlend(next, blend, { id: 'dose2', at, servings: 1 }, now);
  assert.deepEqual(markSupplementsForNewDoses(marked, next, twice), marked);
});

test('ingestão avulsa marca só os vínculos de substância, sem exigir todos nem criar outra dose', () => {
  const previous = items();
  const next = [...previous];
  next[0] = recordDose(previous[0], { id: 'dose', at, amount: 10 }, now);
  const marked = markSupplementsForNewDoses(
    [
      supplement('s1', { substanceIds: ['a', 'b'] }),
      supplement('s2', { substanceIds: ['a'] }),
      supplement('s3', { blendIds: ['mix'] }),
    ],
    previous,
    next,
  );
  assert.deepEqual(
    marked.map((s) => s.takenOn),
    [['2026-10-18'], ['2026-10-18'], []],
  );
  assert.equal(
    next.reduce((total, s) => total + s.doses.length, 0),
    1,
  );
  assert.equal(dayKey(new Date(at)), '2026-10-18');
});

test('editar modelos/vínculos, apagar ingestões ou reabrir não reaplica nem desfaz marcações manuais', () => {
  const initial = items();
  const ingested = recordBlend(initial, blend, { id: 'dose', at, servings: 1 }, now);
  const supplements = [
    supplement('s1', { substanceIds: ['a'] }),
    supplement('manual', { takenOn: ['2026-10-18'] }),
  ];
  const marked = markSupplementsForNewDoses(supplements, initial, ingested);
  const cleared = removeBlendIntake(ingested, 'dose');
  assert.deepEqual(markSupplementsForNewDoses(marked, ingested, cleared), marked);
  const unchecked = marked.map((s) => setSupplementTaken(s, false, new Date(at)));
  const edited = ingested.map((s) => ({ ...s, name: 'Editado' }));
  assert.deepEqual(markSupplementsForNewDoses(unchecked, ingested, edited), unchecked);
  const newLink = supplement('new', { substanceIds: ['a'] });
  assert.deepEqual(markSupplementsForNewDoses([newLink], ingested, ingested), [newLink]);
});

test('backup preserva vínculos opcionais, aceita referências removidas e rejeita vínculos malformados', () => {
  const db = {
    ...emptyDatabase(),
    supplements: [supplement('s', { substanceIds: ['removed'], blendIds: ['mix'] })],
  };
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.deepEqual(parseBackup(createBackup(db)).database, db);
  assert.deepEqual(
    parseDatabase(JSON.stringify({ ...emptyDatabase(), supplements: [supplement('old')] }))
      .supplements,
    [supplement('old')],
  );
  for (const invalid of [
    null,
    'a',
    ['a', 'a'],
    [''],
    [3],
    ['x'.repeat(161)],
    Array.from({ length: 31 }, (_, i) => String(i)),
  ]) {
    assert.throws(() =>
      parseDatabase(
        JSON.stringify({ ...db, supplements: [supplement('s', { substanceIds: invalid as any })] }),
      ),
    );
  }
});
