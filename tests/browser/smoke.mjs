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

// software rendering (SwiftShader) is slow in the chapters' rooms, so the frame watchdog would rightly send
// those pages to the stills; it is off unless a scenario is about the watchdog itself
async function open({ w = 1440, h = 900, js = true, reduced = false, path = '', block = null, init = null, watchdog = false } = {}) {
  const page = await browser.newPage();
  if (!watchdog) await page.evaluateOnNewDocument(() => { window.__noWatchdog = true; });
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

// the five pieces of a chapter's information block are showing (not hidden, not transparent); a chapter's own
// extras (Attack, the replies) are only there with the live 3D
async function infoVisible(page, pid) {
  return page.$eval(`#ch-${pid}`, (h) => [...h.closest('.info').querySelectorAll(':scope > :is(.ch-num, .ch-name, .ch-line, .ch-res, a.btn)')].every((el) => {
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

scenario('at 390px the words of every chapter fit the screen', async () => {
  const { page } = await open({ w: 390, h: 844, path: '?mode=stills' });
  const over = await page.$$eval('.chapter .info', (infos) => infos.flatMap((info) =>
    [...info.querySelectorAll(':scope > *')].filter((el) => el.getBoundingClientRect().width && el.getBoundingClientRect().right > innerWidth + 1)
      .map((el) => `${info.closest('.chapter').dataset.scene} ${el.className || el.tagName} ${Math.round(el.getBoundingClientRect().right)}`)));
  check(over.length === 0, `nothing runs past the right edge (${over.join(', ')})`);
  await page.close();
});

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
  check(await page.$eval('.chapter', (c) => Math.abs(c.offsetHeight - 1.6 * innerHeight) < 2), 'a chapter is 160svh');
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

scenario('pacing: at most 12 screens, and SignalBridge pays off within 2.5', async () => {
  const { page } = await open();
  const r = await page.evaluate(() => {
    const c = document.querySelector('.chapter'), pin = c.querySelector('.pin');
    return { screens: (document.documentElement.scrollHeight - innerHeight) / innerHeight,
             pay: (c.offsetTop + 0.7 * (c.offsetHeight - pin.offsetHeight)) / innerHeight };
  });
  check(r.screens <= 12, `scroll length ${r.screens.toFixed(2)} screens`);
  check(r.pay <= 2.5, `SignalBridge's result fully shown at ${r.pay.toFixed(2)} screens`);
  await page.close();
});

scenario('the page never moves by itself', async () => {
  const { page } = await open();
  await page.evaluate(() => { const c = document.querySelectorAll('.chapter')[1]; scrollTo({ top: c.offsetTop + 100, behavior: 'instant' }); });
  await sleep(150);
  const y0 = await page.evaluate(() => scrollY);
  await sleep(1200);
  check(await page.evaluate(() => scrollY) === y0, 'still where it was left');
  await page.close();
});

scenario('the wheel glides through Lenis', async () => {
  const { page } = await open();
  await page.mouse.move(720, 450);
  await page.mouse.wheel({ deltaY: 300 });
  await sleep(50);
  check(await page.evaluate(() => window.__lenis?.isScrolling === 'smooth'), 'Lenis is gliding');
  await sleep(1500);
  check(await page.evaluate(() => scrollY) > 250, 'and arrives');
  await page.close();
});

scenario('a header link glides and lands exactly', async () => {
  const { page } = await open();
  await page.click('.nav a[href$="#work"]');
  await sleep(2000);
  const r = await page.evaluate(() => {
    const k = document.getElementById('work');
    return { y: scrollY, want: Math.round(k.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(k).scrollMarginTop) - (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)) };
  });
  check(Math.abs(r.y - r.want) <= 1, `landed at ${r.y}, link points at ${r.want}`);
  await sleep(800);
  check(await page.evaluate(() => scrollY) === r.y, 'and stayed');
  await page.close();
});

scenario('the wheel inside the viewer never scrolls the page', async () => {
  const { page } = await open();
  await page.evaluate(() => document.getElementById('awards').scrollIntoView({ behavior: 'instant' }));
  await sleep(300);
  await page.evaluate(() => document.querySelector('#awards a[data-zoom]').click());
  await sleep(300);
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.move(720, 450);
  await page.mouse.wheel({ deltaY: 400 });
  await sleep(800);
  check(await page.evaluate(() => scrollY) === y0, 'page stayed put behind the viewer');
  await page.close();
});

scenario('Page Down still moves a screen', async () => {
  const { page } = await open();
  // once the page has settled: under software rendering (these tests) a key pressed in the second after the
  // first scenes are built is lost; on a real GPU it scrolls at once (checked headful, 11 Oct 2026)
  await page.waitForSelector('[data-scene="signalbridge"][data-live]', { timeout: 30000 });
  await sleep(1500);
  await page.keyboard.press('PageDown');
  await sleep(900);
  check(await page.evaluate(() => scrollY > innerHeight * 0.6), 'moved down');
  await page.close();
});

scenario('the camera holds the page pose at the top and the board sits in its box', async () => {
  const { page } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await sleep(300);
  const d = await page.evaluate(() => window.__world ? window.__world.debugFit('hero') : null);
  check(d !== null && d <= 1, `hero board within 1px of its box (${d})`);
  await page.close();
});

scenario('resizing mid-chapter keeps the camera on the path', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelectorAll('.chapter')[1]; scrollTo({ top: c.offsetTop + 0.3 * innerHeight, behavior: 'instant' }); });
  await sleep(600);
  await page.setViewport({ width: 900, height: 1000 });
  await sleep(800);
  const r = await page.evaluate(() => window.__world ? window.__world.debugCamera() : { ok: false, why: 'no world' });
  check(r.ok, `camera matches the path after resize (${JSON.stringify(r)})`);
  check(errors.filter((e) => !e.includes('did not load')).length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('End then Home frees what it built', async () => {
  const { page, errors } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await sleep(1500);
  // free every scene, then read what is left on the GPU in the same breath (no frame can build one between):
  // only the shared things (environment, flap atlases, glow) should remain, the same amount every time
  const counts = () => page.evaluate(() => { if (!window.__world) return null; window.__world.freeAll(); return window.__world.counts(); });
  const base = await counts();
  for (let n = 0; n < 2; n++) {
    await page.keyboard.press('End'); await sleep(3000);
    await page.keyboard.press('Home'); await sleep(3000);
  }
  const after = await counts();
  check(base && after && after.textures === base.textures && after.geometries === base.geometries,
    `GPU memory back to start (${JSON.stringify(base)} → ${JSON.stringify(after)})`);
  check(errors.filter((e) => !e.includes('did not load')).length === 0, `no errors ${errors.join(' | ')}`);
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
async function meanDiff(page, a, b, typeB = 'png') {
  return page.evaluate(async (a, b, typeB) => {
    const load = (src, type) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = `data:image/${type};base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a, 'png'), load(b, typeB)]);
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
  }, a, b, typeB);
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
  await page.waitForSelector('[data-scene="signalbridge"][data-live]', { timeout: 30000 });
  await sleep(500);
  check(await infoVisible(page, 'sb'), 'SignalBridge information fully visible at the payoff');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

// a chapter's still (design/stills.mjs) is the live scene at its payoff: the visitor without the 3D sees the same
for (const scene of ['signalbridge', 'boss-breaker', 'better-call-bhai', 'meant', 'knowcad']) {
  scenario(`${scene}: the still matches the live payoff`, async () => {
    const at = (page) => page.evaluate((scene) => {
      const s = document.querySelector(`[data-scene="${scene}"]`);
      scrollTo({ top: s.getBoundingClientRect().top + scrollY + 0.5 * innerHeight, behavior: 'instant' });
    }, scene);
    const live = await open();
    await at(live.page);
    await live.page.waitForSelector(`[data-scene="${scene}"][data-live]`, { timeout: 30000 });
    await sleep(800);
    const hide = (page) => page.addStyleTag({ content: 'body > :not(.stage){visibility:hidden!important}' });
    await hide(live.page);
    const b = await live.page.screenshot({ encoding: 'base64' });
    const stills = await open({ path: '?mode=stills' });
    const a = await stills.page.evaluate(async (scene) => {
      const img = document.querySelector(`[data-scene="${scene}"] .still img`);
      const r = await fetch(img.currentSrc || img.src); const blob = await r.blob();
      return await new Promise((res) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(',')[1]); f.readAsDataURL(blob); });
    }, scene);
    const d = await meanDiff(live.page, b, a, 'webp');
    check(d < 2, `still and live payoff differ by ${d.toFixed(2)} (under 2)`);
    await live.page.close();
    await stills.page.close();
  });
}

scenario('Boss Breaker: attack to defeat, and it resets above the chapter', async () => {
  const { page, errors } = await open();
  const go = () => page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await go();
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  await sleep(500);
  const hp = () => page.$eval('[data-hp]', (e) => e.textContent);
  check(await hp() === '1,840', `HP matches the capture at the payoff (${await hp()})`);
  await page.click('[data-attack]');
  await page.waitForFunction(() => document.querySelector('[data-hp]').textContent === '1,490', { timeout: 5000 }).catch(() => {});   // the next frame
  check(await hp() === '1,490', `a hit takes 350 (${await hp()})`);
  check(await page.$eval('[data-hp-live]', (e) => e.textContent) === 'Stress Dragon: 1,490 HP', 'the HP is announced');
  for (let i = 0; i < 6; i++) { await page.click('[data-attack]'); await sleep(80); }
  await sleep(400);
  check(await hp() === '0' && await page.$eval('[data-defeated]', (e) => !e.hidden), 'Stress Dragon defeated');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(600);
  await go();
  await sleep(800);
  check(await hp() === '1,840', `reset after scrolling back above (${await hp()})`);
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('Better Call Bhai: a spun pole keeps turning, then settles', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="better-call-bhai"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="better-call-bhai"][data-live]', { timeout: 30000 });
  await sleep(500);
  const p = await page.evaluate(() => window.__world.debugProject('better-call-bhai', 'pole0'));
  check(p !== null && p.x > 0 && p.x < 1440 && p.y > 0 && p.y < 900, `the left pole is on screen (${JSON.stringify(p)})`);
  const spin = () => page.evaluate(() => window.__world.mounted.get('better-call-bhai').debug.spin);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move(p.x + 260, p.y, { steps: 4 });
  await page.mouse.up();
  const a0 = (await spin()).angle;
  await page.waitForFunction((a0) => window.__world.mounted.get('better-call-bhai').debug.spin.angle > a0 + 0.05, { timeout: 3000 }, a0).catch(() => {});
  const s1 = await spin();
  check(s1.angle > a0 + 0.05, `still turning after the release (${a0.toFixed(2)} → ${s1.angle.toFixed(2)})`);
  // it slows down on its own (software rendering steps the physics slower than real time, so allow a while)
  await page.waitForFunction(() => window.__world.mounted.get('better-call-bhai').debug.spin.resting, { timeout: 25000 }).catch(() => {});
  check((await spin()).resting, 'and then it settles');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('MEANT: a reply picked from the keyboard reaches the partner display', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(400);
  await page.focus('[data-reply="2"]');
  check(await page.evaluate(() => window.__world.mounted.get('meant').debug.focused) === 2, 'focusing a reply lifts its tile');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__world.mounted.get('meant').debug.shown === 2, { timeout: 8000 }).catch(() => {});
  check(await page.$eval('[data-partner-live]', (e) => e.textContent) === 'Partner display: Char siew rice', 'announced');
  check(await page.evaluate(() => window.__world.mounted.get('meant').debug.shown) === 2, 'the partner display shows it');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('KnowCad: the sheets part for the cursor and come back when it leaves', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="knowcad"]'); scrollTo({ top: c.offsetTop - 0.2 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="knowcad"][data-live]', { timeout: 30000 });
  await sleep(500);
  const typed = await page.$eval('[data-typed]', (e) => e.textContent);
  check(typed.length > 0 && typed.length < 46, `the question is part-typed at this point (${JSON.stringify(typed)})`);
  for (const [x, y] of [[620, 420], [700, 450], [780, 480], [860, 500]]) { await page.mouse.move(x, y); await sleep(60); }
  await sleep(300);
  check(await page.evaluate(() => window.__world.mounted.get('knowcad').debug.parted() > 0.05), 'some sheets moved aside');
  await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')));
  await page.waitForFunction(() => window.__world.mounted.get('knowcad').debug.parted() < 0.001, { timeout: 8000 }).catch(() => {});
  check(await page.evaluate(() => window.__world.mounted.get('knowcad').debug.parted() < 0.001), 'all back in place');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('Awards: the boards land on their placings, Next photo flicks, a tap opens the viewer', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const a = document.getElementById('awards'); scrollTo({ top: a.offsetTop - 0.1 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('#awards .aw-stack[data-live]', { timeout: 30000 });
  await sleep(800);
  const board = (i) => page.evaluate((i) => window.__world.mounted.get('awards').debug.boardText(i), i);
  check(await board(0) === 'CHAMPION' && await board(1) === '2ND RUNNER-UP' && await board(2) === 'CHAMPION', `the boards read their placings (${await board(1)})`);
  const top = () => page.$eval('#win-dell .shot[data-on]', (a) => a.dataset.photo);
  const before = await top();
  await page.click('#win-dell [data-gal-step]');
  await page.waitForFunction(() => window.__world.mounted.get('awards').debug.resting(1), { timeout: 10000 }).catch(() => {});
  check(await top() !== before, `Next photo moved to the next one (${before} → ${await top()})`);
  check(await page.evaluate(() => window.__world.mounted.get('awards').debug.resting(1)), 'the flicked print settled');
  check(await page.evaluate(() => window.__world.mounted.get('awards').debug.topPhoto(1)) === await top(), 'the 3D stack shows the same photo on top');
  const box = await page.$eval('#win-sp .aw-stack', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width * 0.4, y: r.y + r.height * 0.4 }; });
  await page.mouse.click(box.x, box.y);
  await sleep(500);
  check(await page.$eval('[data-viewer]', (d) => d.open), 'a tap opened the viewer');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('a vertical swipe that starts on an award print still scrolls', async () => {
  const { page } = await open({ w: 390, h: 844 });
  await page.evaluate(() => { const a = document.getElementById('awards'); scrollTo({ top: a.offsetTop, behavior: 'instant' }); });
  await page.waitForSelector('#awards .aw-stack[data-live]', { timeout: 30000 });
  await sleep(600);
  const y0 = await page.evaluate(() => scrollY);
  const box = await page.$eval('#win-sp .aw-stack', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.touchscreen.touchStart(box.x, box.y);
  for (let k = 1; k <= 8; k++) { await page.touchscreen.touchMove(box.x, box.y - k * 40); await sleep(16); }
  await page.touchscreen.touchEnd();
  await sleep(700);
  check(await page.evaluate(() => scrollY) > y0 + 100, `the page scrolled (${y0} → ${await page.evaluate(() => scrollY)})`);
  await page.close();
});

scenario('the internship board comes alive in its box at the end, and a swipe across it does not ripple it', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => document.getElementById('contact').scrollIntoView({ behavior: 'instant' }));
  await page.waitForSelector('#contact .end-board[data-live]', { timeout: 30000 });
  await sleep(500);
  const d = await page.evaluate(() => window.__world.debugFit('ending'));
  check(d !== null && d <= 1, `the board is within 1px of its box (${d})`);
  check(await page.evaluate(() => window.__world.mounted.get('ending').debug.text()) === 'OPEN TO A SWE INTERNSHIP / 2027/28', 'it reads the sentence');
  const box = await page.$eval('#contact .end-board', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width * 0.3, y: r.y + r.height / 2 }; });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y, { steps: 5 });
  await page.mouse.up();
  check(!(await page.evaluate(() => window.__world.mounted.get('ending').debug.rippled)), 'a drag across the board did not ripple it');
  await page.mouse.click(box.x, box.y);
  check(await page.evaluate(() => window.__world.mounted.get('ending').debug.rippled), 'a click ripples it');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('a live chapter still describes its picture to screen readers', async () => {
  const { page } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="signalbridge"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="signalbridge"][data-live]', { timeout: 30000 });
  const r = await page.$eval('[data-scene="signalbridge"] .pin', (p) => { const d = p.querySelector(':scope > [role="img"]'); return { role: d?.getAttribute('role'), label: d?.getAttribute('aria-label') }; });
  check(r.role === 'img' && /SignalBridge/.test(r.label || ''), `the pin holds the still's description (${JSON.stringify(r)})`);
  await page.close();
});

scenario('a swipe that starts on the name board does not ripple it; a tap does', async () => {
  const { page } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await sleep(300);
  const box = await page.$eval('.hero-board', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width * 0.3, y: r.y + r.height * 0.4 }; });
  await page.mouse.move(box.x, box.y); await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + 10, { steps: 5 }); await page.mouse.up();
  check(!(await page.evaluate(() => window.__world.mounted.get('hero').debug.rippled)), 'a drag across the name did not ripple it');
  await page.mouse.click(box.x, box.y);
  check(await page.evaluate(() => window.__world.mounted.get('hero').debug.rippled), 'a tap ripples it');
  await page.close();
});

scenario('on a phone the chapter rail stays out of the way', async () => {
  const { page } = await open({ w: 390, h: 844 });
  check(await page.$eval('.rail', (r) => getComputedStyle(r).display === 'none'), 'no rail on a phone');
  await page.close();
});

scenario('the name font of a project loads only as its chapter comes near', async () => {
  const { page } = await open();
  await sleep(800);
  const fetched = () => page.evaluate(() => performance.getEntriesByType('resource').some((e) => e.name.includes('name-knowcad')));
  check(!(await fetched()), 'KnowCad’s font is not fetched at the top of the page');
  await page.evaluate(() => { const c = document.querySelector('[data-scene="knowcad"]'); scrollTo({ top: c.offsetTop - innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="knowcad"].near', { timeout: 30000 }).catch(() => {});
  await sleep(800);
  check(await fetched(), 'it is fetched once the chapter is near');
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
  // the logo fades in over .3s; give a busy page time to finish the fade
  await page.waitForFunction(() => { const a = document.activeElement; return a.classList.contains('logo') && parseFloat(getComputedStyle(a).opacity) > 0.99; }, { timeout: 3000 }).catch(() => {});
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
  const { page } = await open({ watchdog: true });
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

scenario('scrolling in small steps on a fast page never switches to the stills', async () => {
  // wheel ticks and slow drags arrive tens of milliseconds apart: the time between them is not a slow frame.
  // Small steps keep the page on the name board, whose frames are fast even in software rendering (the
  // chapters' rooms are not, there, and going to the stills in them would be right)
  const { page } = await open({ w: 600, h: 400, watchdog: true });
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  const end = Date.now() + 6000;
  while (Date.now() < end) {
    await page.evaluate(() => scrollBy(0, 3));
    await sleep(70);
  }
  check(!(await page.evaluate(() => document.documentElement.classList.contains('frozen'))), 'still live after six seconds of small steps');
  await page.close();
});

for (const where of ['top', 'contact']) scenario(`crossing the breakpoint does not leak GPU memory (${where})`, async () => {
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
  await page.goto(BASE + (where === 'top' ? '' : '#contact'), { waitUntil: 'networkidle0' });
  await page.waitForSelector(where === 'top' ? '.hero-board[data-live]' : '#contact .end-board[data-live]', { timeout: 30000 });
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

/* ------------------------------------------------------------------ final-review fixes (each failed first) */

scenario('fix: the first wheel notch after the page sat still glides instead of jumping', async () => {
  const { page } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await page.mouse.move(720, 450);
  await sleep(1500);
  await page.evaluate(() => { window.__d = []; let last = scrollY; const tick = () => { window.__d.push(scrollY - last); last = scrollY; if (window.__d.length < 90) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(1600);
  const d = await page.evaluate(() => window.__d);
  const max = Math.max(...d.map(Math.abs));
  const total = d.reduce((a, b) => a + b, 0);
  check(total > 80 && max <= 35, `the notch glides (largest step ${max} px of ${total})`);
  await page.close();
});

scenario('fix: a swipe is not a tap (the boss, the newspaper)', async () => {
  const { page } = await open({ w: 390, h: 844 });
  const go = (scene, t) => page.evaluate((scene, t) => { const c = document.querySelector(`[data-scene="${scene}"]`); scrollTo({ top: c.offsetTop + t * innerHeight, behavior: 'instant' }); }, scene, t);
  const swipe = async (x, y) => {
    await page.touchscreen.touchStart(x, y);
    for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(x, y - k * 30); await sleep(16); }
    await page.touchscreen.touchEnd();
    await sleep(500);
  };
  await go('boss-breaker', 0.5);
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  await sleep(400);
  await go('boss-breaker', 0.5);
  await sleep(300);
  await swipe(195, 330);   // on the arena, above the words
  check(await page.$eval('[data-hp-live]', (e) => e.textContent) === '', 'a swipe through Boss Breaker did not hit the boss');
  await go('meant', 0.5);
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(400);
  await go('meant', 0.5);
  await sleep(300);
  const p = await page.evaluate(() => window.__world.debugProject('meant', 'paper'));
  check(p !== null, 'the newspaper is on screen');
  if (p) await swipe(p.x, p.y);
  check(!page.url().includes('meant.html'), `a swipe that starts on the newspaper did not open it (${page.url()})`);
  await page.close();
});

scenario('fix: Awards keeps its words, photos and announcements for screen readers while the 3D is live', async () => {
  const { page } = await open();
  await page.evaluate(() => { const a = document.getElementById('awards'); scrollTo({ top: a.offsetTop, behavior: 'instant' }); });
  await page.waitForSelector('#awards .aw-stack[data-live]', { timeout: 30000 });
  await sleep(600);
  // the whole page's tree (a snapshot rooted at a section comes back empty), from the Awards heading on
  const flat = [];
  const walk = (n) => { if (!n) return; flat.push(`${n.role}: ${n.name || ''}`); (n.children || []).forEach(walk); };
  walk(await page.accessibility.snapshot({ interestingOnly: true }));
  const awards = flat.slice(flat.findIndex((l) => /heading: Awards/i.test(l)));
  check(awards.some((l) => /^heading: 2nd runner-up$/i.test(l)), `the placing is still a heading (${awards.slice(0, 5).join(' | ')})`);
  check(awards.some((l) => /^link: View full size/.test(l)), 'the top photo still opens the viewer from the keyboard');
  const live = await page.$eval('#win-dell [data-gal-live]', (e) => getComputedStyle(e).visibility);
  check(live !== 'hidden', `the photo announcements are not hidden (${live})`);
  await page.close();
});

scenario('fix: a chapter is described without hiding its heading and buttons', async () => {
  const { page } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  const r = await page.$eval('[data-scene="boss-breaker"] .pin', (p) => ({ pinRole: p.getAttribute('role'), img: p.querySelector(':scope > [role="img"]')?.getAttribute('aria-label') || '' }));
  check(r.pinRole === null && /Boss Raid/.test(r.img), `the description is its own element (${JSON.stringify(r)})`);
  await page.close();
});

scenario('fix: arriving at Boss Breaker by link, the health bar holds still', async () => {
  const { page } = await open({ path: '#work-bx' });
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  const fill = () => page.evaluate(() => window.__world.mounted.get('boss-breaker').debug.fill());
  const a = await fill();
  await sleep(700);
  const b = await fill();
  check(Math.abs(a - b) < 0.002 && Math.abs(b - 0.368) < 0.01, `the bar stays at the capture's 1,840 (${a.toFixed(3)} → ${b.toFixed(3)})`);
  await page.close();
});

scenario('fix: the wheel over the viewer toolbar never scrolls the page', async () => {
  const { page } = await open();
  await page.evaluate(() => document.getElementById('awards').scrollIntoView({ behavior: 'instant' }));
  await sleep(300);
  await page.evaluate(() => document.querySelector('#awards a[data-zoom]').click());
  await sleep(400);
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.move(720, 30);
  await page.mouse.wheel({ deltaY: 400 });
  await sleep(800);
  check(await page.evaluate(() => scrollY) === y0, 'page stayed put under the toolbar too');
  await page.close();
});

scenario('fix: Attack and the reply buttons only show while their scene is live', async () => {
  const { page } = await open({ block: '/js/3d/chapters/boss-breaker.js' });
  await page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await sleep(3000);
  check(await page.$eval('[data-attack]', (b) => getComputedStyle(b).display === 'none'), 'no Attack without the scene');
  check(await page.$eval('.bx-hud', (b) => getComputedStyle(b).display === 'none'), 'no HP readout without the scene');
  await page.close();
});

for (const [from, to] of [[[1440, 900], [900, 1000]], [[1024, 768], [768, 1024]]]) {
  scenario(`fix: resizing ${from.join('x')} to ${to.join('x')} keeps the place in the story`, async () => {
    const { page, errors } = await open({ w: from[0], h: from[1] });
    await page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); const pin = c.querySelector('.pin'); scrollTo({ top: c.offsetTop + 0.3 * pin.offsetHeight, behavior: 'instant' }); });
    await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
    await sleep(500);
    const before = await page.evaluate(() => window.__world.debugPlace());
    await page.setViewport({ width: to[0], height: to[1] });
    await sleep(1500);
    const after = await page.evaluate(() => window.__world.debugPlace());
    check(after.name === before.name && Math.abs(after.t - before.t) < 0.03, `still in ${before.name} at ${before.t.toFixed(2)} (now ${after.name} at ${after.t.toFixed(2)})`);
    check(errors.filter((e) => !e.includes('did not load')).length === 0, `no errors ${errors.join(' | ')}`);
    await page.close();
  });
}

scenario('fix: crossing to a phone width rebuilds the scenes for a phone', async () => {
  const { page } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="signalbridge"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="signalbridge"][data-live]', { timeout: 30000 });
  check(await page.evaluate(() => window.__world.form) === 'desk', 'desk at 1440');
  await page.setViewport({ width: 600, height: 900 });
  await sleep(2500);
  check(await page.evaluate(() => window.__world.form) === 'phone', 'phone at 600');
  await page.close();
});

scenario('fix: chapter time is counted in pin heights (100svh), which a phone toolbar does not change', async () => {
  // a phone's toolbar changes innerHeight but not 100svh; emulation cannot move one without the other, so the pin
  // is made shorter than the window here and the world must count in pins
  const { page } = await open();
  await page.addStyleTag({ content: '.has-3d .chapter .pin{height:80vh!important}' });
  await page.evaluate(() => { dispatchEvent(new Event('resize')); const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 200, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(300);
  const r = await page.evaluate(() => {
    const c = document.querySelector('[data-scene="meant"]');
    return { got: window.__world.debugPlace().t, want: (scrollY - (c.getBoundingClientRect().top + scrollY)) / c.querySelector('.pin').offsetHeight };
  });
  check(Math.abs(r.got - r.want) < 0.005, `the world counts in pins (${r.got.toFixed(3)}, a pin gives ${r.want.toFixed(3)})`);
  await page.close();
});

scenario('fix: pinch-zoom still works over the barber poles and the award prints', async () => {
  const { page } = await open({ w: 390, h: 844 });
  await page.evaluate(() => { const c = document.querySelector('[data-scene="better-call-bhai"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="better-call-bhai"][data-live]', { timeout: 30000 });
  const pin = await page.$eval('[data-scene="better-call-bhai"] .pin', (p) => getComputedStyle(p).touchAction);
  const stack = await page.$eval('.aw-stack', (p) => getComputedStyle(p).touchAction);
  check(pin.includes('pinch-zoom') && stack.includes('pinch-zoom'), `pan-y pinch-zoom (${pin}; ${stack})`);
  await page.close();
});

scenario('fix: Featured in Tamil Murasu is a 44px touch target', async () => {
  const { page } = await open({ w: 390, h: 844 });
  check(await page.$eval('.mt-press', (a) => a.getBoundingClientRect().height >= 44), 'at least 44px tall');
  await page.close();
});

scenario('fix: after a header link glides, focus moves to where it landed', async () => {
  const { page } = await open();
  await page.focus('.nav a[href$="#awards"]');
  await page.keyboard.press('Enter');
  await sleep(2200);
  check(await page.evaluate(() => Boolean(document.activeElement.closest('#awards'))), `focus is in Awards (${await page.evaluate(() => document.activeElement.id || document.activeElement.className)})`);
  await page.close();
});

scenario('fix: an error in a scene sends the page to the stills instead of breaking it', async () => {
  const { page } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await page.evaluate(() => { window.__world.mounted.get('hero').update = () => { throw new Error('test: a broken scene'); }; scrollBy(0, 10); });
  await sleep(800);
  check(await page.evaluate(() => document.documentElement.classList.contains('frozen')), 'html.frozen');
  await page.close();
});

scenario('Boss Breaker: the words never cover the big screen at the payoff', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  await sleep(600);
  const r = await page.evaluate(() => {
    const w = window.__world;
    const l = w.debugProject('boss-breaker', 'screenLeft'), rr = w.debugProject('boss-breaker', 'screenRight');
    const info = document.querySelector('[data-scene="boss-breaker"] .info').getBoundingClientRect();
    return l && rr ? { l: l.x, r: rr.x, info: info.left } : null;
  });
  check(r !== null, 'the big screen has anchors');
  if (r) {
    check(r.r <= r.info - 16, `the screen ends left of the words (${Math.round(r.r)} px, words at ${Math.round(r.info)} px)`);
    check(r.r - r.l >= 0.45 * 1440, `the screen is at least 45% of the width (${Math.round(r.r - r.l)} px)`);
    check(r.l >= -40, `the screen's left edge is on screen (${Math.round(r.l)} px)`);
  }
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('Better Call Bhai: a time slot lifts under the mouse and settles when it leaves', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="better-call-bhai"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="better-call-bhai"][data-live]', { timeout: 30000 });
  await sleep(600);
  const p = await page.evaluate(() => window.__world.debugProject('better-call-bhai', 'slot0'));
  check(p !== null, 'the 10:00 pill has an anchor');
  if (p) {
    const lift = () => page.evaluate(() => window.__world.mounted.get('better-call-bhai').debug.lift(0));
    await page.mouse.move(p.x, p.y);
    await page.waitForFunction(() => window.__world.mounted.get('better-call-bhai').debug.lift(0) > 0.5, { timeout: 5000 }).catch(() => {});
    check(await lift() > 0.5, `the 10:00 pill lifted (${(await lift()).toFixed(2)})`);
    await page.mouse.move(5, 890);
    await page.waitForFunction(() => window.__world.mounted.get('better-call-bhai').debug.lift(0) < 0.02, { timeout: 5000 }).catch(() => {});
    check(await lift() < 0.02, 'and settled back when the mouse left');
  }
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('MEANT: pressing the newspaper glides into it, then opens the article', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(600);
  const p = await page.evaluate(() => window.__world.debugProject('meant', 'paper'));
  check(p !== null, 'the newspaper is on screen');
  const t0 = Date.now();
  await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.mouse.click(p.x, p.y)]);
  const ms = Date.now() - t0;
  check(page.url().endsWith('meant.html#press'), `it opened the article (${page.url()})`);
  check(ms >= 500, `after the camera glided in (${ms} ms)`);
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('MEANT: after coming back from the article, the camera is on the scroll again', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(400);
  await page.evaluate(() => { window.__world.glideTo(window.__world.mounted.get('meant').debug.anchors.paper.clone()); });
  await page.waitForFunction(() => window.__world.debugGlide() === 1, { timeout: 8000 }).catch(() => {});
  check(await page.evaluate(() => window.__world.debugGlide()) === 1, 'the camera glided to the paper');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.waitForFunction(() => window.__world.debugCamera().ok, { timeout: 5000 }).catch(() => {});   // the next frame
  check(await page.evaluate(() => window.__world.debugGlide()) === null, 'coming back ends the glide');
  check(await page.evaluate(() => window.__world.debugCamera().ok), 'the camera is on the scroll’s pose');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('MEANT: a ctrl-click on Featured in Tamil Murasu is left to the browser', async () => {
  const { page } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(400);
  const prevented = await page.$eval('a.mt-press', (a) => {
    let seen = null;
    addEventListener('click', (e) => { seen = e.defaultPrevented; e.preventDefault(); }, { once: true });   // stay on the page
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 }));
    return seen;
  });
  check(prevented === false, 'the page did not take over the click');
  check(await page.evaluate(() => window.__world.debugGlide && window.__world.debugGlide()) === null, 'no glide started');
  await page.close();
});

scenario('Boss Breaker: Attack plays the front card, and six attacks go round the hand', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  await sleep(500);
  const front = () => page.evaluate(() => window.__world.mounted.get('boss-breaker').debug.front());
  check(await front() === 0, 'challenge #1 is in front');
  await page.click('[data-attack]');
  await sleep(200);
  check(await front() === 1, `after one attack, #2 is in front (${await front()})`);
  for (let i = 0; i < 5; i++) { await page.click('[data-attack]'); await sleep(150); }
  check(await front() === 0, `six attacks went round the hand (${await front()})`);
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
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
