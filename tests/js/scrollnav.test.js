import test from 'node:test';
import assert from 'node:assert/strict';
import { snapTarget, currentChapter } from '../../js/lib/scrollnav.js';

test('glides forward to a key pose that is close ahead', () => {
  assert.equal(snapTarget(1000, [1500, 4000], 1000, 1), 1500);
  assert.equal(snapTarget(1000, [1500], 1000, 1, 0.4), null);
});

test('never pulls back against the direction of the scroll', () => {
  assert.equal(snapTarget(1600, [1500, 4000], 1000, 1), null);
  assert.equal(snapTarget(1600, [1500], 1000, -1), 1500);
  assert.equal(snapTarget(1400, [1500], 1000, -1), null);
});

test('does nothing when already on the pose', () => {
  assert.equal(snapTarget(1501, [1500], 1000, 1), null);
  assert.equal(snapTarget(1500, [1500], 1000, -1), null);
});

test('the current chapter is the one across the middle of the screen', () => {
  const rects = [{ top: -900, bottom: 100 }, { top: 100, bottom: 2600 }, { top: 2600, bottom: 5100 }];
  assert.equal(currentChapter(rects, 1000), 1);
  assert.equal(currentChapter([{ top: 600, bottom: 3100 }], 1000), -1);
  assert.equal(currentChapter([{ top: -3000, bottom: 400 }], 1000), -1);
});
