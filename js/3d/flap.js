// The split-flap letters: the glyphs a board can show, what a tile shows at any moment (by the clock, or by the
// scroll), and where the tiles of a board go. Pure, so it is tested; js/3d/board.js draws it.
import { mulberry32 } from '../lib/scatter.js';

export const GLYPHS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.·-';
export const glyphIndex = (ch) => Math.max(0, GLYPHS.indexOf(String(ch).toUpperCase()));

// uv box of a glyph's top or bottom half in an atlas of cols x rows cells (v = 1 at the top of the image)
export function glyphUV(index, half, cols, rows) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const u0 = col / cols;
  const u1 = (col + 1) / cols;
  const vTop = 1 - row / rows;
  const vBot = 1 - (row + 1) / rows;
  const vMid = (vTop + vBot) / 2;
  return half === 'top' ? { u0, u1, v0: vMid, v1: vTop } : { u0, u1, v0: vBot, v1: vMid };
}

// `steps` letters picked by `rand`, none repeating the one before, then back to `final`
export function flickerSequence(final, steps, rand = Math.random) {
  const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const seq = [final];
  for (let i = 0; i < steps; i++) {
    let k = Math.floor(rand() * pool.length) % pool.length;
    if (pool[k] === seq[seq.length - 1]) k = (k + 1) % pool.length;
    seq.push(pool[k]);
  }
  if (seq[seq.length - 1] !== final) seq.push(final);
  return seq;
}

// what a tile shows at `now` while it runs through `seq`, one turn every `turnMs` from `start`:
// the letter it is leaving, the letter it is turning to, and how far through the turn it is
export function tileState(seq, start, turnMs, now) {
  const turns = seq.length - 1;
  if (turns <= 0) return { from: seq[0], to: seq[0], t: 1, done: true };
  if (now <= start) return { from: seq[0], to: seq[0], t: 0, done: false };
  const k = Math.floor((now - start) / turnMs);
  if (k >= turns) return { from: seq[turns], to: seq[turns], t: 1, done: true };
  return { from: seq[k], to: seq[k + 1], t: (now - start - k * turnMs) / turnMs, done: false };
}

// what a tile shows when a scroll position x (0..1) is turning it through `seq`: scrolling back turns it back
export function scrubState(seq, x) {
  const turns = seq.length - 1;
  if (x <= 0 || turns <= 0) return { from: seq[0], to: seq[0], t: 1, done: true };
  if (x >= 1) return { from: seq[turns], to: seq[turns], t: 1, done: true };
  const pos = x * turns, k = Math.floor(pos);
  return { from: seq[k], to: seq[k + 1], t: pos - k, done: false };
}

// a blank, then `steps` letters from a seeded flicker, then the letter: the same for the same seed
export function scrubSeq(final, steps, seed) {
  return [' ', ...flickerSequence(final, steps, mulberry32(seed)).slice(1)];
}

// tile centres for rows of text. Tiles are 1 wide and `tileH` tall, `gap` apart; a space is a wider gap.
// Rows are centred; size includes `pad` all round.
export function layoutRows(rows, { tileH = 1.37, gap = 0.09, wordGap = 0.55, rowGap = 0.28, pad = 0.2 } = {}) {
  const placed = rows.map((r) => {
    let x = 0;
    const xs = [];
    for (const ch of r.text) {
      if (ch === ' ') { x += wordGap - gap; continue; }
      xs.push({ ch, x: x + 0.5 });
      x += 1 + gap;
    }
    return { xs, width: x - gap, color: r.color || 'white' };
  });
  const n = rows.length;
  const totalH = n * tileH + (n - 1) * rowGap;
  const tiles = [];
  placed.forEach((r, row) => {
    const y = totalH / 2 - tileH / 2 - row * (tileH + rowGap);
    for (const t of r.xs) tiles.push({ ch: t.ch, x: t.x - r.width / 2, y, color: r.color, row });
  });
  const w = Math.max(...placed.map((r) => r.width));
  return { tiles, size: { w: w + 2 * pad, h: totalH + 2 * pad } };
}
