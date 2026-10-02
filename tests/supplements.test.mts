import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDatabase, parseDatabase } from '../src/model.ts';
import {
  dayKey,
  isSupplement,
  recentSupplementDays,
  reminderSnapshot,
  setSupplementTaken,
  supplementError,
  supplementStreak,
  supplementWidgetSnapshot,
  validDay,
  validReminderTime,
  type Supplement,
} from '../src/supplements.ts';

const supplement = (takenOn: string[] = []): Supplement => ({
  id: 'creatina',
  name: 'Creatina',
  note: '',
  createdAt: '2026-09-01T12:00:00Z',
  takenOn,
});

test('registro diário é idempotente, reversível e usa a data local', () => {
  const now = new Date(2026, 8, 17, 23, 59);
  const original = supplement(['2026-09-16']);
  const marked = setSupplementTaken(original, true, now);
  assert.deepEqual(marked.takenOn, ['2026-09-16', '2026-09-17']);
  assert.deepEqual(setSupplementTaken(marked, true, now), marked);
  assert.deepEqual(setSupplementTaken(marked, false, now), original);
  assert.deepEqual(original.takenOn, ['2026-09-16']);
  assert.equal(dayKey(new Date(2026, 8, 18, 0)), '2026-09-18');
});

test('sequência conta dias consecutivos e mantém ontem enquanto hoje está aberto', () => {
  const today = new Date(2026, 8, 17, 12);
  assert.equal(supplementStreak(supplement(), today), 0);
  assert.equal(supplementStreak(supplement(['2026-09-15', '2026-09-16']), today), 2);
  assert.equal(supplementStreak(supplement(['2026-09-15', '2026-09-16', '2026-09-17']), today), 3);
  assert.equal(supplementStreak(supplement(['2026-09-15']), today), 0);
  assert.equal(supplementStreak(supplement(['2026-09-15', '2026-09-17']), today), 1);
  assert.equal(supplementStreak(supplement(['2026-09-17']), new Date(2026, 8, 19)), 0);
  assert.equal(supplementStreak(supplement(['2026-09-18']), today), 0);
});

test('sequência atravessa ano, mês e ano bissexto sem depender de horas decorridas', () => {
  assert.equal(supplementStreak(supplement(['2025-12-31', '2026-01-01']), new Date(2026, 0, 1)), 2);
  assert.equal(
    supplementStreak(supplement(['2024-02-28', '2024-02-29', '2024-03-01']), new Date(2024, 2, 1)),
    3,
  );
  assert.deepEqual(recentSupplementDays(new Date(2026, 0, 3)), [
    '2025-12-28',
    '2025-12-29',
    '2025-12-30',
    '2025-12-31',
    '2026-01-01',
    '2026-01-02',
    '2026-01-03',
  ]);
  assert.ok(validDay('2024-02-29'));
  for (const day of ['2026-02-29', '2026-13-01', '2026-04-31', '', '2026-1-01'])
    assert.ok(!validDay(day));
});

test('dados antigos seguem válidos e suplementos inválidos não são apagados silenciosamente', () => {
  const legacy = emptyDatabase();
  assert.deepEqual(parseDatabase(JSON.stringify(legacy)), legacy);
  const db = { ...legacy, supplements: [{ ...supplement(['2026-09-16']), reminderTime: '08:30' }] };
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  for (const malformed of [
    null,
    {},
    [{ ...supplement(), takenOn: ['2026-09-17', '2026-09-17'] }],
    [{ ...supplement(), reminderTime: '24:00' }],
    [supplement(), supplement()],
  ]) {
    assert.throws(() => parseDatabase(JSON.stringify({ ...legacy, supplements: malformed })));
  }
  assert.ok(!isSupplement({ ...supplement(), takenOn: ['2026-02-30'] }));
});

test('cada suplemento possui horário próprio e a projeção remove os lembretes desativados', () => {
  for (const time of ['00:00', '08:30', '23:59']) assert.ok(validReminderTime(time));
  for (const time of ['24:00', '08:60', '8:30', '08:3', '08:', ' 08:00', ''])
    assert.ok(!validReminderTime(time));
  assert.ok(supplementError({ ...supplement(), name: ' ' }));
  assert.ok(supplementError({ ...supplement(), reminderTime: '50:00' }));
  const a = { ...supplement(['2026-09-17']), reminderTime: '08:00' };
  const b = { ...supplement(), id: 'whey', name: 'Whey', reminderTime: '18:30' };
  assert.deepEqual(JSON.parse(reminderSnapshot([a, b, { ...supplement(), id: 'sem-aviso' }])), [
    { id: 'creatina', name: 'Creatina', time: '08:00', takenOn: ['2026-09-17'] },
    { id: 'whey', name: 'Whey', time: '18:30', takenOn: [] },
  ]);
  assert.deepEqual(JSON.parse(reminderSnapshot([{ ...a, reminderTime: undefined }])), []);
});

test('widget inclui suplementos sem notificação e não copia observações ou horários', () => {
  const free = supplement(['2026-09-17']);
  const withReminder = {
    ...supplement(),
    id: 'whey',
    name: 'Whey',
    note: 'observação privada',
    reminderTime: '18:00',
  };
  assert.deepEqual(JSON.parse(supplementWidgetSnapshot([free, withReminder])), [
    { id: 'creatina', name: 'Creatina', takenOn: ['2026-09-17'] },
    { id: 'whey', name: 'Whey', takenOn: [] },
  ]);
});
