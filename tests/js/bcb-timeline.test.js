import test from 'node:test';
import assert from 'node:assert/strict';
import { bbScreen, bbSlots } from '../../js/3d/chapters/bcb-timeline.js';

test('the phone steps through home, form, slots, confirmed with the scroll', () => {
  assert.deepEqual(bbScreen(-0.4), { from: 0, to: 0, t: 1 });
  assert.deepEqual(bbScreen(0.42), { from: 3, to: 3, t: 1 });
  const mid = bbScreen(0.06);
  assert.equal(mid.from, 0); assert.equal(mid.to, 1); assert.ok(mid.t > 0 && mid.t < 1);
});

test('slot tiles leave the phone one after another and are all on the wall by the payoff', () => {
  assert.equal(bbSlots(0.1, 0, 20), 0);
  assert.ok(bbSlots(0.25, 0, 20) > bbSlots(0.25, 19, 20));
  for (let i = 0; i < 20; i++) assert.equal(bbSlots(0.42, i, 20), 1);
});
