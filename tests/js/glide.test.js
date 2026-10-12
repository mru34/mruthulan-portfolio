import test from 'node:test';
import assert from 'node:assert/strict';
import { glidePose, fitNear } from '../../js/lib/glide.js';

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

test('fitNear: how far from a shape the camera stops so the whole of it just fills the screen', () => {
  // a 2 x 1 card facing a camera on +z; a 90° field of view (tan 45° = 1) on a screen twice as wide as tall
  const card = [[-1, -0.5, 0], [1, -0.5, 0], [-1, 0.5, 0], [1, 0.5, 0]];
  assert.ok(Math.abs(fitNear(card, [0, 0, 0], [0, 0, 10], 90, 2, 1) - 0.5) < 1e-9, 'width and height both fit at 0.5');
  // on a tall screen (aspect 0.5) the width decides: 1 / (1 x 0.5) = 2, and the margin keeps an edge clear
  assert.ok(Math.abs(fitNear(card, [0, 0, 0], [0, 0, 10], 90, 0.5, 1) - 2) < 1e-9);
  assert.ok(Math.abs(fitNear(card, [0, 0, 0], [0, 0, 10], 90, 0.5, 1.1) - 2.2) < 1e-9);
  // seen from straight above, a card lying flat (in x, z) is the same as one facing the camera
  const flat = [[-1, 0, -0.5], [1, 0, -0.5], [-1, 0, 0.5], [1, 0, 0.5]];
  assert.ok(Math.abs(fitNear(flat, [0, 0, 0], [0, 10, 0.001], 90, 2, 1) - 0.5) < 1e-3);
  // seen at a slant, the near edge is closer and looks bigger: further than its flat size alone would say
  assert.ok(fitNear(flat, [0, 0, 0], [0, 5, 5], 90, 0.5, 1) > 1);
});
