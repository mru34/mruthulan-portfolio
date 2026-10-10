/* The homepage: decides between the live 3D and the stills, mounts each 3D scene as its section comes near,
   and drives what the scroll position decides: the chapter beats, the rail and the snap. Every part of the
   page works without this file. */
import { want3D, readEnv } from './lib/capability.js';
import { sectionProgress, ramp } from './lib/motion.js';
import { snapTarget, currentChapter } from './lib/scrollnav.js';
import { FrameWatch } from './lib/watchdog.js';

export const KEY = 0.8;                                    // the payoff pose every chapter settles on
const BEATS = { line: [0.25, 0.35], pay: [0.6, 0.7] };     // the one line, then the result and the link
// data-scene → its module, loaded only when its section comes near
const SCENES = {};

const root = document.documentElement;
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pose = new URLSearchParams(location.search).get('pose');
const chapters = $$('.chapter');
const fly = document.querySelector('.fly');
const rail = document.querySelector('.rail');
const marks = rail ? $$('li', rail) : [];
const live = want3D(readEnv());
root.classList.add(live ? 'has-3d' : 'stills');

function freeze() {
  root.classList.add('frozen');
  $$('[data-live]').forEach((a) => a.removeAttribute('data-live'));
}

// the words of each chapter arrive in beats, the title moves with the flight, the rail marks where you are
function beats() {
  const vh = innerHeight;
  if (fly) {
    const r = fly.getBoundingClientRect();
    fly.style.setProperty('--p', sectionProgress(r.top, r.height, vh).toFixed(4));
  }
  const rects = chapters.map((c) => c.getBoundingClientRect());
  rects.forEach((r, i) => {
    if (r.bottom < -vh || r.top > 2 * vh) return;
    const p = sectionProgress(r.top, r.height, vh);
    chapters[i].style.setProperty('--b1', ramp(p, ...BEATS.line).toFixed(3));
    chapters[i].style.setProperty('--b2', ramp(p, ...BEATS.pay).toFixed(3));
  });
  const now = currentChapter(rects, vh);
  if (rail) {
    rail.classList.toggle('on', now >= 0);
    marks.forEach((m, k) => m.toggleAttribute('data-on', k === now));
  }
}

// when scrolling stops near a chapter's payoff ahead, glide onto it; never back against the visitor
function snap() {
  let timer = 0;
  let lastY = scrollY;
  let dir = 1;
  let held = false;
  let gliding = false;
  const poses = () => chapters.map((c) => c.getBoundingClientRect().top + scrollY + KEY * (c.offsetHeight - innerHeight));
  addEventListener('pointerdown', () => { held = true; }, { passive: true });
  addEventListener('pointerup', () => { held = false; }, { passive: true });
  addEventListener('pointercancel', () => { held = false; }, { passive: true });
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y !== lastY) dir = y > lastY ? 1 : -1;
    lastY = y;
    clearTimeout(timer);
    if (gliding) return;
    timer = setTimeout(() => {
      if (held) return;
      const t = snapTarget(scrollY, poses(), innerHeight, dir);
      if (t === null) return;
      gliding = true;
      const end = () => { gliding = false; };
      addEventListener('scrollend', end, { once: true });
      setTimeout(end, 1500);
      scrollTo({ top: t, behavior: 'smooth' });
    }, 150);
  }, { passive: true });
}

async function start3D() {
  const { createStage } = await import('./3d/stage.js');
  const canvas = document.querySelector('canvas.stage');
  const stage = createStage(canvas, { maxDpr: matchMedia('(pointer: coarse)').matches ? 1.5 : 2 });
  addEventListener('scroll', stage.invalidate, { passive: true });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stage.stop(); freeze(); });

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
    if (now - scrolledAt > 200) return;
    const verdict = watch.push(now, dt);
    if (verdict === 'lower') stage.setDpr(1);
    else if (verdict === 'stills') { stage.stop(); freeze(); }
  });
}

if (live) {
  // a page opened at #work-sb (or #work) lands on that chapter's payoff pose: the tall sections exist only
  // now that .has-3d is on, so make the jump again
  if (location.hash && !pose) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; beats(); }); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  beats();
  if (!pose) snap();
  start3D().catch((err) => { console.warn('The 3D stage did not start; showing the stills.', err); freeze(); });
}
