// The Awards wall as numbers. p is how far the section has arrived: 0 when its top reaches the bottom of the
// screen, 1 when its top is a tenth of the way down. Frame i's spotlight comes up a little after frame i - 1's,
// and its flip-board lands with it. slidePose is Next photo: the front photo's path out and back in behind.
import { ramp, easeOut, easeInOut, lerp } from '../lib/motion.js';

export const SLIDE_MS = 500;
export const REST_Z = -0.012;   // the front photo, just behind the mat's window
export const LIFT_Z = 0.09;     // lifted clear of the frame's moulding
export const GAP_Z = 0.004;     // between photos in the stack

export const awProgress = (top, vh) => Math.min(1, Math.max(0, (vh - top) / (0.9 * vh)));
export const awState = (p, i) => ({
  light: easeOut(ramp(p, 0.15 + i * 0.12, 0.55 + i * 0.12)),
  board: ramp(p, 0.25 + i * 0.12, 0.7 + i * 0.1),
});

// The front photo's place at time t (0..1) of its slide, in the frame's units: in the first half it lifts in front
// of the frame and glides out past the edge (1.15 window widths, to the side `dir`); in the second it drops behind
// the mat and slides back in at `back`, behind the others. fromX and fromZ: where a drag let go of it.
export function slidePose(t, { w, dir = 1, back, fromX = 0, fromZ = REST_Z }) {
  const out = dir * 1.15 * w;
  if (t <= 0.5) {
    const k = easeInOut(t / 0.5);
    return { x: lerp(fromX, out, k), z: lerp(fromZ, LIFT_Z, Math.min(1, k * 3)) };
  }
  const k = easeInOut((t - 0.5) / 0.5);
  return { x: lerp(out, 0, k), z: lerp(LIFT_Z, back, Math.min(1, k * 3)) };
}
