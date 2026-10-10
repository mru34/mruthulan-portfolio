import test from 'node:test';
import assert from 'node:assert/strict';
import { sbState } from '../../js/3d/chapters/signalbridge-timeline.js';

test('nothing has happened at the start of the chapter', () => {
  for (const [k, v] of Object.entries(sbState(0))) assert.equal(v, 0, k);
});

test('everything has happened by the payoff pose (0.8), so the still and a resting visitor see it all', () => {
  for (const [k, v] of Object.entries(sbState(0.8))) assert.equal(v, 1, k);
});

test('every part only moves forward as the visitor scrolls on', () => {
  let prev = sbState(0);
  for (let i = 1; i <= 100; i++) {
    const s = sbState(i / 100);
    for (const k of Object.keys(s)) assert.ok(s[k] >= prev[k] - 1e-12, `${k} at ${i / 100}`);
    prev = s;
  }
});

test('the message reaches the consent card before it turns, and the laptop after', () => {
  const at = (p) => sbState(p);
  assert.equal(at(0.47).toGate, 1);
  assert.equal(at(0.47).consent, 0);
  assert.equal(at(0.55).consent, 1);
  assert.equal(at(0.55).toLaptop, 0);
  assert.equal(at(0.66).toLaptop, 1);
});
