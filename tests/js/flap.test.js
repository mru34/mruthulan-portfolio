import test from 'node:test';
import assert from 'node:assert/strict';
import { GLYPHS, glyphIndex, glyphUV, flickerSequence, tileState, layoutRows, scrubState, scrubSeq } from '../../js/3d/flap.js';

test('every letter of the boards is a glyph', () => {
  for (const ch of 'MRUTHULAN SENTHIL NATHAN OPEN TO INTERNSHIPS 2027/28') assert.ok(GLYPHS.includes(ch), ch);
  assert.equal(GLYPHS.length, 41);
  assert.equal(glyphIndex(' '), 0);
  assert.equal(glyphIndex('a'), glyphIndex('A'));
});

test('glyphUV splits a cell into its top and bottom halves', () => {
  const top = glyphUV(0, 'top', 8, 5), bottom = glyphUV(0, 'bottom', 8, 5);
  assert.deepEqual([top.u0, top.u1, top.v1], [0, 0.125, 1]);
  assert.ok(Math.abs(top.v0 - 0.9) < 1e-9 && Math.abs(bottom.v1 - 0.9) < 1e-9 && Math.abs(bottom.v0 - 0.8) < 1e-9);
  const last = glyphUV(40, 'bottom', 8, 6);
  assert.ok(Math.abs(last.u0) < 1e-9 && Math.abs(last.v0) < 1e-9, 'the 41st glyph starts the sixth row');
});

test('a flicker runs through other letters and lands back, never repeating a letter', () => {
  let n = 0; const rand = () => [0, 0, 0.5, 0.99][n++ % 4];
  const seq = flickerSequence('A', 3, rand);
  assert.equal(seq[0], 'A'); assert.equal(seq.at(-1), 'A');
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
  assert.ok(seq.length >= 4);
});

test('tileState walks the sequence one turn at a time', () => {
  const seq = ['A', 'B', 'C'];
  assert.deepEqual(tileState(seq, 100, 90, 50), { from: 'A', to: 'A', t: 0, done: false });
  const mid = tileState(seq, 100, 90, 145);
  assert.equal(mid.from, 'A'); assert.equal(mid.to, 'B'); assert.ok(Math.abs(mid.t - 0.5) < 1e-9);
  assert.equal(tileState(seq, 100, 90, 200).to, 'C');
  assert.deepEqual(tileState(seq, 100, 90, 400), { from: 'C', to: 'C', t: 1, done: true });
});

test('layoutRows: the two boards measure what the CSS boxes expect', () => {
  const desk = layoutRows([{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL NATHAN', color: 'white' }]);
  assert.equal(desk.tiles.length, 22);
  assert.ok(Math.abs(desk.size.w - 14.94) < 1e-6 && Math.abs(desk.size.h - 3.42) < 1e-6, JSON.stringify(desk.size));
  const phone = layoutRows([{ text: 'MRUTHULAN' }, { text: 'SENTHIL' }, { text: 'NATHAN' }]);
  assert.ok(Math.abs(phone.size.w - 10.12) < 1e-6 && Math.abs(phone.size.h - 5.07) < 1e-6, JSON.stringify(phone.size));
  const xs = desk.tiles.filter((t) => t.row === 0).map((t) => t.x);
  assert.ok(Math.abs(xs[0] + xs.at(-1)) < 1e-9, 'rows are centred');
  assert.ok(desk.tiles[0].y > desk.tiles.at(-1).y, 'first row on top');
});

test('the boards can spell every placing', () => {
  for (const ch of 'CHAMPION 2ND RUNNER-UP') assert.ok(GLYPHS.includes(ch), ch);
});

test('scrubState follows the scroll both ways and lands on the letter', () => {
  const seq = [' ', 'K', 'Q', 'C'];
  assert.deepEqual(scrubState(seq, 0), { from: ' ', to: ' ', t: 1, done: true });
  assert.deepEqual(scrubState(seq, 1), { from: 'C', to: 'C', t: 1, done: true });
  const m = scrubState(seq, 0.5);
  assert.equal(m.from, 'K'); assert.equal(m.to, 'Q'); assert.ok(Math.abs(m.t - 0.5) < 1e-9);
});

test('scrubSeq is the same every time for a seed, starts blank and ends on the letter', () => {
  assert.deepEqual(scrubSeq('C', 3, 5), scrubSeq('C', 3, 5));
  assert.equal(scrubSeq('C', 3, 5)[0], ' ');
  assert.equal(scrubSeq('C', 3, 5).at(-1), 'C');
  assert.ok(scrubSeq('C', 3, 5).length >= 4);
});
