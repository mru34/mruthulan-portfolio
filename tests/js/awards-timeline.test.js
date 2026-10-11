import test from 'node:test';
import assert from 'node:assert/strict';
import { awState, awProgress, slidePose, REST_Z, LIFT_Z } from '../../js/3d/awards-timeline.js';

const near = (a, b) => Math.abs(a - b) < 1e-9;

test('the spotlights come up one after another, each board lands with its light, all done once the section is in', () => {
  assert.equal(awState(0, 0).light, 0);
  assert.ok(awState(0.4, 0).light > awState(0.4, 2).light);
  for (let i = 0; i < 3; i++) { const s = awState(1, i); assert.deepEqual([s.light, s.board], [1, 1]); }
});

test('arrival runs from the section top meeting the bottom of the screen to a tenth of the way down', () => {
  assert.equal(awProgress(900, 900), 0);
  assert.equal(awProgress(90, 900), 1);
  assert.ok(Math.abs(awProgress(495, 900) - 0.5) < 1e-9);
});

test('Next photo: the front photo lifts and glides out past the edge, then slips back in behind the others', () => {
  const o = { w: 0.8, dir: 1, back: -0.03 };
  const start = slidePose(0, o);
  assert.ok(near(start.x, 0) && near(start.z, REST_Z), JSON.stringify(start));
  const mid = slidePose(0.5, o);
  assert.ok(near(mid.x, 0.92) && near(mid.z, LIFT_Z), JSON.stringify(mid));
  const end = slidePose(1, o);
  assert.ok(near(end.x, 0) && near(end.z, -0.03), JSON.stringify(end));
  let last = -1;
  for (let t = 0; t <= 0.5; t += 0.05) { const x = slidePose(t, o).x; assert.ok(x >= last); last = x; }
  assert.ok(slidePose(0.25, { ...o, dir: -1 }).x < 0, 'a drag to the left slides it out to the left');
});

test('a drag that commits carries on from where the hand let go', () => {
  const p = slidePose(0, { w: 0.8, dir: 1, back: -0.03, fromX: 0.4, fromZ: LIFT_Z });
  assert.ok(near(p.x, 0.4) && near(p.z, LIFT_Z), JSON.stringify(p));
});
