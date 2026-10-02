import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ancestors,
  belongsTo,
  muscleById,
  muscleCatalog,
  muscleCoverage,
  muscleGroups,
  muscleLinksKey,
  searchMuscles,
  validMuscleLinks,
} from '../src/muscles.ts';
import { bodyDetails, bodyRegions } from '../src/bodyMapData.ts';
import {
  emptyDatabase,
  newRoutine,
  parseDatabase,
  routineDraftKey,
  routineError,
  startWorkout,
} from '../src/model.ts';

test('catálogo tem IDs únicos, árvore válida, busca sem acentos e localização para todos os itens', () => {
  assert.equal(muscleById.size, muscleCatalog.length);
  for (const node of muscleCatalog) {
    if (node.parentId) assert.ok(muscleById.has(node.parentId));
    const parents = ancestors(node.id);
    assert.equal(new Set(parents.map((parent) => parent.id)).size, parents.length);
    assert.ok(!parents.some((parent) => parent.id === node.id));
    const root = parents.at(-1)?.id ?? node.id;
    const region = bodyDetails[node.id] ?? bodyRegions[root];
    assert.ok(region?.front || region?.back, node.id);
  }
  assert.ok(muscleGroups.length >= 20);
  assert.ok(searchMuscles('peitoral').some((node) => node.id === 'chest'));
  assert.ok(searchMuscles('quadriceps lateral').some((node) => node.id === 'vastus-lateralis'));
  assert.equal(searchMuscles('inexistente').length, 0);
  assert.ok(belongsTo('pectoralis-clavicular', 'chest'));
  assert.equal(belongsTo('chest', 'pectoralis-clavicular'), false);
});

test('cobertura agrega descendentes sem preencher filhos e deduplica séries por exercício', () => {
  const routine = newRoutine();
  routine.name = 'A';
  const exercise = routine.exercises[0];
  exercise.name = 'Supino';
  exercise.muscles = [
    { nodeId: 'chest', role: 'primary' },
    { nodeId: 'pectoralis-clavicular', role: 'secondary' },
  ];
  const before = structuredClone(routine);
  assert.equal(muscleCoverage([routine], 'chest').primary, 3);
  assert.equal(muscleCoverage([routine], 'chest').secondary, 0);
  assert.equal(muscleCoverage([routine], 'pectoralis-clavicular').secondary, 3);
  assert.equal(muscleCoverage([routine], 'pectoralis-sternocostal').entries.length, 0);
  assert.equal(muscleCoverage([routine], 'pectoralis-sternocostal').broadAncestors.length, 1);
  assert.equal(muscleCoverage([routine, routine], 'chest').primary, 3);
  const second = structuredClone(routine);
  second.id = 'second-routine';
  second.exercises[0].muscles = [{ nodeId: 'chest', role: 'secondary' }];
  const combined = muscleCoverage([routine, second], 'chest');
  assert.equal(combined.primary, 3);
  assert.equal(combined.secondary, 3);
  assert.equal(combined.entries.length, 2);
  assert.deepEqual(routine, before);
});

test('vínculos opcionais mantêm compatibilidade, validam IDs e têm cópia independente no treino', () => {
  const routine = newRoutine();
  routine.name = 'A';
  routine.exercises[0].name = 'Supino';
  const db = { ...emptyDatabase(), routines: [routine] };
  assert.doesNotThrow(() => parseDatabase(JSON.stringify(db)));
  const initialKey = routineDraftKey(routine);
  routine.exercises[0].muscles = [];
  assert.equal(routineDraftKey(routine), initialKey);
  routine.exercises[0].muscles = [
    { nodeId: 'chest', role: 'primary' },
    { nodeId: 'triceps', role: 'secondary' },
  ];
  assert.notEqual(routineDraftKey(routine), initialKey);
  assert.equal(
    muscleLinksKey(routine.exercises[0].muscles),
    muscleLinksKey([...routine.exercises[0].muscles].reverse()),
  );
  const active = startWorkout(routine);
  const saved = structuredClone(active);
  saved.finishedAt = new Date().toISOString();
  Object.assign(saved.exercises[0].sets[0], { done: true, weight: '20' });
  routine.exercises[0].muscles[0].role = 'secondary';
  assert.equal(active.exercises[0].muscles![0].role, 'primary');
  const parsed = parseDatabase(JSON.stringify({ ...db, active, workouts: [saved] }));
  assert.equal(parsed.workouts[0].exercises[0].muscles![0].role, 'primary');
  for (const invalid of [
    null,
    {},
    [{ nodeId: 'nope', role: 'primary' }],
    [{ nodeId: 'chest', role: 'wrong' }],
    [
      { nodeId: 'chest', role: 'primary' },
      { nodeId: 'chest', role: 'secondary' },
    ],
  ]) {
    assert.equal(validMuscleLinks(invalid), false);
    const bad = structuredClone(db);
    (bad.routines[0].exercises[0] as any).muscles = invalid;
    assert.ok(routineError(bad.routines[0]));
    assert.throws(() => parseDatabase(JSON.stringify(bad)));
    const badActive = structuredClone(active);
    (badActive.exercises[0] as any).muscles = invalid;
    assert.throws(() => parseDatabase(JSON.stringify({ ...emptyDatabase(), active: badActive })));
  }
});
