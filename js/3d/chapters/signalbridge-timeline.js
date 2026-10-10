// The SignalBridge chapter's choreography, as a function of how far through it the visitor has scrolled
// (0..1). The beats of the words are in js/home.js: the line from 0.25, the result and link from 0.6.
import { ramp, easeOut, easeInOut } from '../../lib/motion.js';

export function sbState(p) {
  return {
    arrive: easeOut(ramp(p, 0, 0.22)),        // the phone and the laptop come in
    lid: easeInOut(ramp(p, 0.05, 0.25)),      // the laptop opens
    beam: easeInOut(ramp(p, 0.22, 0.48)),     // the line of light draws from the phone toward the laptop
    lift: easeInOut(ramp(p, 0.25, 0.33)),     // the youth's message lifts off the phone
    toGate: easeInOut(ramp(p, 0.33, 0.47)),   // and travels to the consent card
    cardIn: easeOut(ramp(p, 0.38, 0.46)),     // the consent card appears
    consent: easeInOut(ramp(p, 0.48, 0.55)),  // it turns: consent given
    toLaptop: easeInOut(ramp(p, 0.55, 0.66)), // the message goes on to the laptop
    cardOut: easeInOut(ramp(p, 0.58, 0.66)),  // the card folds away
    brief: ramp(p, 0.64, 0.7),                // the laptop shows the handoff brief
    phoneAfter: ramp(p, 0.53, 0.57),          // the phone shows "Worker notified"
  };
}
