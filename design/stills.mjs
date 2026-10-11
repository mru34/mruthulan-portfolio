// Stills of the 3D, rendered from the real scene: the hero's first paint, and what every visitor without the
// live 3D sees. Serve the site on :8000 first, then: npm run stills -- hero signalbridge
// The boards (hero, ending) are their [data-anchor] box, transparent around the board, at 2x. A chapter is the
// whole screen at its payoff, on the page's own dark background, at 2x (sharp on a high-density screen).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const OUT = fileURLToPath(new URL('../assets/3d/stills/', import.meta.url));
const FORMS = [['desk', 1440, 900], ['phone', 390, 844]];
const BOARDS = { hero: '.hero', ending: '#contact' };
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['hero'];
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
let failed = false;
for (const scene of scenes) {
  for (const [form, w, h] of FORMS) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    const board = BOARDS[scene];
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(`${BASE}?pose=${scene}&mode=3d`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(`html[data-posed="${scene}"]`, { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 300));
    const file = `${OUT}${scene}-${form}.webp`;
    if (board) {
      // clip is in page coordinates; capturing only the viewport keeps the 100vh layout as posed
      const clip = await page.$eval(`${board} [data-anchor]`, (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
      });
      await page.screenshot({ path: file, type: 'webp', quality: 88, omitBackground: true, clip, captureBeyondViewport: false });
    } else {
      await page.screenshot({ path: file, type: 'webp', quality: 86 });
    }
    console.log(`wrote ${scene}-${form}.webp  ${fs.statSync(file).size} bytes  ${errors.join(' | ')}`);
    if (errors.length) failed = true;
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
