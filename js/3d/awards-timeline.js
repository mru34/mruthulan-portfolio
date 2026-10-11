// The Awards section as numbers. p is how far the section has arrived: 0 when its top reaches the bottom of
// the screen, 1 when its top is a tenth of the way down. Stack i stands up a little after stack i - 1, its
// flip-board lands with it, and the light over it brightens as it stands.
import { ramp, easeOut } from '../lib/motion.js';

export const awProgress = (top, vh) => Math.min(1, Math.max(0, (vh - top) / (0.9 * vh)));
export const awState = (p, i) => ({
  stand: easeOut(ramp(p, 0.15 + i * 0.12, 0.55 + i * 0.12)),
  board: ramp(p, 0.25 + i * 0.12, 0.7 + i * 0.1),
  pool: ramp(p, 0.3 + i * 0.12, 0.62 + i * 0.12),
});
