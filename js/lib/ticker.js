// One animation loop for the whole homepage. Each frame runs its jobs in the order they were added (smooth
// scroll, then the page's beats, then the 3D), so everything drawn in a frame agrees on the scroll position.
// It sleeps when no job is busy and wakes on invalidate(), so nothing moves by itself.
export function createTicker(raf = (fn) => requestAnimationFrame(fn), caf = (id) => cancelAnimationFrame(id)) {
  const jobs = [];
  let id = 0;
  let last = 0;     // for springs: reset when the loop sleeps, so a pause is never one huge step
  let prev = 0;     // when the previous frame ran
  let moving = false;   // whether the previous frame asked for this one straight away
  let stopped = false;
  function frame(now) {
    id = 0;
    const dt = last ? Math.min(now - last, 100) : 16;
    // for the watchdog: how long this frame really took, however long that was, but only when frames ran back
    // to back; after the loop slept, the time since the last frame is idle time, not a slow frame (null)
    const gap = moving && prev ? now - prev : null;
    last = now;
    prev = now;
    let busy = false;
    for (const job of [...jobs]) busy = job(now, dt, gap) || busy;
    moving = busy;
    if (busy) invalidate(); else last = 0;
  }
  function invalidate() { if (!id && !stopped) id = raf(frame); }
  return {
    add(job) { jobs.push(job); invalidate(); return () => { const i = jobs.indexOf(job); if (i >= 0) jobs.splice(i, 1); }; },
    invalidate,
    stop() { stopped = true; if (id) caf(id); id = 0; },
    get running() { return Boolean(id); },
  };
}
