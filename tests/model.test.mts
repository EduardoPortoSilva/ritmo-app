import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDatabase,
  exerciseLoadHistory,
  finishWorkout,
  newRoutine,
  numberValue,
  parseDatabase,
  previousBodyWeight,
  bodyWeightHistory,
  routineError,
  routinesForDate,
  routineDays,
  startWorkout,
  validReps,
  validWeight,
  validBodyWeight,
  volume,
  workoutError,
} from '../src/model.ts';

function routine() {
  const result = newRoutine();
  result.name = 'Treino A';
  result.exercises[0].name = 'Supino';
  result.exercises[0].reps = ['12', '10', '8'];
  return result;
}

test('programação semanal aceita múltiplos dias e preserva rotinas antigas sem programação', () => {
  const a = { ...routine(), weekdays: [1, 5] };
  const b = { ...routine(), weekdays: [3] };
  const c = { ...routine(), weekdays: [0, 5] };
  const legacy = routine();
  delete legacy.weekdays;
  const db = { ...emptyDatabase(), routines: [a, b, c, legacy] };
  assert.deepEqual(routinesForDate(db.routines, new Date(2026, 8, 14, 12)), [a]);
  assert.deepEqual(routinesForDate(db.routines, new Date(2026, 8, 16, 12)), [b]);
  assert.deepEqual(routinesForDate(db.routines, new Date(2026, 8, 18, 12)), [a, c]);
  assert.deepEqual(routinesForDate(db.routines, new Date(2026, 8, 20, 12)), [c]);
  assert.deepEqual(routinesForDate(db.routines, new Date(2026, 8, 19, 12)), []);
  assert.equal(routineDays(c), 'Sex · Dom');
  assert.equal(routineDays(legacy), 'Sem dia definido');
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  for (const invalid of [[7], [-1], [1.5], [1, 1], ['1'], null]) {
    const malformed = { ...db, routines: [{ ...a, weekdays: invalid }] };
    assert.throws(() => parseDatabase(JSON.stringify(malformed)));
  }
  assert.ok(routineError({ ...a, weekdays: [7] }));
});

test('peso corporal opcional aceita decimais, preserva dados antigos e valida a leitura', () => {
  for (const value of ['75,5', '80.2', '1', '999']) assert.ok(validBodyWeight(value));
  for (const value of ['', '0', '-1', '1000', 'abc', '1,2,3']) assert.ok(!validBodyWeight(value));
  const db = emptyDatabase();
  db.active = startWorkout(routine());
  Object.assign(db.active.exercises[0].sets[0], { weight: '20', done: true });
  const saved = finishWorkout(db, ' 75,5 ');
  assert.equal(saved.workouts[0].bodyWeight, '75,5');
  assert.equal(db.active.bodyWeight, undefined);
  assert.equal(parseDatabase(JSON.stringify(saved)).workouts[0].bodyWeight, '75,5');
  assert.equal(parseDatabase(JSON.stringify(finishWorkout(db))).workouts[0].bodyWeight, undefined);
  assert.equal(finishWorkout(db, ' ').workouts[0].bodyWeight, undefined);
  assert.throws(() => finishWorkout(db, '0'));
  const invalid = structuredClone(saved);
  invalid.workouts[0].bodyWeight = '-10';
  assert.throws(() => parseDatabase(JSON.stringify(invalid)));
});

test('último peso corporal atravessa rotinas e ignora sessões sem peso ou não finalizadas', () => {
  const db = emptyDatabase();
  db.active = startWorkout(routine());
  Object.assign(db.active.exercises[0].sets[0], { weight: '0', done: true });
  const old = finishWorkout(db, '80').workouts[0];
  old.finishedAt = '2026-09-01T15:00:00Z';
  const recent = {
    ...old,
    routineId: 'outra-rotina',
    finishedAt: '2026-09-10T15:00:00Z',
    bodyWeight: '79,5',
  };
  const skipped = { ...old, finishedAt: '2026-09-11T15:00:00Z', bodyWeight: undefined };
  const unfinished = { ...old, finishedAt: undefined, bodyWeight: '99' };
  assert.equal(previousBodyWeight([skipped, old, unfinished, recent]), '79,5');
  assert.equal(previousBodyWeight([skipped]), '');
});

test('histórico de peso reúne rotinas, ordena datas e ignora registros sem peso', () => {
  const base = startWorkout(routine());
  const old = { ...base, id: 'old', finishedAt: '2024-01-01T15:00:00Z', bodyWeight: '80' };
  const recent = {
    ...base,
    id: 'recent',
    routineId: 'outra',
    finishedAt: '2026-09-17T15:00:00Z',
    bodyWeight: '79,5',
  };
  const sameDate = { ...recent, id: 'same-date', bodyWeight: '79.2' };
  const input = [
    recent,
    { ...recent, bodyWeight: undefined },
    old,
    sameDate,
    { ...recent, bodyWeight: '0' },
    { ...base, bodyWeight: '90' },
  ];
  const snapshot = JSON.stringify(input);
  assert.deepEqual(bodyWeightHistory(input), [
    { workoutId: 'old', date: old.finishedAt, weight: 80 },
    { workoutId: 'recent', date: recent.finishedAt, weight: 79.5 },
    { workoutId: 'same-date', date: recent.finishedAt, weight: 79.2 },
  ]);
  assert.equal(JSON.stringify(input), snapshot);
  assert.deepEqual(bodyWeightHistory([]), []);
});

test('histórico de carga usa somente séries concluídas do exercício e ordena sessões sem agrupar datas', () => {
  const r = routine();
  const old = startWorkout(r);
  old.finishedAt = '2024-01-01T15:00:00Z';
  Object.assign(old.exercises[0].sets[0], { weight: '0', done: true });
  const recent = startWorkout(r);
  recent.finishedAt = '2025-09-10T15:00:00Z';
  Object.assign(recent.exercises[0].sets[0], { weight: '12,5', done: true });
  Object.assign(recent.exercises[0].sets[1], { weight: '99', done: false });
  Object.assign(recent.exercises[0].sets[2], { weight: '-1', done: true });
  const sameDay = structuredClone(recent);
  sameDay.id = 'outra-sessao-no-mesmo-dia';
  const other = structuredClone(recent);
  other.routineId = 'outra-rotina';
  const unfinished = startWorkout(r);
  Object.assign(unfinished.exercises[0].sets[0], { weight: '80', done: true });
  const history = [recent, other, unfinished, old, sameDay];
  const snapshot = JSON.stringify(history);
  assert.deepEqual(exerciseLoadHistory(history, r.id, r.exercises[0].id), [
    { workoutId: old.id, date: old.finishedAt, weight: 0, reps: 12 },
    { workoutId: recent.id, date: recent.finishedAt, weight: 12.5, reps: 12 },
    { workoutId: sameDay.id, date: sameDay.finishedAt, weight: 12.5, reps: 12 },
  ]);
  assert.deepEqual(exerciseLoadHistory(history, r.id, 'exercicio-novo'), []);
  assert.equal(JSON.stringify(history), snapshot);
});
test('repetições do gráfico pertencem à série mais pesada, com desempate por mais repetições', () => {
  const r = routine();
  const workout = startWorkout(r);
  workout.finishedAt = '2026-09-16T15:00:00Z';
  const sets = workout.exercises[0].sets;
  Object.assign(sets[0], { weight: '40', reps: '6', done: true });
  Object.assign(sets[1], { weight: '20', reps: '99', done: true });
  Object.assign(sets[2], { weight: '60', reps: '10', done: false });
  const point = () => exerciseLoadHistory([workout], r.id, r.exercises[0].id)[0];
  assert.equal(point().weight, 40);
  assert.equal(point().reps, 6);
  Object.assign(sets[1], { weight: '40', reps: '8' });
  assert.equal(point().reps, 8);
  sets[1].reps = '0';
  assert.equal(point().reps, 6);
});

test('rotina exige nome, exercícios e repetições inteiras positivas por série', () => {
  const r = routine();
  assert.equal(routineError(r), null);
  r.name = ' ';
  assert.ok(routineError(r));
  r.name = 'A';
  r.exercises[0].reps = ['0'];
  assert.ok(routineError(r));
  r.exercises[0].reps = ['1.5'];
  assert.ok(routineError(r));
  r.exercises[0].reps = [];
  assert.ok(routineError(r));
  r.exercises = [];
  assert.ok(routineError(r));
});
test('carga aceita vírgula, ponto e zero; rejeita negativos e campos vazios', () => {
  for (const value of ['0', '12,5', '12.5', '9999']) assert.equal(validWeight(value), true);
  for (const value of ['', ' ', '-1', '1e3', 'Infinity', '10000', 'a', '1,2,3'])
    assert.equal(validWeight(value), false);
  for (const value of ['0', '-1', '1.5', '1000', '']) assert.equal(validReps(value), false);
  assert.equal(numberValue('12,5'), 12.5);
});
test('treino preserva uma cópia da rotina e de cada meta por série', () => {
  const r = routine();
  const w = startWorkout(r);
  r.name = 'Alterado';
  r.exercises[0].name = 'Remada';
  r.exercises[0].reps[0] = '50';
  assert.equal(w.name, 'Treino A');
  assert.equal(w.exercises[0].name, 'Supino');
  assert.deepEqual(
    w.exercises[0].sets.map((s) => s.target),
    ['12', '10', '8'],
  );
  assert.ok(w.exercises[0].sets.every((s) => !s.done && s.weight === ''));
});
test('conclusão parcial conta somente séries feitas, preserva pendentes e encerra o treino', () => {
  const db = emptyDatabase();
  db.active = startWorkout(routine());
  assert.ok(workoutError(db.active));
  assert.throws(() => finishWorkout(db));
  Object.assign(db.active.exercises[0].sets[0], { reps: '10', weight: '12,5', done: true });
  Object.assign(db.active.exercises[0].sets[1], { reps: '10', weight: '100', done: false });
  assert.equal(volume(db.active), 125);
  const result = finishWorkout(db);
  assert.equal(result.active, null);
  assert.equal(result.workouts.length, 1);
  assert.ok(result.workouts[0].finishedAt);
  assert.equal(result.workouts[0].exercises[0].sets[1].done, false);
  assert.equal(db.workouts.length, 0);
});
test('não conclui treino com dados inválidos em uma série marcada', () => {
  const db = emptyDatabase();
  db.active = startWorkout(routine());
  Object.assign(db.active.exercises[0].sets[0], { reps: '10', weight: '', done: true });
  assert.throws(() => finishWorkout(db));
});
test('armazenamento mantém treino em andamento após serialização e rejeita corrupção', () => {
  const db = emptyDatabase();
  db.routines = [routine()];
  db.active = startWorkout(db.routines[0]);
  db.active.exercises[0].sets[0].weight = '20,5';
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  for (const raw of [
    '{',
    '{}',
    '{"version":2}',
    JSON.stringify({ ...db, active: {} }),
    JSON.stringify({ ...db, routines: [null] }),
  ])
    assert.throws(() => parseDatabase(raw));
});

test('repetir rotina copia cada carga, incluindo zero, sem copiar conclusão ou repetições reais', () => {
  const r = routine();
  const previous = startWorkout(r);
  previous.finishedAt = '2026-09-15T12:00:00.000Z';
  ['12,5', '20', '0'].forEach((weight, index) => {
    Object.assign(previous.exercises[0].sets[index], { weight, reps: '5', done: true });
  });
  const snapshot = JSON.stringify(previous);
  r.name = 'Treino renomeado';
  const next = startWorkout(r, [previous]);
  const sets = next.exercises[0].sets;
  assert.deepEqual(
    sets.map((s) => s.weight),
    ['12,5', '20', '0'],
  );
  assert.deepEqual(
    sets.map((s) => s.reps),
    ['12', '10', '8'],
  );
  assert.ok(sets.every((s) => !s.done));
  assert.notEqual(next.id, previous.id);
  assert.ok(sets.every((s, i) => s.id !== previous.exercises[0].sets[i].id));
  sets[0].weight = '30';
  assert.equal(JSON.stringify(previous), snapshot);
});

test('cargas vêm da sessão finalizada mais recente da mesma rotina, mesmo com histórico fora de ordem', () => {
  const r = routine();
  const old = startWorkout(r);
  old.finishedAt = '2026-09-14T12:00:00.000Z';
  old.exercises[0].sets.forEach((s) => Object.assign(s, { weight: '10', done: true }));
  const recent = startWorkout(r);
  recent.finishedAt = '2026-09-15T12:00:00.000Z';
  Object.assign(recent.exercises[0].sets[0], { weight: '15', done: true });
  Object.assign(recent.exercises[0].sets[1], { weight: '99', done: false });
  Object.assign(recent.exercises[0].sets[2], { weight: '-5', done: true });
  const other = structuredClone(recent);
  other.routineId = 'outra-rotina-com-mesmo-nome';
  other.finishedAt = '2026-09-16T12:00:00.000Z';
  other.exercises[0].sets[0].weight = '100';
  const unfinished = startWorkout(r);
  Object.assign(unfinished.exercises[0].sets[0], { weight: '80', done: true });
  assert.deepEqual(
    startWorkout(r, [other, old, unfinished, recent]).exercises[0].sets.map((s) => s.weight),
    ['15', '', ''],
  );
});

test('reordenação preserva vínculo por exercício; exercícios e séries novos começam sem carga', () => {
  const r = routine();
  r.exercises.push({ id: 'remada', name: 'Remada', reps: ['12'] });
  const previous = startWorkout(r);
  previous.finishedAt = '2026-09-15T12:00:00.000Z';
  Object.assign(previous.exercises[0].sets[0], { weight: '25', done: true });
  Object.assign(previous.exercises[1].sets[0], { weight: '40', done: true });
  r.exercises.reverse();
  r.exercises[1].reps.push('6');
  r.exercises.push({ id: 'novo-supino', name: 'Supino', reps: ['12'] });
  const next = startWorkout(r, [previous]);
  assert.equal(next.exercises[0].sets[0].weight, '40');
  assert.equal(next.exercises[1].sets[0].weight, '25');
  assert.equal(next.exercises[1].sets[3].weight, '');
  assert.equal(next.exercises[2].sets[0].weight, '');
});
