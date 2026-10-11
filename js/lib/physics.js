// Two small pieces of physics, in units per second: a spin that slows down under drag (the barber pole) and a
// slide with friction that also turns (a flicked print). dt in milliseconds. Pure, so they are tested.
const REST = 0.02;

export function spinStep({ angle, vel }, dt, { drag = 1.6 } = {}) {
  const s = Math.min(dt, 64) / 1000;
  const v = vel * Math.exp(-drag * s);
  const resting = Math.abs(v) < REST;
  return { angle: angle + (resting ? 0 : v * s), vel: resting ? 0 : v, resting };
}

export function flickStep({ x, y, vx, vy, rot, vr }, dt, { friction = 3.2 } = {}) {
  const s = Math.min(dt, 64) / 1000;
  const k = Math.exp(-friction * s);
  const nvx = vx * k, nvy = vy * k, nvr = vr * k;
  const resting = Math.hypot(nvx, nvy) < REST && Math.abs(nvr) < REST;
  return resting
    ? { x, y, vx: 0, vy: 0, rot, vr: 0, resting }
    : { x: x + nvx * s, y: y + nvy * s, vx: nvx, vy: nvy, rot: rot + nvr * s, vr: nvr, resting };
}
