import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, ramp, easeIn, easeOut, easeInOut, sectionProgress, Spring } from '../../js/lib/motion.js';

test('clamp, lerp and ramp', () => {
  assert.equal(clamp(-1), 0); assert.equal(clamp(2), 1); assert.equal(clamp(5, 0, 10), 5);
  assert.equal(lerp(10, 20, 0.25), 12.5);
  assert.equal(ramp(0.1, 0.25, 0.35), 0);
  assert.ok(Math.abs(ramp(0.3, 0.25, 0.35) - 0.5) < 1e-9);
  assert.equal(ramp(0.9, 0.25, 0.35), 1);
});

test('eases start at 0, end at 1', () => {
  for (const f of [easeIn, easeOut, easeInOut]) { assert.equal(f(0), 0); assert.equal(f(1), 1); }
  assert.equal(easeInOut(0.5), 0.5);
  assert.ok(easeIn(0.5) < 0.5 && easeOut(0.5) > 0.5);
});

test('sectionProgress runs 0 to 1 while the section is pinned', () => {
  assert.equal(sectionProgress(200, 2500, 1000), 0);
  assert.equal(sectionProgress(0, 2500, 1000), 0);
  assert.equal(sectionProgress(-750, 2500, 1000), 0.5);
  assert.equal(sectionProgress(-1500, 2500, 1000), 1);
  assert.equal(sectionProgress(-4000, 2500, 1000), 1);
  assert.equal(sectionProgress(-10, 1000, 1000), 1);
  assert.equal(sectionProgress(10, 1000, 1000), 0);
});

test('a spring settles on its target without overshooting much', () => {
  const s = new Spring(0); s.target = 1;
  let max = 0, moving = true, steps = 0;
  while (moving && steps < 500) { moving = s.step(16); max = Math.max(max, s.value); steps++; }
  assert.equal(moving, false);
  assert.equal(s.value, 1);
  assert.ok(max < 1.05, `overshoot ${max}`);
  assert.ok(steps < 150, `took ${steps} frames`);
});
