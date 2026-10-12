import test from 'node:test';
import assert from 'node:assert/strict';
import { createTicker } from '../../js/lib/ticker.js';

// a fake requestAnimationFrame: frames run when the test says so
function fakeRaf() {
  let queue = [], id = 0;
  return {
    raf: (fn) => { queue.push([++id, fn]); return id; },
    caf: (n) => { queue = queue.filter(([i]) => i !== n); },
    run(now) { const q = queue; queue = []; q.forEach(([, fn]) => fn(now)); },
    get pending() { return queue.length; },
  };
}

test('jobs run in the order they were added, every frame', () => {
  const f = fakeRaf(); const t = createTicker(f.raf, f.caf); const seen = [];
  t.add(() => { seen.push('scroll'); return true; });
  t.add(() => { seen.push('beats'); return false; });
  t.add(() => { seen.push('3d'); return false; });
  f.run(16); f.run(32);
  assert.deepEqual(seen, ['scroll', 'beats', '3d', 'scroll', 'beats', '3d']);
});

test('it sleeps when no job is busy and wakes on invalidate', () => {
  const f = fakeRaf(); const t = createTicker(f.raf, f.caf); let n = 0;
  t.add(() => { n++; return false; });
  f.run(16);
  assert.equal(f.pending, 0);
  t.invalidate(); t.invalidate();
  assert.equal(f.pending, 1, 'one frame however often it is woken');
  f.run(40);
  assert.equal(n, 2);
});

test('dt is capped and gap is null after an idle pause', () => {
  const f = fakeRaf(); const t = createTicker(f.raf, f.caf); const got = [];
  t.add((now, dt, gap) => { got.push([dt, gap]); return got.length < 2; });
  f.run(1000); f.run(1300); t.invalidate(); f.run(5000);
  assert.deepEqual(got[0], [16, null]);
  assert.deepEqual(got[1], [100, 300]);
  assert.deepEqual(got[2], [16, null]);
});

test('stop cancels the next frame and ignores invalidate', () => {
  const f = fakeRaf(); const t = createTicker(f.raf, f.caf);
  t.add(() => true);
  t.stop(); t.invalidate();
  assert.equal(f.pending, 0);
});

test('a slow frame in the middle of motion is reported however long it took; a wake-up after sleeping is not', () => {
  const f = fakeRaf(); const t = createTicker(f.raf, f.caf); const gaps = [];
  let busy = true;
  t.add((now, dt, gap) => { gaps.push(gap); return busy; });
  f.run(1000); f.run(2500);          // the second frame took 1.5 s while the page was moving
  busy = false; f.run(2516);         // the loop goes to sleep after this frame
  t.invalidate(); f.run(2700);       // woken by an event 184 ms later: idle time, not a frame
  assert.deepEqual(gaps, [null, 1500, 16, null]);
});

test('time the page spent away (another page, the browser cache, a hidden tab) is not a frame', () => {
  const f = fakeRaf(); const t = createTicker(f.raf, f.caf); const got = [];
  t.add((now, dt, gap) => { got.push([dt, gap]); return true; });   // mid-motion when the visitor leaves
  f.run(1000); f.run(1016);
  t.away();                          // pagehide / the tab hidden
  assert.equal(f.pending, 0, 'no frame runs while the page is away');
  t.invalidate();                    // a frame the browser draws as it leaves (the view transition) wakes nothing
  assert.equal(f.pending, 0);
  t.back();                          // pageshow / the tab shown again
  t.back();
  assert.equal(f.pending, 1, 'one frame on return');
  f.run(9000);
  f.run(9016);
  assert.deepEqual(got, [[16, null], [16, 16], [16, null], [16, 16]]);
});
