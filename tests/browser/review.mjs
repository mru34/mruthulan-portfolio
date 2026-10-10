// The review package: screenshots of each moment and a scroll recording, desk and phone, saved outside the
// repository in ../portfolio-tools/review-gate/. Serve the site on :8000 first.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const OUT = '../portfolio-tools/review-gate/';
fs.mkdirSync(`${OUT}frames`, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const MOMENTS = [['hero', 0], ['fly', 0.5], ['signalbridge', 0.05], ['signalbridge', 0.3], ['signalbridge', 0.45], ['signalbridge', 0.53], ['signalbridge', 0.8]];
const goTo = (page, scene, p) => page.evaluate((scene, p) => {
  const s = document.querySelector(`[data-scene="${scene}"]`);
  scrollTo({ top: s.getBoundingClientRect().top + scrollY + p * Math.max(0, s.offsetHeight - innerHeight), behavior: 'instant' });
}, scene, p);
for (const [form, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.evaluate(() => dispatchEvent(new PointerEvent('pointerdown')));   // hold off the snap
  for (const [scene, p] of MOMENTS) {
    await goTo(page, scene, p);
    await new Promise((r) => setTimeout(r, 1800));
    await page.screenshot({ path: `${OUT}${form}-${scene}-${p}.png` });
  }
  // the scroll recording: 48 frames from the top to SignalBridge's payoff
  const end = await page.evaluate(() => { const s = document.querySelector('[data-scene="signalbridge"]'); return s.getBoundingClientRect().top + scrollY + 0.8 * (s.offsetHeight - innerHeight); });
  for (let i = 0; i < 48; i++) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), (end * i) / 47);
    await new Promise((r) => setTimeout(r, 350));
    await page.screenshot({ path: `${OUT}frames/${form}-${String(i).padStart(2, '0')}.png` });
  }
  await page.close();
}
await browser.close();
console.log('wrote', OUT);
