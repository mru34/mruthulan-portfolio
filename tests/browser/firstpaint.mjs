// First paint (largest contentful paint) of this branch (:8000) and of main (:8001), each five times cold,
// with a 4x slower CPU and a slow 4G connection. Serve main from a worktree on :8001 first (see the plan).
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function lcp(url) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.evaluateOnNewDocument(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const v = await page.evaluate(() => window.__lcp);
  await ctx.close();
  return v;
}
const median = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
const runs = async (url) => { const out = []; for (let i = 0; i < 5; i++) out.push(await lcp(url)); return median(out); };
const branch = await runs('http://127.0.0.1:8000/');
const main = await runs('http://127.0.0.1:8001/');
console.log(`first paint (LCP, median of 5): this branch ${branch.toFixed(0)} ms, main ${main.toFixed(0)} ms`);
await browser.close();
process.exit(branch <= main + 50 ? 0 : 1);
