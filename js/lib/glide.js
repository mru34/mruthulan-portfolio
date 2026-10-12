// A short camera move toward a point (MEANT's newspaper, before its article opens): the camera moves along its
// line to `to`, stopping `near` away, while its aim turns onto `to`, eased in and out. Plain arrays, no DOM.
export function glidePose(pos, at, to, t, near) {
  const e = t * t * (3 - 2 * t);
  const d = [pos[0] - to[0], pos[1] - to[1], pos[2] - to[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const end = d.map((v, i) => to[i] + (v / len) * near);
  return { pos: pos.map((v, i) => v + (end[i] - v) * e), at: at.map((v, i) => v + (to[i] - v) * e) };
}

// How far from `to` the glide should stop so that a shape (its corners, in the same space) just fills the screen:
// the camera comes from `from`, looks at `to`, sees `fovDeg` from top to bottom and is `aspect` times as wide as
// tall; `margin` keeps a little room around the shape. A corner nearer the camera looks bigger, so each counts at
// its own depth along the line.
export function fitNear(corners, to, from, fovDeg, aspect, margin = 1.08) {
  const d = [from[0] - to[0], from[1] - to[1], from[2] - to[2]];
  const len = Math.hypot(...d) || 1;
  const z = d.map((v) => v / len);
  let r = [-z[2], 0, z[0]];                     // across the screen: the line crossed with up (0, 1, 0)
  const rl = Math.hypot(...r);
  r = rl > 1e-6 ? r.map((v) => v / rl) : [1, 0, 0];
  const u = [z[1] * r[2] - z[2] * r[1], z[2] * r[0] - z[0] * r[2], z[0] * r[1] - z[1] * r[0]];
  const tanY = Math.tan((fovDeg * Math.PI) / 360), tanX = tanY * aspect;
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  let near = 0;
  for (const c of corners) {
    const v = [c[0] - to[0], c[1] - to[1], c[2] - to[2]];
    near = Math.max(near, dot(v, z) + margin * Math.max(Math.abs(dot(v, r)) / tanX, Math.abs(dot(v, u)) / tanY));
  }
  return near;
}
