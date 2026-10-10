// Stills of the 3D, rendered from the real scene: the hero's first paint, and what every visitor without the
// live 3D sees. Serve the site on :8000 first, then: npm run stills -- hero signalbridge
// Each still is the scene's [data-anchor] box, transparent around the object, at 2x.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const OUT = fileURLToPath(new URL('../assets/3d/stills/', import.meta.url));
const FORMS = [['desk', 1440, 900], ['phone', 390, 844]];
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['hero'];
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
let failed = false;
for (const scene of scenes) {
  for (const [form, w, h] of FORMS) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(`${BASE}?pose=${scene}&mode=3d`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(`html[data-posed="${scene}"]`, { timeout: 30000 });
    // clip is in page coordinates; capturing only the viewport keeps the 100vh layout as posed
    const clip = await page.$eval(`[data-scene="${scene}"] [data-anchor]`, (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
    });
    const file = `${OUT}${scene}-${form}.webp`;
    await page.screenshot({ path: file, type: 'webp', quality: 82, omitBackground: true, clip, captureBeyondViewport: false });
    console.log(`wrote ${scene}-${form}.webp  ${fs.statSync(file).size} bytes  ${errors.join(' | ')}`);
    if (errors.length) failed = true;
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
