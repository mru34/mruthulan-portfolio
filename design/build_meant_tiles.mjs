// MEANT's word tiles and reply cards for the 3D café table, drawn the way MEANT draws them.
//   node design/build_meant_tiles.mjs        (then python design/build_3d_assets.py)
//
// Everything comes from the MEANT repository next to this one (../meant-DellInnovateFest/meant/web):
// the words are MEANT's own boards (vocab-core.ts), each tile's colour is its word class (board-colour.ts,
// with the hues of shell/tokens.ts), and each picture is the one MEANT's resolver picks (symbols.tsx: the
// core mapping, then its aliases, then a Mulberry file named after the exact word, never one it suppresses).
// A word MEANT draws without a picture is drawn here without one. The reply cards carry the pictures the
// ranked cards showed on the tablet (meant-shot-1): chicken, chicken, rice, duck. The tiles are drawn in the
// look of MEANT's word board (meant-shot-3): the word class's hue, a 4 px ink edge, the picture in a pale
// well, the word in MEANT's Inter 800.
//
// Chrome renders them (the symbols are SVG) and saves PNGs to ../portfolio-tools/card-shots/raw/mt/, which
// build_3d_assets.py turns into assets/3d/mt-words.webp and mt-reply-*.webp.
// Mulberry Symbols © Steve Lee, licensed under CC BY-SA 4.0 — mulberrysymbols.org
import puppeteer from 'puppeteer-core';
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.resolve(ROOT, '..', 'meant-DellInnovateFest', 'meant', 'web');
const SRC = path.join(WEB, 'src');
const OUT = path.resolve(ROOT, '..', 'portfolio-tools', 'card-shots', 'raw', 'mt');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// The tiles in the atlas, in order: MEANT's core board's first three rows as they stand on the board, then
// the words a hawker-centre order reaches for, each from the board it sits on. Must match WORDS in
// js/3d/chapters/meant.js (cols x rows, cell size; tested).
export const TILES = [
  ...['I', 'you', 'he', 'she', 'it', 'my', 'mine', 'me',
    'want', 'need', 'like', 'feel', 'get', 'go', 'do', 'make',
    'help', 'look', 'put', 'open', 'stop', 'turn', 'say', 'know',
    'yes', 'no', 'more', 'what', 'where', 'good', 'please', 'wait'].map((w) => [w, 'core']),
  ['chicken rice', 'food'], ['duck rice', 'food'], ['rice', 'food'], ['noodles', 'food'],
  ['kopi', 'food'], ['water', 'food'], ['take away', 'food'], ['eat here', 'food'],
  ['eat', 'actions'], ['drink', 'actions'], ['pay', 'actions'], ['hungry', 'feelings'],
  ['thirsty', 'feelings'], ['happy', 'feelings'], ['toilet', 'places'], ['money', 'things'],
];
export const ATLAS = { cols: 8, rows: 6, w: 256, h: 214 };
const REPLIES = [['Roasted chicken rice', 'chicken'], ['Steamed chicken rice', 'chicken'], ['Char siew rice', 'rice'], ['Duck rice', 'duck']];
const REPLY = { w: 640, h: 296 };
const INK = '#17181c';

// MEANT's pure modules, compiled from its TypeScript as they are
async function tsModule(file) {
  const { code } = await esbuild.transform(fs.readFileSync(path.join(SRC, file), 'utf8'), { loader: 'ts', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
// one object or Set literal out of a module that cannot be imported here (it needs Preact or the settings)
function literal(file, start) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8');
  const at = src.indexOf(start);
  if (at < 0) throw new Error(`${start} not found in ${file}`);
  let i = src.indexOf(start.endsWith('(') ? '(' : '{', at + start.length - 1), depth = 0, j = i;
  for (; j < src.length; j++) {
    const ch = src[j];
    if ('({['.includes(ch)) depth++;
    if (')}]'.includes(ch) && --depth === 0) break;
  }
  return src.slice(i, j + 1);
}

const vocab = await tsModule('vocab-core.ts');
const colour = await tsModule('board-colour.ts');
const ALIASES = Function(`return ${literal('symbols.tsx', 'export const WORD_ALIASES: Readonly<Record<string, string>> =')}`)();
const TOO_FINE = Function(`return new Set${literal('symbols.tsx', 'const TOO_FINE_AT_BUTTON_SIZE: ReadonlySet<string> = new Set(')}`)();
const NOT_A_PICTURE = Function(`return new Set${literal('symbols.tsx', 'const NOT_A_PICTURE_OF_THE_WORD: ReadonlySet<string> = new Set(')}`)();
const { WORD_SHARD } = await tsModule('symbol-words.generated.ts');

// the hue of each word class: board-colour.ts names a token, shell/tokens.ts gives its value
const tokens = fs.readFileSync(path.join(SRC, 'shell', 'tokens.ts'), 'utf8');
const ROLE = Object.fromEntries([...literal('shell/tokens.ts', 'export const ROLE =').matchAll(/^\s*(\w+):\s*"(#[0-9a-f]{6})"/gim)].map((m) => [m[1], m[2]]));
function hue(token) {
  const m = new RegExp(`^\\s*${token}:\\s*(?:ROLE\\.(\\w+)|"(#[0-9a-f]{6})")`, 'im').exec(tokens);
  if (!m) throw new Error(`no colour for ${token}`);
  return m[2] || ROLE[m[1]];
}

// symbols.tsx's resolver: the first id that is drawable wins, and a suppressed one never is
const wordKey = (w) => w.trim().toLowerCase().replace(/\s+/g, ' ');
const idFor = (w) => wordKey(w).replace(/ /g, '_');
const CORE_BY_KEY = Object.fromEntries(Object.entries(vocab.CORE_SYMBOLS).map(([w, id]) => [wordKey(w), id]));
const sprite = fs.readFileSync(path.join(WEB, 'public', 'symbols', 'mulberry.svg'), 'utf8');
const shard = (n) => fs.readFileSync(path.join(WEB, 'public', 'symbols', 'shards', `${String(n).padStart(3, '0')}.svg`), 'utf8');
function symbolEl(svg, id) {
  const m = new RegExp(`<symbol id="sym-${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?</symbol>`).exec(svg);
  return m ? m[0] : null;
}
function symbolFor(word) {
  const key = wordKey(word);
  const ids = [];
  if (CORE_BY_KEY[key]) ids.push(CORE_BY_KEY[key]);
  if (ALIASES[key]) ids.push(idFor(ALIASES[key]));
  ids.push(idFor(key));
  for (const id of ids) {
    if (TOO_FINE.has(id) || NOT_A_PICTURE.has(id)) continue;
    const inSprite = symbolEl(sprite, id);
    if (inSprite) return { id, el: inSprite };
    const word = id.replace(/_/g, ' ');
    if (WORD_SHARD[word] !== undefined) {
      const el = symbolEl(shard(WORD_SHARD[word]), id);
      if (el) return { id, el };
    }
  }
  return null;
}

const boardWords = (id) => (id === 'core' ? vocab.CORE_BOARD : vocab.FRINGE_BOARDS.find((b) => b.id === id).words);
const tiles = TILES.map(([word, board]) => {
  if (!boardWords(board).includes(word)) throw new Error(`"${word}" is not on MEANT's ${board} board`);
  const fill = hue(colour.BOARD_FAMILY_HUE[colour.boardFamily(word, board)]);
  return { word, fill, well: mix(fill, 0.6), symbol: symbolFor(word) };
});
const replies = REPLIES.map(([text, id]) => ({ text, symbol: { id, el: symbolEl(sprite, id) } }));
if (replies.some((r) => !r.symbol.el)) throw new Error('a reply symbol is missing from the sprite');
if (tiles.length !== ATLAS.cols * ATLAS.rows) throw new Error(`${tiles.length} tiles for a ${ATLAS.cols} x ${ATLAS.rows} atlas`);

// a hue mixed toward white, as MEANT tints a symbol's well
function mix(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const font = pathToFileURL(path.join(SRC, 'assets', 'fonts', 'inter-latin-800-normal.woff2')).href;
const defs = [...new Map([...tiles, ...replies].filter((t) => t.symbol).map((t) => [t.symbol.id, t.symbol.el])).values()].join('');
const use = (id) => `<svg viewBox="0 0 10 10"><use href="#sym-${id}"/></svg>`;
const { w: TW, h: TH } = ATLAS;
// the face fills its cell; outside the rounded corner is ink, the colour of the 3D tile's edge
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Inter;font-weight:800;src:url("${font}") format("woff2")}
*{box-sizing:border-box;margin:0}
body{background:transparent;font-family:Inter;font-weight:800;color:${INK}}
#atlas{display:grid;grid-template-columns:repeat(${ATLAS.cols},${TW}px);grid-auto-rows:${TH}px;width:${ATLAS.cols * TW}px;background:${INK}}
.t{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:7px solid ${INK};border-radius:30px;padding:8px 12px;text-align:center;font-size:36px;line-height:1.02}
.t.plain{font-size:42px}
.well{width:104px;height:104px;flex:none;border-radius:50%;border:4px solid ${INK};display:grid;place-items:center}
.well svg{width:74px;height:74px;overflow:visible}
#replies{display:flex;flex-direction:column;width:${REPLY.w}px}
.r{width:${REPLY.w}px;height:${REPLY.h}px;background:${INK};display:flex}
.r>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#fff;border:8px solid ${INK};border-radius:53px;font-size:56px;letter-spacing:-.01em}
.r svg{width:96px;height:96px}
svg symbol{overflow:visible}
</style>
<svg width="0" height="0" style="position:absolute">${defs}</svg>
<div id="atlas">${tiles.map((t) => t.symbol
    ? `<div class="t" style="background:${t.fill}"><div class="well" style="background:${t.well}">${use(t.symbol.id)}</div>${t.word}</div>`
    : `<div class="t plain" style="background:${t.fill}">${t.word}</div>`).join('')}</div>
<div id="replies">${replies.map((r) => `<div class="r"><div>${use(r.symbol.id)}${r.text}</div></div>`).join('')}</div>`;

fs.mkdirSync(OUT, { recursive: true });
const page_ = path.join(OUT, 'tiles.html');
fs.writeFileSync(page_, html);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: ATLAS.cols * TW, height: 1000, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(page_).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
// each <use> needs the symbol's own viewBox; the sprite's <symbol> carries it, so the outer svg is just a box
await page.evaluate(() => document.querySelectorAll('svg use').forEach((u) => {
  const s = document.querySelector(u.getAttribute('href'));
  u.parentElement.setAttribute('viewBox', s.getAttribute('viewBox'));
}));
const shoot = async (sel, file) => {
  const el = await page.$(sel);
  await el.screenshot({ path: path.join(OUT, file), omitBackground: true });
  console.log('wrote', path.join('mt', file));
};
await shoot('#atlas', 'words.png');
const rs = await page.$$('.r');
for (let i = 0; i < rs.length; i++) {
  await rs[i].screenshot({ path: path.join(OUT, `reply-${i + 1}.png`) });
  console.log('wrote', `mt/reply-${i + 1}.png`);
}
await browser.close();
console.log(tiles.map((t) => `${t.word}${t.symbol ? ` (${t.symbol.id})` : ''}`).join(' · '));
