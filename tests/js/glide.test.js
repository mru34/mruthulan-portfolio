import test from 'node:test';
import assert from 'node:assert/strict';
import { glidePose } from '../../js/lib/glide.js';

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test('the glide starts where the camera is and ends near the point, looking at it', () => {
  const pos = [0, 0, 10], at = [0, 0, 0], to = [2, 0, 0];
  const a = glidePose(pos, at, to, 0, 2);
  assert.ok(close(a.pos, pos) && close(a.at, at));
  const b = glidePose(pos, at, to, 1, 2);
  assert.ok(close(b.at, to));
  const d = Math.hypot(b.pos[0] - to[0], b.pos[1] - to[1], b.pos[2] - to[2]);
  assert.ok(Math.abs(d - 2) < 1e-9, `ends 2 away (${d})`);
});

test('it eases: a quarter of the time covers less than a quarter of the way', () => {
  const pos = [0, 0, 10], to = [0, 0, 0];
  const q = glidePose(pos, [0, 0, 0], to, 0.25, 2);
  assert.ok(q.pos[2] > 10 - 0.25 * 8);
});
