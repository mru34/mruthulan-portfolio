import test from 'node:test';
import assert from 'node:assert/strict';
import { worldPerPixel, rectToWorld, fitScale } from '../../js/lib/fit.js';

test('worldPerPixel: a 90° camera one unit away sees two units across two pixels', () => {
  assert.ok(Math.abs(worldPerPixel(90, 1, 2) - 1) < 1e-9);
});

test('rectToWorld puts a centred box at the origin and a top-left box up and to the left', () => {
  const k = 0.01;
  const c = rectToWorld({ left: 400, top: 300, width: 200, height: 100 }, 1000, 700, k);
  assert.ok(Math.abs(c.x) < 1e-9 && Math.abs(c.y) < 1e-9 && Math.abs(c.w - 2) < 1e-9 && Math.abs(c.h - 1) < 1e-9);
  const tl = rectToWorld({ left: 0, top: 0, width: 100, height: 100 }, 1000, 700, k);
  assert.ok(tl.x < 0 && tl.y > 0);
});

test('fitScale is the largest scale that fits both ways', () => {
  assert.equal(fitScale({ w: 10, h: 2 }, { w: 5, h: 5 }), 0.5);
  assert.equal(fitScale({ w: 2, h: 10 }, { w: 5, h: 5 }), 0.5);
});
