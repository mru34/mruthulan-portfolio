import test from 'node:test';
import assert from 'node:assert/strict';
import { currentChapter } from '../../js/lib/scrollnav.js';

test('the current chapter is the one across the middle of the screen', () => {
  const rects = [{ top: -900, bottom: 100 }, { top: 100, bottom: 2600 }, { top: 2600, bottom: 5100 }];
  assert.equal(currentChapter(rects, 1000), 1);
  assert.equal(currentChapter([{ top: 600, bottom: 3100 }], 1000), -1);
  assert.equal(currentChapter([{ top: -3000, bottom: 400 }], 1000), -1);
});
