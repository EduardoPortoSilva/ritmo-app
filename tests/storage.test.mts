import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { emptyDatabase } from '../src/model.ts';
import { assertStorableDatabase } from '../src/backupLimits.ts';

function harness(failBackup = false) {
  let stored: string | null = JSON.stringify({ ...emptyDatabase(), tag: 'before' });
  const writes: string[] = [];
  const storage = {
    getItem: async () => stored,
    setItem: async (_key: string, value: string) => {
      const tag = JSON.parse(value).tag as string;
      writes.push(tag);
      stored = value;
      if (failBackup && tag === 'backup') throw new Error('falha simulada');
    },
    removeItem: async () => {
      stored = null;
    },
  };
  const mocks: Record<string, unknown> = {
    '@react-native-async-storage/async-storage': { default: storage, __esModule: true },
    './model': { emptyDatabase },
    './backupLimits': { assertStorableDatabase },
    './widget': { syncWidget: () => {} },
    './widgetSnapshot': { widgetSnapshot: () => ({}) },
    './reminders': { syncReminders: () => {}, syncSupplementWidget: () => {} },
    './supplements': { reminderSnapshot: () => ({}), supplementWidgetSnapshot: () => ({}) },
  };
  const compiled = ts.transpileModule(fs.readFileSync('src/storage.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = {
    exports: {} as {
      saveDatabase: (db: unknown) => Promise<void>;
      restoreDatabase: (db: unknown) => Promise<void>;
    },
  };
  vm.runInNewContext(compiled, {
    exports: mod.exports,
    module: mod,
    console,
    require: (name: string) => {
      if (!(name in mocks)) throw new Error(name);
      return mocks[name];
    },
  });
  return { ...mod.exports, writes, read: () => JSON.parse(stored ?? 'null') };
}

test('restauracao vem depois de escrita pendente e confere o banco final', async () => {
  const app = fs.readFileSync('App.tsx', 'utf8');
  assert.match(app, /if \(state !== 'active' && ready && !restoringRef.current\)/);
  assert.match(app, /restoringRef.current = true;[\s\S]*restoreDatabase\(backup.database\)/);
  const h = harness();
  const before = { ...emptyDatabase(), tag: 'before' };
  const backup = { ...emptyDatabase(), tag: 'backup' };
  await Promise.all([h.saveDatabase(before), h.restoreDatabase(backup)]);
  assert.deepEqual(h.writes, ['before', 'backup']);
  assert.equal(h.read().tag, 'backup');
});

test('falha na restauracao repoe e confere o banco anterior', async () => {
  const h = harness(true);
  await assert.rejects(
    h.restoreDatabase({ ...emptyDatabase(), tag: 'backup' }),
    /dados anteriores foram conferidos/,
  );
  assert.deepEqual(h.writes, ['backup', 'before']);
  assert.equal(h.read().tag, 'before');
});
