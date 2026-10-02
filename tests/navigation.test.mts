import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldDeferSupplementLink } from '../src/navigation.ts';

test('link de suplementos preserva rascunhos e sessões em andamento', () => {
  for (const page of [
    'editor',
    'division-editor',
    'supplement-editor',
    'cardio-editor',
    'routine-sets',
    'bulk-import',
    'backup',
    'finish',
    'cardio-finish',
    'workout',
    'cardio-player',
  ])
    assert.equal(shouldDeferSupplementLink(page), true, page);
  for (const page of ['home', 'routines', 'history', 'charts', 'supplements'])
    assert.equal(shouldDeferSupplementLink(page), false, page);
});
