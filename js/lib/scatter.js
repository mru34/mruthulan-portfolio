// Seeded randomness, so a scene is laid out the same way every visit (and in its still).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// n points in a box, none closer than `corridor` to the line x = 0, y = 0 (where a camera flies)
export function scatter(n, seed, box, corridor = 0) {
  const r = mulberry32(seed);
  const pick = ([a, b]) => a + (b - a) * r();
  const out = [];
  while (out.length < n) {
    const p = [pick(box.x), pick(box.y), pick(box.z)];
    if (Math.hypot(p[0], p[1]) >= corridor) out.push(p);
  }
  return out;
}
