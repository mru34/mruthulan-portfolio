import test from 'node:test';
import assert from 'node:assert/strict';
import { awState, awProgress } from '../../js/3d/awards-timeline.js';

test('the stacks stand up one after another, each board lands with its stack, all done once the section is in', () => {
  assert.equal(awState(0, 0).stand, 0);
  assert.ok(awState(0.4, 0).stand > awState(0.4, 2).stand);
  for (let i = 0; i < 3; i++) { const s = awState(1, i); assert.deepEqual([s.stand, s.board, s.pool], [1, 1, 1]); }
});

test('arrival runs from the section top meeting the bottom of the screen to a tenth of the way down', () => {
  assert.equal(awProgress(900, 900), 0);
  assert.equal(awProgress(90, 900), 1);
  assert.ok(Math.abs(awProgress(495, 900) - 0.5) < 1e-9);
});
