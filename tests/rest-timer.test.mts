import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRestRemaining,
  pauseRestTimer,
  restRemainingMs,
  resumeRestTimer,
  startRestTimer,
} from '../src/restTimer.ts';

test('descanso conta pelo relógio real, pausa sem perder o tempo e retoma uma vez', () => {
  const started = startRestTimer('exercicio', 'serie', 90, 1_000);
  assert.equal(restRemainingMs(started, 21_500), 69_500);
  const paused = pauseRestTimer(started, 21_500);
  assert.equal(restRemainingMs(paused, 80_000), 69_500);
  const resumed = resumeRestTimer(paused, 80_000);
  assert.equal(restRemainingMs(resumed, 149_499), 1);
  assert.equal(restRemainingMs(resumed, 149_500), 0);
  assert.equal(restRemainingMs(pauseRestTimer(resumed, 149_500), 200_000), 0);
  assert.equal(formatRestRemaining(69_500), '01:10');
  assert.equal(formatRestRemaining(0), '00:00');
});
