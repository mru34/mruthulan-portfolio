import test from 'node:test';
import assert from 'node:assert/strict';
import { mtState, REPLIES } from '../../js/3d/chapters/meant-timeline.js';

test('the replies rise off the tablet with the scroll and are up by the payoff', () => {
  assert.equal(mtState(-0.4).rise, 0);
  assert.equal(mtState(0.42).rise, 1);
  assert.ok(mtState(0.1).rise > 0 && mtState(0.1).rise < 1);
});

test('the four replies are the ones on the real tablet', () => {
  assert.deepEqual(REPLIES, ['Roasted chicken rice', 'Steamed chicken rice', 'Char siew rice', 'Duck rice']);
});
