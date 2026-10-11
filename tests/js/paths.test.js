import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('every flight between two rooms gets at least 0.9 of a screen, and the one onto the Awards wall 0.7', () => {
  // a room's last key is local time (its own section's top) and the next room's first key is local to its top;
  // between them stand the rest of the room's 1.6 screens and the stretch of scroll the CSS puts between rooms
  const css = fs.readFileSync(new URL('../../css/styles.css', import.meta.url), 'utf8');
  const gap = (sel) => { const at = css.indexOf(`${sel}{margin-top:`); assert.ok(at >= 0, sel); return parseFloat(css.slice(at + sel.length + 12)) / 100; };
  const between = gap('.has-3d .chapter + .chapter'), beforeAwards = gap('.has-3d #awards');
  const rooms = ['signalbridge', 'boss-breaker', 'better-call-bhai', 'meant', 'knowcad'];
  for (let i = 0; i < rooms.length - 1; i++) {
    const flight = 1.6 - KEYS[rooms[i]].at(-1).t + between + KEYS[rooms[i + 1]][0].t;
    assert.ok(flight >= 0.9, `${rooms[i]} to ${rooms[i + 1]}: ${flight}`);
  }
  // the camera reaches the page pose when Awards' top is 0.6 screens down
  const awards = 1.6 + beforeAwards - 0.6 - KEYS.knowcad.at(-1).t;
  assert.ok(awards >= 0.7, `KnowCad to Awards: ${awards}`);
});
