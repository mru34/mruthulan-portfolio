// Smoothness: scrolls the homepage top to bottom with the CPU slowed 4x and counts slow frames (over 33 ms).
// Uses the real GPU, so a Chrome window opens. Serve the site on :8000, then: npm run perf -- desk|phone
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const form = process.argv[2] || 'desk';
const [w, h, dpr, mobile] = form === 'phone' ? [390, 844, 3, true] : [1440, 900, 1, false];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, defaultViewport: null, args: [`--window-size=${w + 40},${h + 160}`] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle0' });
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluate(() => {
  window.__dt = [];
  let last = performance.now();
  const tick = (t) => { window.__dt.push(t - last); last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let y = 0; y < total; y += 100) {
  await page.evaluate(() => scrollBy(0, 100));
  await new Promise((r) => setTimeout(r, 40));
}
const dts = await page.evaluate(() => window.__dt.slice(10));
const slow = dts.filter((d) => d > 33).length;
const frozen = await page.evaluate(() => document.documentElement.classList.contains('frozen'));
const pct = (100 * slow) / dts.length;
console.log(`${form}: ${dts.length} frames, ${slow} slow (${pct.toFixed(1)}%)${frozen ? ', and it switched to stills' : ''}`);
await browser.close();
process.exit(pct < 5 || frozen ? 0 : 1);
