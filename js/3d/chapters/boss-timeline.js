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
