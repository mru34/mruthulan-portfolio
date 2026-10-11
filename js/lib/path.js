// The camera's path through the world, as keyframes: a point to look at, the direction the camera looks from,
// and either a distance or an area (w x h) to frame, which turns into a distance for the screen's shape. Between
// keys every number moves along a cubic Hermite curve with tangents from the neighbouring keys, so the camera
// never jerks at a key; a key marked stop is arrived at and left at zero speed (a hold). Pure, so it is tested.
import { clamp } from './motion.js';

export const FRAME_K = 2 * Math.tan((30 * Math.PI) / 360);   // the stage's 30° vertical field of view

// the distance at which a w x h area just fills the view on a screen of this aspect (width / height)
export function frameDistance(w, h, aspect, k = FRAME_K) {
  return Math.max(h, w / aspect) / k;
}

const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const smooth = (u) => u * u * (3 - 2 * u);
// a key as plain numbers: look-at point (3), direction toward the camera (3, unit), distance (1)
const flat = (k, aspect) => [...k.at, ...norm(k.from), k.d ?? frameDistance(k.w, k.h, aspect)];

export function sampleKeys(keys, t, aspect) {
  const n = keys.length;
  const pack = (v, color) => ({ at: v.slice(0, 3), from: norm(v.slice(3, 6)), d: v[6], color });
  if (t <= keys[0].t) return pack(flat(keys[0], aspect), keys[0].color);
  if (t >= keys[n - 1].t) return pack(flat(keys[n - 1], aspect), keys[n - 1].color);
  let k = 0;
  while (keys[k + 1].t <= t) k++;
  const a = keys[k], b = keys[k + 1];
  const h = b.t - a.t;
  const u = (t - a.t) / h;
  const va = flat(a, aspect), vb = flat(b, aspect);
  const tangent = (i) => {
    if (keys[i].stop || i === 0 || i === n - 1) return [0, 0, 0, 0, 0, 0, 0];
    const p = flat(keys[i - 1], aspect), q = flat(keys[i + 1], aspect);
    const span = keys[i + 1].t - keys[i - 1].t;
    return q.map((x, j) => (x - p[j]) / span);
  };
  const ma = tangent(k), mb = tangent(k + 1);
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const v = va.map((x, j) => h00 * x + h10 * h * ma[j] + h01 * vb[j] + h11 * h * mb[j]);
  const s = smooth(u);
  const color = a.color && b.color ? a.color.map((c, j) => c + (b.color[j] - c) * s) : (a.color || b.color);
  return pack(v, color);
}

// how much the camera should behave like the page (fixed pose, no pointer look): 1 at the top until the hero
// starts leaving, 0 through the chapters, rising to 1 as the page sections (Awards on) arrive
export function pageWeight(s, heroEnd, pageStart) {
  const top = 1 - clamp(s / heroEnd);
  const end = clamp((s - (pageStart - 0.3)) / 0.3);
  return Math.max(top, end);
}
