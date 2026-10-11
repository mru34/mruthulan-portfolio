import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, scatter } from '../../js/lib/scatter.js';

test('the same seed gives the same points, inside the box and outside the corridor', () => {
  const box = { x: [-10, 10], y: [-5, 6], z: [-40, 6] };
  const a = scatter(300, 11, box, 1.5), b = scatter(300, 11, box, 1.5);
  assert.deepEqual(a, b);
  assert.equal(a.length, 300);
  for (const [x, y, z] of a) {
    assert.ok(x >= -10 && x <= 10 && y >= -5 && y <= 6 && z >= -40 && z <= 6);
    assert.ok(Math.hypot(x, y) >= 1.5);
  }
  const r = mulberry32(1); const v = r();
  assert.ok(v >= 0 && v < 1);
  assert.notDeepEqual(scatter(5, 12, box), scatter(5, 11, box));
});
