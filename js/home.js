/* The homepage: decides between the live 3D and the stills, smooths the wheel with Lenis, and runs one frame
   loop for everything the scroll position drives: the smooth scroll first, then the chapter beats and the
   rail, then the 3D, so all of them agree on where the page is in every frame. Every part of the page works
   without this file. */
import { want3D, readEnv } from './lib/capability.js';
import { sectionProgress, ramp } from './lib/motion.js';
import { currentChapter } from './lib/scrollnav.js';
import { FrameWatch } from './lib/watchdog.js';
import { createTicker } from './lib/ticker.js';

export const KEY = 0.8;                                      // the payoff pose every chapter settles on
export const BEATS = { line: [0.05, 0.3], pay: [0.45, 0.7] }; // the one line, then the result and the link
// data-scene → its module, loaded only when its section comes near
const SCENES = {
  hero: () => import('./3d/hero.js'),
  signalbridge: () => import('./3d/chapters/signalbridge.js'),
};

const root = document.documentElement;
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const pose = params.get('mode') === '3d' ? params.get('pose') : null;
const debug = params.get('debug') === 'frames';
const chapters = $$('.chapter');
const rail = document.querySelector('.rail');
const marks = rail ? $$('li', rail) : [];
const live = want3D(readEnv());
root.classList.add(live ? 'has-3d' : 'stills');

let onFreeze = () => {};
function freeze() {
  root.classList.add('frozen');
  $$('[data-live]').forEach((a) => a.removeAttribute('data-live'));
  onFreeze();
}

// layout is read once per resize, so no frame reads layout: each chapter's top, height and pin height
let lay = [];
function measure() {
  lay = chapters.map((c) => ({ top: c.offsetTop, h: c.offsetHeight, pin: c.querySelector('.pin').offsetHeight }));
}
// the words of each chapter arrive in beats; the rail marks where you are
function beats(y) {
  const vh = innerHeight;
  lay.forEach((L, i) => {
    const top = L.top - y;
    if (top + L.h < -vh || top > 2 * vh) return;
    const p = sectionProgress(top, L.h, L.pin);
    chapters[i].style.setProperty('--b1', ramp(p, ...BEATS.line).toFixed(3));
    chapters[i].style.setProperty('--b2', ramp(p, ...BEATS.pay).toFixed(3));
  });
  const now = currentChapter(lay.map((L) => ({ top: L.top - y, bottom: L.top - y + L.h })), vh);
  if (rail) {
    rail.classList.toggle('on', now >= 0);
    marks.forEach((m, k) => m.toggleAttribute('data-on', k === now));
  }
}

async function start3D(ticker) {
  const { createStage } = await import('./3d/stage.js');
  const canvas = document.querySelector('canvas.stage');
  const stage = createStage(canvas, { ticker, maxDpr: matchMedia('(pointer: coarse)').matches ? 1.5 : 2 });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stage.stop(); freeze(); });
  // ?debug=frames: after the 3D has drawn each frame, the scroll the page shows and the one the 3D used
  if (debug) {
    window.__frames = [];
    ticker.add((now) => { window.__frames.push([now, scrollY, window.__world?.lastScroll ?? scrollY]); return false; });
  }
  // until the world's rig arrives (js/3d/world.js), the part 1 studio: a key from the top left, a dim fill
  const THREE = await import('three');
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-6, 8, 10);
  const fill = new THREE.DirectionalLight(0xc8d2ff, 0.25);
  fill.position.set(6, -3, 6);
  stage.scene.add(key, fill);

  const mounted = new Set();
  async function mount(section) {
    const name = section.dataset.scene;
    if (mounted.has(name) || !SCENES[name]) return;
    mounted.add(name);
    try {
      const mod = await SCENES[name]();
      const part = await mod.mount(stage, section);
      stage.add(part);
      stage.renderNow();
      if (!root.classList.contains('frozen')) $$('[data-anchor]', section).forEach((a) => a.setAttribute('data-live', ''));
    } catch (err) {
      console.warn(`3D scene "${name}" did not load; its still stays.`, err);
    }
  }

  if (pose) {
    root.dataset.pose = pose;
    const section = document.querySelector(`[data-scene="${pose}"]`);
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo({ top: pose === 'hero' ? 0 : top + KEY * (section.offsetHeight - innerHeight), behavior: 'instant' });
    await mount(section);
    stage.renderNow();
    root.dataset.posed = pose;
    return;
  }

  const near = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) mount(en.target); }),
    { rootMargin: '150% 0px 150% 0px' });
  $$('[data-scene]').forEach((s) => near.observe(s));

  const watch = new FrameWatch();
  let scrolledAt = 0;
  addEventListener('scroll', () => { scrolledAt = performance.now(); }, { passive: true });
  stage.onFrame((now, dt) => {
    if (dt === null || now - scrolledAt > 200) return;
    const verdict = watch.push(now, dt);
    if (verdict === 'lower') stage.setDpr(1);
    else if (verdict === 'stills') { stage.stop(); freeze(); }
  });
}

if (live) {
  const ticker = createTicker();
  // a page opened at #work-sb (or #work) lands on that chapter's payoff pose: the tall sections exist only
  // now that .has-3d is on, so make the jump again
  if (location.hash && !pose) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  let lenis = null;
  if (params.get('smooth') !== 'off' && !pose) {
    const { default: Lenis } = await import('lenis');
    lenis = new Lenis({
      autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: false,
      prevent: (node) => Boolean(node.closest('dialog[open], [data-lenis-prevent]')),
    });
    root.classList.add('smooth');
    ticker.add((now) => { lenis?.raf(now); return lenis?.isScrolling === 'smooth'; });
    addEventListener('wheel', ticker.invalidate, { passive: true });
    window.__lenis = lenis;   // the smoke tests read isScrolling
    // a stopped 3D must never leave the wheel smoothed by nothing: back to the browser's own scrolling
    onFreeze = () => { lenis?.destroy(); lenis = null; window.__lenis = null; root.classList.remove('smooth'); };
    // in-page links glide with Lenis and land exactly where the browser would have put them
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"], a[href^="index.html#"]');
      if (!lenis || !a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || !a.hash) return;
      const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + scrollY
        - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)
        - (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0);
      history.pushState(null, '', a.hash);
      lenis.scrollTo(Math.round(y), { duration: 1.1, easing: (t) => 1 - (1 - t) ** 4 });
    });
  }
  // any scroll keeps the loop running for a moment, so frames come back to back while the page moves: the
  // watchdog then measures real frames, never the pause between two wheel ticks
  let movingUntil = 0;
  addEventListener('scroll', () => { movingUntil = performance.now() + 120; ticker.invalidate(); }, { passive: true });
  addEventListener('resize', () => { measure(); ticker.invalidate(); });
  measure();
  ticker.add((now) => { beats(scrollY); return now < movingUntil; });
  start3D(ticker).catch((err) => { console.warn('The 3D stage did not start; showing the stills.', err); freeze(); });
}
