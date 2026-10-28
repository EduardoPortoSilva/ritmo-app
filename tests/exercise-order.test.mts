import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDatabase,
  newExercise,
  newRoutine,
  parseDatabase,
  startWorkout,
  type Workout,
} from '../src/model.ts';
import { createBackup, parseBackup } from '../src/backup.ts';
import {
  newOrderChecks,
  pendingOrderChecks,
  answerOrderChecks,
  confirmedOrderChanges,
  orderChangesFor,
} from '../src/exerciseOrder.ts';

function fixture() {
  const routine = newRoutine();
  routine.name = 'Ordem';
  routine.exercises = ['Supino', 'Remada', 'Leg press'].map((name) => ({
    ...newExercise(),
    name,
    reps: ['12', '12'],
  }));
  const workout = startWorkout(routine);
  workout.exercises.forEach((e) => e.sets.forEach((s) => (s.weight = '20')));
  return { routine, workout };
}
const done = (w: Workout, i: number) => w.exercises[i].sets.forEach((s) => (s.done = true));
function detect(w: Workout) {
  const a = w.exercises[0];
  const checks = newOrderChecks(w, a.id, a.sets[0].id);
  a.sets[0].done = true;
  return { ...w, orderChecks: [...(w.orderChecks ?? []), ...checks] };
}

test('só primeira série ao ser concluída detecta pares posteriores inteiramente concluídos', () => {
  const { workout: w } = fixture();
  const [a, b, c] = w.exercises;
  assert.deepEqual(newOrderChecks(w, a.id, a.sets[0].id), []); // filled is not done
  b.sets[0].done = true;
  assert.deepEqual(newOrderChecks(w, a.id, a.sets[0].id), []);
  done(w, 1);
  assert.deepEqual(newOrderChecks(w, a.id, a.sets[1].id), []);
  assert.deepEqual(newOrderChecks(w, c.id, c.sets[0].id), []); // B is earlier than C
  const detected = detect(w);
  assert.deepEqual(pendingOrderChecks(detected), [
    { beforeId: a.id, afterId: b.id, confirmed: null },
  ]);
  assert.deepEqual(confirmedOrderChanges(detected), []); // unconfirmed is not a swap
  assert.deepEqual(newOrderChecks(detected, a.id, a.sets[0].id), []);
});

test('várias inversões geram pares distintos; confirmação não muda cadastro, séries ou cargas', () => {
  const { workout: w } = fixture();
  done(w, 1);
  done(w, 2);
  const detected = detect(w);
  const original = structuredClone(detected);
  const confirmed = answerOrderChecks(answerOrderChecks(detected, true), true);
  assert.equal(confirmedOrderChanges(confirmed).length, 2);
  assert.equal(orderChangesFor(confirmedOrderChanges(confirmed), w.exercises[0].id).length, 2);
  assert.equal(orderChangesFor(confirmedOrderChanges(confirmed), w.exercises[1].id).length, 1);
  assert.deepEqual(confirmed.exercises, original.exercises);
  assert.deepEqual(detected, original);
  assert.deepEqual(pendingOrderChecks(confirmed), []);
  const mixed = answerOrderChecks(answerOrderChecks(detected, true), false);
  assert.equal(confirmedOrderChanges(mixed).length, 1);
  assert.equal(mixed.orderChecks?.[1].confirmed, false);
});

test('recusa é lembrada; desfazer a primeira série não repete a pergunta nem inventa confirmação', () => {
  const { workout: w } = fixture();
  done(w, 1);
  const refused = answerOrderChecks(detect(w), false);
  refused.exercises[0].sets[0].done = false;
  assert.deepEqual(
    newOrderChecks(refused, refused.exercises[0].id, refused.exercises[0].sets[0].id),
    [],
  );
  assert.deepEqual(confirmedOrderChanges(refused), []);
  assert.deepEqual(pendingOrderChecks(refused), []);
});

test('desfazer conclusão de B ou primeira série de A suspende confirmação pendente e mudança válida', () => {
  const { workout: w } = fixture();
  done(w, 1);
  const detected = detect(w);
  detected.exercises[1].sets[0].done = false;
  assert.deepEqual(pendingOrderChecks(detected), []);
  detected.exercises[1].sets[0].done = true;
  const confirmed = answerOrderChecks(detected, true);
  confirmed.exercises[0].sets[0].done = false;
  assert.deepEqual(confirmedOrderChanges(confirmed), []);
});

test('próximo treino copia só trocas confirmadas da sessão mais recente desta rotina, por ID', () => {
  const { routine, workout: w } = fixture();
  done(w, 1);
  done(w, 2);
  const finished = {
    ...answerOrderChecks(answerOrderChecks(detect(w), true), true),
    finishedAt: '2026-10-22T12:00:00Z',
  };
  const original = structuredClone(finished);
  const next = startWorkout(routine, [finished]);
  assert.equal(next.previousOrder?.changes.length, 2);
  assert.equal(next.orderChecks, undefined);
  assert.equal(next.orderNoticesSeen, undefined);
  assert.deepEqual(finished, original);
  routine.exercises[0].name = 'Outro nome';
  routine.exercises.reverse(); // snapshots don't depend on the current order or names
  assert.equal(startWorkout(routine, [finished]).previousOrder?.changes[0].beforeName, 'Supino');
  const latest = { ...startWorkout(routine), finishedAt: '2026-10-23T12:00:00Z' };
  assert.equal(startWorkout(routine, [finished, latest]).previousOrder, undefined);
  assert.equal(
    startWorkout({ ...routine, id: 'outra-rotina' }, [finished]).previousOrder,
    undefined,
  );
  routine.exercises = routine.exercises.filter((e) => e.id !== w.exercises[1].id);
  assert.equal(startWorkout(routine, [finished]).previousOrder?.changes.length, 1);
});

test('banco e backup preservam perguntas, trocas e avisos vistos; legados continuam aceitos', () => {
  const { routine, workout: w } = fixture();
  done(w, 1);
  const pending = detect(w);
  const db = { ...emptyDatabase(), routines: [routine], active: pending };
  assert.deepEqual(parseDatabase(JSON.stringify(db)), db);
  const finished = { ...answerOrderChecks(pending, true), finishedAt: '2026-10-22T12:00:00Z' };
  const active = startWorkout(routine, [finished]);
  active.orderNoticesSeen = [active.exercises[0].id];
  const withHistory = { ...db, active, workouts: [finished] };
  assert.deepEqual(parseBackup(createBackup(withHistory)).database, withHistory);
  const legacy = { ...db, active: startWorkout(routine) };
  assert.deepEqual(parseDatabase(JSON.stringify(legacy)), legacy);
});

test('parser rejeita decisões inválidas, pares duplicados, referências externas e avisos inconsistentes', () => {
  const { routine, workout: w } = fixture();
  done(w, 1);
  const confirmed = answerOrderChecks(detect(w), true);
  const base = { ...emptyDatabase(), routines: [routine], active: confirmed };
  const check = confirmed.orderChecks![0];
  for (const orderChecks of [
    null,
    {},
    [null],
    [{ ...check, confirmed: 'sim' }],
    [check, check],
    [{ ...check, afterId: 'ausente' }],
    [{ ...check, beforeId: check.afterId, afterId: check.beforeId }],
  ]) {
    assert.throws(() =>
      parseDatabase(JSON.stringify({ ...base, active: { ...confirmed, orderChecks } })),
    );
  }
  const next = startWorkout(routine, [{ ...confirmed, finishedAt: '2026-10-22T12:00:00Z' }]);
  for (const invalid of [
    { previousOrder: null },
    { previousOrder: { workoutId: 'x', changes: [null] } },
    {
      previousOrder: {
        workoutId: 'x',
        changes: [{ ...next.previousOrder!.changes[0], afterId: 'ausente' }],
      },
    },
    { orderNoticesSeen: ['ausente'] },
    { orderNoticesSeen: [next.exercises[0].id, next.exercises[0].id] },
  ])
    assert.throws(() =>
      parseDatabase(JSON.stringify({ ...base, active: { ...next, ...invalid } })),
    );
});
