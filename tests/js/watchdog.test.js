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

test('frames each longer than the whole window still count: lower at once, then the stills', () => {
  const w = new FrameWatch({ slowMs: 40, windowMs: 2000 });
  assert.equal(w.push(3000, 3000), 'lower');
  assert.equal(w.push(6000, 3000), 'stills');
});

test('a few very long frames among smooth ones (a room being built, the page coming back) trigger nothing', () => {
  // what a load-and-scroll looked like at 4x CPU: frames around 30 ms, and now and then one of 200 to 500 ms
  const w = new FrameWatch();
  const out = [];
  let t = 0;
  for (let i = 0; i < 300; i++) {
    const dt = i % 20 === 7 ? 450 : 30;
    t += dt;
    out.push(w.push(t, dt));
  }
  assert.ok(out.every((v) => v === 'ok'), out.filter((v) => v !== 'ok').join());
});

test('mostly slow frames, with a few fast ones, still ask for a lower resolution', () => {
  const w = new FrameWatch();
  const out = [];
  let t = 0;
  for (let i = 0; i < 60; i++) {
    const dt = i % 4 === 0 ? 16 : 60;
    t += dt;
    out.push(w.push(t, dt));
  }
  assert.deepEqual(out.filter((v) => v !== 'ok'), ['lower']);
});

test('while a scene is being built a frame may take twice as long; far slower still counts', () => {
  const built = (dt) => { const w = new FrameWatch(); const out = []; for (let t = dt; t <= 2200; t += dt) out.push(w.push(t, dt, 2)); return out.filter((v) => v !== 'ok'); };
  assert.deepEqual(built(50), [], '50 ms frames while building: fine');
  assert.deepEqual(built(100), ['lower'], '100 ms frames while building: slow');
});
