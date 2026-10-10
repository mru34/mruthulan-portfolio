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

async function open({ w = 1440, h = 900, js = true, reduced = false, path = '', block = null, init = null } = {}) {
  const page = await browser.newPage();
  if (init) await page.evaluateOnNewDocument(init);
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

scenario('the board comes alive in its box', async () => {
  const { page, errors } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  check(true, 'hero board live');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('the board survives the breakpoint', async () => {
  const { page, errors } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await page.setViewport({ width: 700, height: 900 });
  await sleep(1500);
  await page.setViewport({ width: 1200, height: 800 });
  await sleep(1500);
  check(await page.$eval('.hero-board', (b) => b.hasAttribute('data-live')), 'still live after crossing 860px twice');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

// mean difference per channel (0-255) between two PNG screenshots, measured in the page
async function meanDiff(page, a, b) {
  return page.evaluate(async (a, b) => {
    const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const c = new OffscreenCanvas(ia.width, ia.height);
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(ia, 0, 0);
    const da = g.getImageData(0, 0, ia.width, ia.height).data;
    g.clearRect(0, 0, ia.width, ia.height);
    g.drawImage(ib, 0, 0, ia.width, ia.height);
    const db = g.getImageData(0, 0, ia.width, ia.height).data;
    let s = 0;
    for (let i = 0; i < da.length; i += 4) s += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    return s / ((da.length / 4) * 3);
  }, a, b);
}

scenario('the live board takes over from its still without a visible change', async () => {
  const clipOf = (page) => page.$eval('.hero-board', (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  const stills = await open({ path: '?mode=stills' });
  const a = await stills.page.screenshot({ encoding: 'base64', clip: await clipOf(stills.page) });
  const live = await open();
  await live.page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await sleep(300);
  const b = await live.page.screenshot({ encoding: 'base64', clip: await clipOf(live.page) });
  const d = await meanDiff(live.page, a, b);
  check(d < 8, `still and first live frame differ by ${d.toFixed(2)} (under 8)`);
  await stills.page.close();
  await live.page.close();
});

scenario('a scene that fails to load leaves its still', async () => {
  const { page } = await open({ block: '/js/3d/hero.js' });
  await sleep(2500);
  check(!(await page.$eval('.hero-board', (b) => b.hasAttribute('data-live'))), 'hero not marked live');
  check(await page.$eval('.hero-board .still img', (i) => i.complete && i.naturalWidth > 0 && getComputedStyle(i).visibility !== 'hidden'), 'hero still showing');
  await page.close();
});

scenario('SignalBridge comes alive, and its payoff shows everything', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => {
    const s = document.querySelector('[data-scene="signalbridge"]');
    scrollTo({ top: s.getBoundingClientRect().top + scrollY + 0.8 * (s.offsetHeight - innerHeight), behavior: 'instant' });
  });
  await page.waitForSelector('[data-scene="signalbridge"] [data-anchor][data-live]', { timeout: 30000 });
  await sleep(500);
  check(await infoVisible(page, 'sb'), 'SignalBridge information fully visible at the payoff');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('a page opened at #contact has nothing animating by itself', async () => {
  for (const path of ['', '#contact']) {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      window.__anims = [];
      document.addEventListener('animationstart', (e) => window.__anims.push(e.animationName), true);
      try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {}
    });
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE + path, { waitUntil: 'networkidle0' });
    const anims = await page.evaluate(() => window.__anims);
    check(anims.length === 0, `${path || 'top'}: no CSS animation started on arrival (${anims.slice(0, 3).join(', ')})`);
    await page.close();
  }
});

scenario('the header logo shows when it has keyboard focus, and without JavaScript once scrolled', async () => {
  const { page } = await open();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await sleep(400);
  const focused = await page.evaluate(() => { const a = document.activeElement; return a.classList.contains('logo') ? parseFloat(getComputedStyle(a).opacity) : -1; });
  check(focused > 0.99, `focused logo is visible (opacity ${focused})`);
  await page.close();
  const nojs = await open({ js: false });
  await nojs.page.evaluate(() => scrollTo(0, 1500));
  await sleep(400);
  const op = await nojs.page.$eval('.top .logo', (l) => parseFloat(getComputedStyle(l).opacity));
  check(op > 0.99, `without JavaScript the scrolled logo is visible (opacity ${op})`);
  await nojs.page.close();
});

scenario('a link lands exactly on the payoff pose and stays there', async () => {
  for (const [w, h] of [[1440, 900], [844, 390]]) {
    // count the page's own glides (the snap scrolls smoothly); landing by link must need none
    const init = () => {
      window.__glides = 0;
      const to = window.scrollTo;
      window.scrollTo = function (o, ...rest) { if (o && o.behavior === 'smooth') window.__glides += 1; return to.call(this, o, ...rest); };
    };
    const { page } = await open({ w, h, path: '#work-bx', init });
    const at = () => page.evaluate(() => {
      const c = document.querySelectorAll('.chapter')[1];
      const key = c.getBoundingClientRect().top + scrollY + 0.8 * (c.offsetHeight - innerHeight);
      return Math.round(scrollY - key);
    });
    const off1 = await at();
    check(Math.abs(off1) <= 2 && (await infoVisible(page, 'bx')), `${w}x${h}: on arrival ${off1}px from the pose, everything visible`);
    await sleep(2500);
    const off2 = await at();
    check(Math.abs(off2) <= 2, `${w}x${h}: still on the pose 2.5 s later (${off2}px)`);
    const glides = await page.evaluate(() => window.__glides);
    check(glides === 0, `${w}x${h}: the page did not glide by itself (${glides} glides)`);
    await page.close();
  }
});

scenario('slow frames while scrolling switch to the stills', async () => {
  const { page } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
  await page.evaluate(() => dispatchEvent(new PointerEvent('pointerdown')));   // hold off the snap
  const end = Date.now() + 9000;
  while (Date.now() < end && !(await page.evaluate(() => document.documentElement.classList.contains('frozen')))) {
    await page.evaluate(() => scrollBy(0, 40));
    await sleep(50);
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  check(await page.evaluate(() => document.documentElement.classList.contains('frozen')), 'html.frozen after slow scrolling');
  await page.close();
});

scenario('crossing the breakpoint does not leak GPU memory', async () => {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    const n = (window.__gl = { tex: 0, buf: 0 });
    const P = WebGL2RenderingContext.prototype;
    for (const [make, drop, k] of [['createTexture', 'deleteTexture', 'tex'], ['createBuffer', 'deleteBuffer', 'buf']]) {
      const mk = P[make], dr = P[drop];
      P[make] = function (...a) { n[k] += 1; return mk.apply(this, a); };
      P[drop] = function (...a) { if (a[0]) n[k] -= 1; return dr.apply(this, a); };
    }
    try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {}
  });
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await page.setViewport({ width: 700, height: 900 });
  await sleep(1500);
  await page.setViewport({ width: 1200, height: 800 });
  await sleep(1500);
  const before = await page.evaluate(() => ({ ...window.__gl }));
  for (let i = 0; i < 3; i++) {
    await page.setViewport({ width: 700, height: 900 });
    await sleep(1500);
    await page.setViewport({ width: 1200, height: 800 });
    await sleep(1500);
  }
  const after = await page.evaluate(() => ({ ...window.__gl }));
  check(after.tex - before.tex <= 1 && after.buf - before.buf <= 10,
    `six more crossings: +${after.tex - before.tex} textures, +${after.buf - before.buf} buffers alive`);
  await page.close();
});

scenario('a finger resting on the screen is never moved by the snap', async () => {
  const { page } = await open({ w: 390, h: 844 });
  const y0 = await page.evaluate(() => {
    const c = document.querySelectorAll('.chapter')[1];
    const key = c.getBoundingClientRect().top + scrollY + 0.8 * (c.offsetHeight - innerHeight);
    scrollTo({ top: key - 200, behavior: 'instant' });
    return key - 200;
  });
  await page.touchscreen.touchStart(200, 400);
  // a browser cancels the pointer as soon as a touch starts to pan; the finger is still down
  await page.evaluate(() => dispatchEvent(new PointerEvent('pointercancel', { pointerType: 'touch' })));
  await page.evaluate(() => scrollBy(0, 10));
  await sleep(600);
  const y1 = await page.evaluate(() => scrollY);
  check(Math.abs(y1 - (y0 + 10)) <= 2, `page stayed under the finger (${y0 + 10} → ${y1})`);
  await page.touchscreen.touchEnd();
  await page.close();
});

/* ------------------------------------------------------------------ run */
const ONLY = process.env.ONLY;   // run just the scenarios whose name contains this text
for (const [name, fn] of SCENARIOS) {
  if (ONLY && !name.includes(ONLY)) continue;
  console.log(name);
  try { await fn(); } catch (err) { check(false, `${name}: ${err.message}`); }
}
await browser.close();
console.log(failures.length ? `\n${failures.length} failed` : '\nall passed');
process.exit(failures.length ? 1 : 0);
