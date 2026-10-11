// One screenshot of the homepage, for looking at the 3D while building it.
//   node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/hero.png [--size=1440x900]
//        [--at=signalbridge:0.42 | --y=400] [--hover=720,300] [--path=?mode=stills]
// --at=name:t scrolls to chapter-local time t (screens from where the section's top meets the top of the
// screen: -0.4 arriving, 0.42 the payoff) and waits for the scene to be live.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const [w, h] = arg('size', '1440x900').split('x').map(Number);
const out = arg('out', '../portfolio-tools/shots3d/shot.png');
fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('pageerror', String(e)));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.error(m.type(), m.text()); });
await page.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
await page.goto(BASE + arg('path', ''), { waitUntil: 'networkidle0' });
const at = arg('at', '');
if (at) {
  const [scene, t] = at.split(':');
  await page.evaluate((scene, t) => {
    const s = document.querySelector(`[data-scene="${scene}"]`);
    scrollTo({ top: s.getBoundingClientRect().top + scrollY + Number(t) * innerHeight, behavior: 'instant' });
  }, scene, t);
  await page.waitForSelector(`[data-scene="${scene}"][data-live]`, { timeout: 30000 }).catch(() => console.error('not live'));
}
const y = arg('y', '');
if (y) await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Number(y));
const hover = arg('hover', '');
if (hover) { const [x, y] = hover.split(',').map(Number); await page.mouse.move(x, y); }
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: out });
console.log('wrote', out);
await browser.close();
