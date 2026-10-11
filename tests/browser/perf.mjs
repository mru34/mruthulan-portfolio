// Smoothness with real input: a real mouse wheel (desktop) or real touch swipes (phone), the CPU slowed 4x,
// the real GPU (a Chrome window opens). Fails on slow frames (over 33 ms), on steps in the scroll speed (jerk:
// how much the per-frame scroll distance changes from one frame to the next), or on any frame whose 3D used a
// different scroll value from the page. Serve the site on :8000, then: npm run perf -- desk|phone [smooth=off]
// (smooth=off turns Lenis off, to see what the browser's own wheel scrolling measures.)
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const form = process.argv[2] || 'desk';
const native = process.argv[3] === 'smooth=off';
// the largest jerk (99th percentile, px per frame per frame) a smooth run may have: 1.5 x the worst p99
// measured with Lenis (18-27 px over three runs, 11 Oct 2026); the browser's own wheel scrolling measures 100
const JERK_MAX = Number(process.env.JERK_MAX || 41);
const [w, h, dpr, mobile] = form === 'phone' ? [390, 844, 3, true] : [1440, 900, 1, false];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, defaultViewport: null, args: [`--window-size=${w + 40},${h + 160}`] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
await page.goto(`${BASE}?debug=frames${native ? '&smooth=off' : ''}`, { waitUntil: 'networkidle0' });
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluate(() => {
  window.__log = [];
  let last = performance.now();
  const tick = (t) => { window.__log.push([t - last, scrollY]); last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const bottom = () => page.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 2);
for (let i = 0; i < 2000 && !(await bottom()); i++) {
  if (mobile) {
    // a real finger swipe (touch events, with the phone's own fling after it); Chrome's synthetic touch
    // scroll gesture does not move the page under device emulation, so the swipe is drawn point by point
    await page.touchscreen.touchStart(195, 650);
    for (let k = 1; k <= 10; k++) { await page.touchscreen.touchMove(195, 650 - k * 50); await new Promise((r) => setTimeout(r, 16)); }
    await page.touchscreen.touchEnd();
    await new Promise((r) => setTimeout(r, 400));
  } else {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: 100 });
    await new Promise((r) => setTimeout(r, 50));
  }
}
await new Promise((r) => setTimeout(r, 1500));
const { log, frames, frozen } = await page.evaluate(() => ({
  log: window.__log.slice(10), frames: window.__frames || [], frozen: document.documentElement.classList.contains('frozen'),
}));
const slow = log.filter(([dt]) => dt > 33).length;
const v = log.map(([, y], i) => (i ? y - log[i - 1][1] : 0));
const raw = v.map((d, i) => (i > 1 ? Math.abs(d - v[i - 1]) : 0));
const worst = raw.indexOf(Math.max(...raw));
const around = log.slice(Math.max(0, worst - 4), worst + 3).map(([dt, y]) => `${Math.round(y)}@${dt.toFixed(0)}ms`).join(' ');
const jerk = [...raw].sort((a, b) => a - b);
const p99 = jerk[Math.floor(jerk.length * 0.99)] || 0;
const mismatched = frames.filter(([, y, used]) => y !== used).length;
const pct = (100 * slow) / log.length;
console.log(`${form}${native ? ' (native)' : ''}: ${log.length} frames, ${pct.toFixed(1)}% slow, jerk p99 ${p99.toFixed(1)} px, `
  + `max ${(jerk.at(-1) || 0).toFixed(1)} px (around: ${around}), ${mismatched} out-of-sync frames of ${frames.length}${frozen ? ', ended on stills' : ''}`);
await browser.close();
const ok = (pct < 5 || frozen) && mismatched === 0 && (native || mobile || !JERK_MAX || p99 <= JERK_MAX);
process.exit(ok ? 0 : 1);
