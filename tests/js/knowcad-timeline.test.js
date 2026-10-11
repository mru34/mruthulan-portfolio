import test from 'node:test';
import assert from 'node:assert/strict';
import { kcState, QUESTION } from '../../js/3d/chapters/knowcad-timeline.js';

test('the question types with the scroll and the answer is turned over by the payoff', () => {
  assert.equal(kcState(-0.4).typed, 0);
  assert.equal(kcState(0.12).typed, QUESTION.length);
  const z = kcState(0.42);
  assert.deepEqual([z.light, z.gather, z.turn], [1, 1, 1]);
  assert.ok(kcState(-0.1).typed > 0 && kcState(-0.1).typed < QUESTION.length);
});

test('the matching sheets light up before they gather, and gather before the stack turns', () => {
  assert.ok(kcState(0.17).light > kcState(0.17).gather);
  assert.equal(kcState(0.3).turn, 0);
  assert.equal(QUESTION, 'Who won the Autodesk Singapore Hackathon 2026?');
});
