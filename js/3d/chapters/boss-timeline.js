// Boss Breaker's chapter as numbers: the Stress Dragon's HP drained by the scroll to the HP in the real
// capture, then by the visitor's own hits; the leaderboard and the hand of challenge cards arriving.
import { ramp, easeOut } from '../../lib/motion.js';

export const HIT = 350;           // the app's own estimate for an 80-point hit
export const START_HP = 5000;
export const CAPTURE_HP = 1840;   // "HP 1,840 / 5,000" in the real Boss Raid screens (desktop and phone)

export const bossHp = (local, hits) =>
  Math.max(0, Math.round(START_HP - (START_HP - CAPTURE_HP) * easeOut(ramp(local, -0.2, 0.42))) - hits * HIT);
export const hpText = (hp) => hp.toLocaleString('en-US');
export const bxState = (local) => ({ bars: easeOut(ramp(local, -0.2, 0.3)), cards: easeOut(ramp(local, 0, 0.35)) });

// The hand of challenge cards: card i's place when card `front` is the next to play. j is its place in the hand
// (0 in front, on top), a its angle about the hand's pivot, lift its height; each card has its own small tilt and
// height so the hand looks held, not stamped. `open` (0..1) is how far the scroll has fanned it.
export function handPose(i, n, front, open) {
  const j = (i - front + n) % n;
  const tilt = (((i * 37) % 7) - 3) * 0.012;
  return {
    j,
    a: open * (-0.3 + j * (0.6 / Math.max(1, n - 1)) + tilt),   // the front card at the right end, as a hand holds them
    lift: open * (((i * 53) % 5) - 2) * 0.03,
    z: -j * 0.06,
  };
}
