import test from 'node:test';
import assert from 'node:assert/strict';
import { FRAME_K, frameDistance, sampleKeys, pageWeight } from '../../js/lib/path.js';

const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const K = [
  { t: 0, at: [0, 0, 0], from: [0, 0, 1], d: 20, stop: true, color: [1, 1, 1] },
  { t: 1, at: [10, 0, 0], from: [0, 0, 1], d: 10, color: [0, 1, 0] },
  { t: 2, at: [20, 0, 0], from: [1, 0, 0], d: 10, stop: true, color: [0, 0, 1] },
];

test('frameDistance fits the height on a wide screen and the width on a tall one', () => {
  assert.ok(near(frameDistance(4, 2, 16 / 10), 2.5 / FRAME_K));
  assert.ok(near(frameDistance(4, 2, 9 / 19.5), 4 / (9 / 19.5) / FRAME_K));
  assert.ok(near(frameDistance(2, 2, 16 / 10), 2 / FRAME_K));
});

test('at a key the sample is exactly the key', () => {
  for (const k of K) {
    const s = sampleKeys(K, k.t, 1.6);
    assert.deepEqual(s.at, k.at); assert.ok(near(s.d, k.d)); assert.deepEqual(s.color, k.color);
  }
});

test('before the first key and after the last, the camera holds', () => {
  assert.deepEqual(sampleKeys(K, -5, 1.6).at, [0, 0, 0]);
  assert.deepEqual(sampleKeys(K, 9, 1.6).at, [20, 0, 0]);
});

test('the path is continuous: no jump between neighbouring samples', () => {
  let prev = sampleKeys(K, 0, 1.6);
  for (let t = 0.001; t <= 2; t += 0.001) {
    const s = sampleKeys(K, t, 1.6);
    assert.ok(Math.hypot(s.at[0] - prev.at[0], s.at[1] - prev.at[1]) < 0.05, `t=${t}`);
    prev = s;
  }
});

test('a stop key is arrived at gently (zero speed) and from always comes back unit length', () => {
  const a = sampleKeys(K, 1.999, 1.6), b = sampleKeys(K, 2, 1.6);
  assert.ok(Math.abs(b.at[0] - a.at[0]) < 1e-3);
  const f = sampleKeys(K, 1.5, 1.6).from;
  assert.ok(near(Math.hypot(...f), 1));
});

test('keys framed by w and h follow the aspect', () => {
  const keys = [{ t: 0, at: [0, 0, 0], from: [0, 0, 1], w: 4, h: 2 }];
  assert.ok(sampleKeys(keys, 0, 9 / 19.5).d > sampleKeys(keys, 0, 1.6).d);
});

test('pageWeight is 1 at the top and in the page sections, 0 in the chapters', () => {
  assert.equal(pageWeight(0, 0.4, 10), 1);
  assert.equal(pageWeight(2, 0.4, 10), 0);
  assert.equal(pageWeight(10, 0.4, 10), 1);
  assert.ok(pageWeight(9.85, 0.4, 10) > 0 && pageWeight(9.85, 0.4, 10) < 1);
});
