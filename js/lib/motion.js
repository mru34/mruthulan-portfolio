// Small pure helpers for scroll-linked motion. No DOM, so they run under `node --test`.

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// 0 until p reaches a, 1 from b on, straight in between
export const ramp = (p, a, b) => clamp((p - a) / (b - a));
export const easeIn = (t) => t * t;
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

// How far a tall section has been scrolled through while its sticky content is pinned:
// 0 when its top reaches the top of the screen, 1 when its bottom reaches the bottom.
export function sectionProgress(top, height, viewport) {
  const run = height - viewport;
  if (run <= 0) return top <= 0 ? 1 : 0;
  return clamp(-top / run);
}

// A spring with critical damping: things ease in and settle, the way something with mass does.
export class Spring {
  constructor(value = 0, { stiffness = 170, damping = 26 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  // dt in milliseconds; returns true while still moving
  step(dt) {
    const s = Math.min(dt, 64) / 1000;
    const a = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += a * s;
    this.value += this.velocity * s;
    if (Math.abs(this.value - this.target) < 1e-4 && Math.abs(this.velocity) < 1e-4) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    return true;
  }
}
