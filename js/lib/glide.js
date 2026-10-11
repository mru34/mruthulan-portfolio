// A short camera move toward a point (MEANT's newspaper, before its article opens): the camera moves along its
// line to `to`, stopping `near` away, while its aim turns onto `to`, eased in and out. Plain arrays, no DOM.
export function glidePose(pos, at, to, t, near) {
  const e = t * t * (3 - 2 * t);
  const d = [pos[0] - to[0], pos[1] - to[1], pos[2] - to[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const end = d.map((v, i) => to[i] + (v / len) * near);
  return { pos: pos.map((v, i) => v + (end[i] - v) * e), at: at.map((v, i) => v + (to[i] - v) * e) };
}
