// KnowCad's chapter as numbers: a customer's ticket lands on the rep's screen, the rep's question to KnowCad types
// out, KnowCad searches the manuals, three of them light up and a page slides out of each to the desk, and the
// suggested answer appears with its sources. The question and the answer are an example.
import { ramp, easeInOut } from '../../lib/motion.js';

export const QUESTION = 'Licence “in use on another device” after moving to new laptops';
export const SOURCES = ['Licensing · p. 42', 'Admin Handbook · p. 118', 'Troubleshooting · p. 7'];
export const kcState = (local) => ({
  ticket: easeInOut(ramp(local, -0.05, 0.05)),
  typed: Math.round(QUESTION.length * ramp(local, 0.0, 0.16)),
  search: easeInOut(ramp(local, 0.16, 0.2)),
  light: easeInOut(ramp(local, 0.18, 0.24)),
  pull: easeInOut(ramp(local, 0.22, 0.36)),
  answer: easeInOut(ramp(local, 0.34, 0.42)),
});
