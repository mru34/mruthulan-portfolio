// KnowCad's chapter as numbers: the question typed by the scroll, the matching sheets lighting up, gathering
// into one stack, and the stack turning over to the answer.
import { ramp, easeInOut } from '../../lib/motion.js';

export const QUESTION = 'Who won the Autodesk Singapore Hackathon 2026?';
export const kcState = (local) => ({
  typed: Math.round(QUESTION.length * ramp(local, -0.35, 0.12)),
  light: easeInOut(ramp(local, 0.05, 0.18)),
  gather: easeInOut(ramp(local, 0.16, 0.32)),
  turn: easeInOut(ramp(local, 0.3, 0.42)),
});
