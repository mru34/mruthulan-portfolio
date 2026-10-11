import test from 'node:test';
import assert from 'node:assert/strict';
import { kcState, QUESTION, SOURCES } from '../../js/3d/chapters/knowcad-timeline.js';

test('the ticket lands, then the rep’s question types, then KnowCad searches, pulls the pages and answers', () => {
  assert.deepEqual(kcState(-0.4), { ticket: 0, typed: 0, search: 0, light: 0, pull: 0, answer: 0 });
  assert.equal(kcState(0.05).ticket, 1);
  assert.ok(kcState(0.08).typed > 0 && kcState(0.08).typed < QUESTION.length);
  assert.equal(kcState(0.16).typed, QUESTION.length);
  assert.ok(kcState(0.21).light > kcState(0.21).pull);
  assert.equal(kcState(0.3).answer, 0);
  const z = kcState(0.42);
  assert.deepEqual([z.ticket, z.typed, z.search, z.light, z.pull, z.answer], [1, QUESTION.length, 1, 1, 1, 1]);
});

test('the words of the example', () => {
  assert.equal(QUESTION, 'Licence “in use on another device” after moving to new laptops');
  assert.deepEqual(SOURCES, ['Licensing · p. 42', 'Admin Handbook · p. 118', 'Troubleshooting · p. 7']);
});
