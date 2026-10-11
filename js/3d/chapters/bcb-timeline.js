// Better Call Bhai's chapter as numbers: which booking screen the phone shows, and how far each time slot has
// flown from the phone onto the wall.
import { ramp, easeInOut } from '../../lib/motion.js';

// screen k (0 home, 1 form, 2 time slots, 3 Booking Confirmed) is reached at CUTS[k]; each change slides over
// 0.05 of a screen of scrolling
const CUTS = [-1, 0.03, 0.14, 0.3];
export function bbScreen(local) {
  for (let k = CUTS.length - 1; k > 0; k--) {
    if (local >= CUTS[k] + 0.05) return { from: k, to: k, t: 1 };
    if (local >= CUTS[k]) return { from: k - 1, to: k, t: easeInOut((local - CUTS[k]) / 0.05) };
  }
  return { from: 0, to: 0, t: 1 };
}

// slot i of n leaves the phone a little after slot i - 1; the last is on the wall before the payoff
export const bbSlots = (local, i, n) => easeInOut(ramp(local, 0.16 + (i / n) * 0.12, 0.28 + (i / n) * 0.12));
