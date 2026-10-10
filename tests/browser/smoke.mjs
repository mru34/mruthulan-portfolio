// The homepage as visitors get it. Serve the site first (python -m http.server 8000), then: npm run smoke
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8000/';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const failures = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(ok, label) { console.log(`  ${ok ? '✓' : '✗'} ${label}`); if (!ok) failures.push(label); }

async function open({ w = 1440, h = 900, js = true, reduced = false, path = '', block = null } = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (block) {
    await page.setRequestInterception(true);
    page.on('request', (r) => (r.url().includes(block) ? r.abort() : r.continue()));
  }
  await page.setJavaScriptEnabled(js);
  await page.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  return { page, errors };
}

// every piece of a chapter's information block is showing (not hidden, not transparent)
async function infoVisible(page, pid) {
  return page.$eval(`#ch-${pid}`, (h) => [...h.closest('.info').children].every((el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.99;
  }));
}
const PIDS = ['sb', 'bx', 'bb', 'mt', 'kc'];

const SCENARIOS = [];
const scenario = (name, fn) => SCENARIOS.push([name, fn]);

/* ------------------------------------------------------------------ scenarios (later tasks add below) */

scenario('without JavaScript, everything is there', async () => {
  const { page } = await open({ js: false });
  check(await page.$$eval('.chapter', (s) => s.length) === 5, 'five chapters');
  for (const pid of PIDS) check(await infoVisible(page, pid), `chapter ${pid}: information visible`);
  check(await page.$$eval('.hero-links a', (a) => a.length) === 3, 'three hero links');
  check(await page.$eval('canvas.stage', (c) => getComputedStyle(c).display === 'none'), 'canvas hidden');
  await page.close();
});

for (const [w, h] of [[1440, 900], [390, 844]]) {
  scenario(`at ${w}px nothing runs off the side`, async () => {
    const { page, errors } = await open({ w, h });
    check(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth), 'no sideways scroll');
    check(errors.length === 0, `no errors ${errors.join(' | ')}`);
    await page.close();
  });
}

scenario('?mode=stills and reduced motion both get the stills', async () => {
  for (const opts of [{ path: '?mode=stills' }, { reduced: true }]) {
    const { page, errors } = await open(opts);
    check(await page.evaluate(() => document.documentElement.classList.contains('stills')), `${JSON.stringify(opts)}: html.stills`);
    for (const pid of PIDS) check(await infoVisible(page, pid), `${JSON.stringify(opts)}: ${pid} visible`);
    check(errors.length === 0, `no errors ${errors.join(' | ')}`);
    await page.close();
  }
});

scenario('live: tall pinned chapters and a stage', async () => {
  const { page, errors } = await open();
  check(await page.evaluate(() => document.documentElement.classList.contains('has-3d')), 'html.has-3d');
  check(await page.$eval('.chapter', (c) => Math.abs(c.offsetHeight - 2.5 * innerHeight) < 2), 'a chapter is 250vh');
  check(await page.$eval('canvas.stage', (c) => getComputedStyle(c).display === 'block'), 'canvas showing');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('a link lands on the payoff pose', async () => {
  for (const hash of ['#work-bx', '#work']) {
    const { page } = await open({ path: hash });
    await sleep(600);
    const pid = hash === '#work' ? 'sb' : 'bx';
    check(await infoVisible(page, pid), `${hash}: ${pid} fully visible on arrival`);
    await page.close();
  }
});

scenario('focus shows the whole information block', async () => {
  const { page } = await open();
  await page.evaluate(() => {
    const c = document.querySelectorAll('.chapter')[2];
    scrollTo({ top: c.getBoundingClientRect().top + scrollY + 5, behavior: 'instant' });
  });
  await sleep(300);
  await page.focus('.chapter:nth-of-type(3) .info a.btn');
  await sleep(100);
  const op = await page.$eval('.chapter:nth-of-type(3) .info a.btn', (a) => parseFloat(getComputedStyle(a).opacity));
  check(op > 0.99, `focused Case study link is visible (opacity ${op})`);
  await page.close();
});

scenario('the snap never pulls back', async () => {
  const { page } = await open();
  const y0 = await page.evaluate(() => {
    const c = document.querySelectorAll('.chapter')[1];
    const key = c.getBoundingClientRect().top + scrollY + 0.8 * (c.offsetHeight - innerHeight);
    scrollTo({ top: key + 120, behavior: 'instant' });
    return key + 120;
  });
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(700);
  const y1 = await page.evaluate(() => scrollY);
  check(y1 >= y0, `stayed at or past where the visitor scrolled (${y0} → ${y1})`);
  await page.close();
});

/* ------------------------------------------------------------------ run */
for (const [name, fn] of SCENARIOS) {
  console.log(name);
  try { await fn(); } catch (err) { check(false, `${name}: ${err.message}`); }
}
await browser.close();
console.log(failures.length ? `\n${failures.length} failed` : '\nall passed');
process.exit(failures.length ? 1 : 0);
