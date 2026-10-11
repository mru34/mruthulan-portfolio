import test from 'node:test';
import assert from 'node:assert/strict';
import { spinStep, flickStep } from '../../js/lib/physics.js';

test('a spun pole keeps turning, slows down and comes to rest', () => {
  let s = { angle: 0, vel: 12 };
  const angles = [];
  for (let i = 0; i < 600 && !s.resting; i++) { s = spinStep(s, 16); angles.push(s.angle); }
  assert.ok(s.resting, 'came to rest');
  assert.ok(angles.at(-1) > 4, 'turned a good way first');
  for (let i = 1; i < angles.length; i++) assert.ok(angles[i] >= angles[i - 1]);
});

test('a flicked print slides, spins, and stops', () => {
  let s = { x: 0, y: 0, vx: 20, vy: 4, rot: 0, vr: 3 };
  for (let i = 0; i < 600 && !s.resting; i++) s = flickStep(s, 16);
  assert.ok(s.resting);
  assert.ok(s.x > 3 && s.rot > 0.4);
});

test('a still thing is already at rest', () => {
  assert.ok(spinStep({ angle: 1, vel: 0 }, 16).resting);
  assert.ok(flickStep({ x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0 }, 16).resting);
});
