import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, ORIGINS, COLORS } from '../../js/3d/paths.js';

test('every chapter has an origin, a colour, and keys in time order with the payoff held from 0.42 to 0.6', () => {
  for (const [name, keys] of Object.entries(KEYS)) {
    assert.ok(ORIGINS[name] && COLORS[name], name);
    for (let i = 1; i < keys.length; i++) assert.ok(keys[i].t > keys[i - 1].t, `${name} keys out of order at ${i}`);
    const pay = keys.find((k) => k.t === 0.42), hold = keys.find((k) => k.t === 0.6);
    assert.ok(pay && pay.stop && hold && hold.stop, `${name}: stops at 0.42 and 0.6`);
    assert.deepEqual({ ...pay, t: 0 }, { ...hold, t: 0 }, `${name}: the payoff holds still`);
    assert.ok(keys[0].t <= -0.3 && keys.at(-1).t > 0.6, `${name}: arrives and leaves`);
  }
});

test('the flight from KnowCad onto the Awards table takes at least 0.3 of a screen', () => {
  // the camera reaches the page pose when Awards' top is 0.6 screens down: KnowCad's local time 1.0
  assert.ok(1.0 - KEYS.knowcad.at(-1).t >= 0.3, `${KEYS.knowcad.at(-1).t}`);
});
