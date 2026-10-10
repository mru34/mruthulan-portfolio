import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameWatch } from '../../js/lib/watchdog.js';

const run = (w, start, ms, dt) => { const out = []; for (let t = start; t <= start + ms; t += dt) out.push(w.push(t, dt)); return out; };

test('smooth frames never trigger anything', () => {
  const w = new FrameWatch();
  assert.ok(run(w, 0, 6000, 16).every((v) => v === 'ok'));
});

test('slow frames ask for a lower resolution, then for the stills, then nothing more', () => {
  const w = new FrameWatch();
  const first = run(w, 0, 2100, 50);
  assert.deepEqual(first.filter((v) => v !== 'ok'), ['lower']);
  const second = run(w, 2200, 2100, 50);
  assert.deepEqual(second.filter((v) => v !== 'ok'), ['stills']);
  assert.ok(run(w, 4400, 3000, 80).every((v) => v === 'ok'));
});
