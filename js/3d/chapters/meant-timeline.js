// MEANT's chapter as numbers: the four replies the tablet suggested rise off it as the visitor scrolls; the word
// tiles around the table drift with the scroll (never by themselves).
import { ramp, easeOut } from '../../lib/motion.js';

export const REPLIES = ['Roasted chicken rice', 'Steamed chicken rice', 'Char siew rice', 'Duck rice'];
export const mtState = (local) => ({ rise: easeOut(ramp(local, -0.05, 0.3)), words: local });
