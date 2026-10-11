import test from 'node:test';
import assert from 'node:assert/strict';
import { bossHp, hpText, HIT, START_HP, CAPTURE_HP, bxState, handPose } from '../../js/3d/chapters/boss-timeline.js';

test('the scroll drains the boss from 5,000 to the capture’s 1,840 by the payoff', () => {
  assert.equal(bossHp(-1, 0), START_HP);
  assert.equal(bossHp(0.42, 0), CAPTURE_HP);
  assert.equal(bossHp(0.9, 0), CAPTURE_HP);
  assert.ok(bossHp(0.1, 0) < START_HP && bossHp(0.1, 0) > CAPTURE_HP);
});

test('each hit takes 350 and the boss stops at 0', () => {
  assert.equal(bossHp(0.5, 1), CAPTURE_HP - HIT);
  assert.equal(bossHp(0.5, 100), 0);
});

test('hp is written the way the app writes it', () => {
  assert.equal(hpText(1780), '1,780');
  assert.equal(hpText(0), '0');
});

test('the leaderboard bars and the card fan arrive with the scroll', () => {
  assert.deepEqual(bxState(-0.4), { bars: 0, cards: 0 });
  assert.deepEqual(bxState(0.42), { bars: 1, cards: 1 });
});

test('the hand: the next card to play is in front, the others fanned behind it in turn', () => {
  const n = 6;
  assert.equal(handPose(0, n, 0, 1).j, 0);
  assert.equal(handPose(2, n, 2, 1).j, 0);
  assert.equal(handPose(1, n, 2, 1).j, 5);
  assert.ok(handPose(0, n, 0, 1).z > handPose(1, n, 0, 1).z, 'the front card is on top');
  const angles = Array.from({ length: n }, (_, i) => handPose(i, n, 0, 1).a);
  assert.equal(new Set(angles.map((a) => a.toFixed(4))).size, n, 'each card at its own angle');
});

test('closed (before the scroll opens it) the hand is one stack', () => {
  for (let i = 0; i < 6; i++) assert.ok(Math.abs(handPose(i, 6, 0, 0).a) < 1e-9 && handPose(i, 6, 0, 0).lift === 0);
});
