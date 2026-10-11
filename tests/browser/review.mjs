// A scroll recording of the homepage, for review: frames taken while the page is scrolled from one place to
// another, put together as an animated WebP (by Pillow). Serve the site on :8000 first, then:
//   node tests/browser/review.mjs --from=0 --to=signalbridge:0.9 --out=../portfolio-tools/review-v2/early-desk.webp
//        [--size=1440x900] [--frames=60] [--ms=90]
// A place is a number of screens from the top (0), a chapter-local time (signalbridge:0.42), or `end`.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const [w, h] = arg('size', '1440x900').split('x').map(Number);
const frames = Number(arg('frames', '60'));
const out = arg('out', '../portfolio-tools/review-v2/recording.webp');
const dir = `${out}.frames`;
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle0' });
const place = (p) => page.evaluate((p) => {
  if (p === 'end') return document.documentElement.scrollHeight - innerHeight;
  if (!p.includes(':')) return Number(p) * innerHeight;
  const [scene, t] = p.split(':');
  const s = document.querySelector(`[data-scene="${scene}"]`);
  return s.getBoundingClientRect().top + scrollY + Number(t) * innerHeight;
}, p);
const [y0, y1] = [await place(arg('from', '0')), await place(arg('to', 'end'))];
for (let i = 0; i < frames; i++) {
  const t = i / (frames - 1);
  const y = y0 + (y1 - y0) * (t * t * (3 - 2 * t));   // eases in and out, like a hand on a wheel
  await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y);
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: path.join(dir, `${String(i).padStart(3, '0')}.png`) });
}
await browser.close();
execFileSync('python', ['-c', `
import sys, glob
from PIL import Image
files = sorted(glob.glob(sys.argv[1] + '/*.png'))
ims = [Image.open(f).convert('RGB') for f in files]
w = int(sys.argv[4])
ims = [im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) for im in ims]
ims[0].save(sys.argv[2], save_all=True, append_images=ims[1:], duration=int(sys.argv[3]), loop=0, quality=72, method=4)
`, dir, out, arg('ms', '90'), String(Math.min(w, 960))], { stdio: 'inherit' });
fs.rmSync(dir, { recursive: true, force: true });
console.log('wrote', out, fs.statSync(out).size, 'bytes');
