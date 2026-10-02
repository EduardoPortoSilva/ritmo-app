import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  applyBulkImport,
  bulkImportExample,
  bulkImportPrompt,
  parseBulkImport,
} from '../src/bulkImport.ts';
import { emptyDatabase, parseDatabase } from '../src/model.ts';
import { muscleCatalog } from '../src/muscles.ts';

test('importa divisão, cardio, dias, descansos e músculos mantendo IDs próprios', () => {
  const plan = parseBulkImport(bulkImportExample);
  assert.equal(plan.divisions[0].name, 'ABC');
  assert.deepEqual(plan.divisions[0].routines[0].weekdays, [1, 4]);
  assert.deepEqual(plan.divisions[0].routines[0].exercises[0].reps, ['12', '10', '8']);
  assert.deepEqual(plan.divisions[0].routines[0].exercises[0].rests, ['90', '90', '90']);
  assert.deepEqual(plan.divisions[0].routines[0].exercises[0].muscles, [
    { nodeId: 'chest', role: 'primary' },
  ]);
  assert.equal(plan.divisions[0].routines[0].division?.id, plan.divisions[0].id);
  assert.deepEqual(plan.cardios[0].weekdays, [2]);
  const original = emptyDatabase();
  const db = applyBulkImport(original, plan);
  assert.equal(original.routines.length, 0);
  assert.equal(db.routines.length, 1);
  assert.equal(db.cardioRoutines?.length, 1);
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  assert.match(bulkImportPrompt, /vastus-lateralis: Vasto lateral/);
});

test('importação é aditiva, preserva sessões e recusa duplicatas em segunda aplicação', () => {
  const plan = parseBulkImport(
    JSON.stringify({
      formato: 'ritmo/1',
      treinos: [
        {
          nome: 'Costas',
          exercicios: [
            {
              nome: 'Remada',
              repeticoes: [12, 10],
              descanso: [60, 90],
              musculos: [{ id: 'latissimus', papel: 'principal' }],
            },
          ],
        },
      ],
    }),
  );
  const original = { ...emptyDatabase(), workouts: [], activeCardio: null };
  const db = applyBulkImport(original, plan);
  assert.equal(db.activeCardio, null);
  assert.deepEqual(db.workouts, []);
  assert.deepEqual(db.routines[0].exercises[0].rests, ['60', '90']);
  assert.throws(() => applyBulkImport(db, plan), /já existe/);
  assert.equal(db.routines.length, 1);
});

test('erro pontual invalida o lote inteiro, inclusive campos inventados e IDs desconhecidos', () => {
  const base = {
    formato: 'ritmo/1',
    treinos: [
      { nome: 'A', exercicios: [{ nome: 'Supino', repeticoes: [12] }] },
      {
        nome: 'B',
        exercicios: [
          {
            nome: 'Agachamento',
            repeticoes: [10],
            musculos: [{ id: 'unknown', papel: 'principal' }],
          },
        ],
      },
    ],
  };
  assert.throws(
    () => parseBulkImport(JSON.stringify(base)),
    /treinos\[1\]\.exercicios\[0\]\.musculos\[0\]\.id/,
  );
  assert.throws(
    () =>
      parseBulkImport(JSON.stringify({ ...base, treinos: [{ ...base.treinos[0], series: 3 }] })),
    /series: campo desconhecido/,
  );
  assert.throws(
    () =>
      parseBulkImport(
        JSON.stringify({ ...base, treinos: [{ ...base.treinos[0], dias: ['seg', 'seg'] }] }),
      ),
    /não repita dias/,
  );
  assert.throws(
    () =>
      parseBulkImport(
        JSON.stringify({
          ...base,
          treinos: [
            {
              ...base.treinos[0],
              exercicios: [{ nome: 'Supino', repeticoes: [12, 10], descanso: [60] }],
            },
          ],
        }),
      ),
    /um valor por série/,
  );
  assert.throws(() => parseBulkImport('{"formato":"ritmo/1",'), /JSON inválido/);
  assert.equal(parseBulkImport(`\`\`\`json\n${bulkImportExample}\n\`\`\``).cardios.length, 1);
});

test('documentação para LLM lista todos os IDs musculares da versão atual', () => {
  const docs = readFileSync(new URL('../docs/IMPORTACAO.md', import.meta.url), 'utf8');
  const documented = [...docs.matchAll(/^([a-z-]+) — /gm)].map((match) => match[1]);
  assert.deepEqual(
    documented,
    muscleCatalog.map((node) => node.id),
  );
});
