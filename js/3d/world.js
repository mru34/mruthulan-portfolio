// The homepage's one 3D world. Scenes stand one after another along the camera's path (js/3d/paths.js): the
// hero board, the five chapters, then the Awards table and the ending board. The scroll position picks the
// camera's pose from the keys, so moving between projects is a camera flight. In the page sections (the hero
// at rest, Awards, the ending) the camera holds the page pose, so 3D fitted to HTML boxes lines up exactly.
// The lights travel with the camera and take each project's colour; there are always the same five, so
// shaders never recompile mid-scroll. Scenes are built when the visitor is within one section and freed
// three sections away; a new scene's shaders compile and its textures go to the GPU a frame at a time before
// it shows, so building one never stalls the scroll.
import * as THREE from 'three';
import { sampleKeys, pageWeight } from '../lib/path.js';
import { Spring } from '../lib/motion.js';
import { glidePose } from '../lib/glide.js';
import { rectToWorld } from '../lib/fit.js';
import { CAM_Z } from './stage.js';
import { KEYS, ORIGINS, COLORS } from './paths.js';
import { glow, texturesOf } from './textures.js';

const BG = 0x0c0c0d;
const GLIDE_NEAR = 2.2;   // how close a glide stops to its point (decimetres), unless it is told
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

export function createWorld(stage, { sections, form }) {
  const { scene, camera, renderer, view } = stage;
  const root = new THREE.Group();
  scene.add(root);
  scene.fog = new THREE.Fog(BG, 30, 60);
  renderer.localClippingEnabled = true;   // Better Call Bhai's phone slides its screens inside the screen's edges

  // the rig: key from the top left, a dim fill, a coloured rim from behind, a coloured bounce from below, all
  // placed in the camera's own space; and a warm glint the hero moves with the pointer (dark until it does)
  const rig = new THREE.Group();
  const light = (color, i, pos, aim) => {
    const l = new THREE.DirectionalLight(color, i);
    l.position.set(...pos);
    l.target.position.set(...aim);
    rig.add(l, l.target);
    return l;
  };
  light(0xffffff, 1.4, [-6, 8, 4], [0, 0, -10]);
  light(0xc8d2ff, 0.25, [6, -3, 4], [0, 0, -10]);
  const rim = light(0xffffff, 1.15, [5, 5, -22], [0, 0, -8]);
  const bounce = light(0xffffff, 0.35, [0, -6, -4], [0, 0, -10]);
  const glint = new THREE.PointLight(0xfff1d6, 0, 8, 1.6);
  scene.add(rig, glint);
  // shared textures exist from the start, so freeing scenes always returns memory to the same level
  const warm = glow(0xffffff, 1);
  renderer.initTexture(warm.material.map);
  warm.geometry.dispose();
  warm.material.dispose();

  const origins = Object.fromEntries(Object.entries(ORIGINS).map(([k, a]) => [k, new THREE.Vector3(...a)]));
  const mounted = new Map();     // name -> part
  const built = new Map();       // name -> part being built (made, not yet mounted)
  const pending = new Map();     // name -> promise
  const docRects = new Map();    // fitted element -> its box in document coordinates
  let spans = [];                // each section's top and bottom in document coordinates
  let keys = [], bases = {}, pageStart = 99, vh = 1, unit = 1, aspect = 1, form0 = form;
  let place = null;      // where the page is in the story (section and fraction), kept for a resize
  let laidOut = { w: 0, h: 0 };
  const heroEnd = 0.6;
  // the camera holds the page pose for the first part of the hero's scroll, so the name board goes up with the
  // page (and its links) before the camera turns and flies on (js/3d/hero.js tilts it away from then on)
  const HERO_HOLD = 0.3;
  let lastScroll = 0;
  const lookX = new Spring(0, { stiffness: 60, damping: 16 });
  const lookY = new Spring(0, { stiffness: 60, damping: 16 });
  const shakeS = new Spring(0, { stiffness: 900, damping: 18 });
  const camPos = new THREE.Vector3(), camAt = new THREE.Vector3();
  let glide = null;   // a short camera move toward a point (MEANT's newspaper), held until the page leaves or scrolls

  const docBox = (el) => { const r = el.getBoundingClientRect(); return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }; };
  function layout() {
    vh = innerHeight;
    // one screen of chapter time is one pin: 100svh, which a phone's toolbar does not change (innerHeight does)
    unit = document.querySelector('.chapter .pin')?.offsetHeight || innerHeight;
    aspect = innerWidth / innerHeight;
    laidOut = { w: innerWidth, h: innerHeight };
    docRects.clear();
    for (const s of sections) if (s.kind === 'page') for (const el of s.el.querySelectorAll('[data-anchor]')) docRects.set(el, docBox(el));
    spans = sections.map((s) => { const b = docBox(s.el); return [b.top, b.top + b.height]; });
    bases = Object.fromEntries(sections.map((s, i) => [s.name, spans[i][0] / unit]));
    const awards = sections.findIndex((s) => s.name === 'awards');
    pageStart = awards >= 0 ? spans[awards][0] / unit - 0.6 : 99;
    const pagePose = (t) => ({ t, at: [...ORIGINS.page], from: [0, 0, 1], d: CAM_Z, stop: true, color: COLORS.page });
    const heroPose = (t) => ({ t, at: [...ORIGINS.hero], from: [0, 0, 1], d: CAM_Z, stop: true, color: COLORS.hero });
    keys = [heroPose(0), heroPose(HERO_HOLD)];
    for (const s of sections) {
      if (s.kind !== 'flight' || !KEYS[s.name]) continue;
      const o = ORIGINS[s.name];
      for (const key of KEYS[s.name]) {
        const k = form0 === 'phone' && key.phone ? { ...key, ...key.phone } : key;
        keys.push({ ...k, t: bases[s.name] + k.t, at: [k.at[0] + o[0], k.at[1] + o[1], k.at[2] + o[2]], color: COLORS[s.name] });
      }
    }
    keys.push(pagePose(pageStart), pagePose(pageStart + 100));
  }

  // an HTML box as a rectangle in the world, for a camera at the page pose in front of `originName`
  function boxToWorld(el, originName) {
    const d = docRects.get(el) || docBox(el);
    const o = origins[originName];
    const r = rectToWorld({ left: d.left - scrollX, top: d.top - scrollY, width: d.width, height: d.height }, view.w, view.h, view.k);
    return { x: r.x + o.x, y: r.y + o.y, z: o.z, w: r.w, h: r.h };
  }

  function current(y) {
    const mid = y + vh / 2;
    const i = spans.findIndex(([a, b]) => a <= mid && b > mid);
    if (i >= 0) return i;
    // before a section, or in the flight between two rooms (a stretch that belongs to no section): the next one
    const next = spans.findIndex(([a]) => a > mid);
    return next >= 0 ? next : sections.length - 1;
  }

  const anchorsOf = (s) => [s.el, ...s.el.querySelectorAll('[data-anchor]')];
  // while a chapter's 3D stands in for its still, the chapter carries the still's description for screen readers
  // (its own element: a role on the whole pin would hide the heading and buttons inside it)
  function describe(s, live) {
    const pin = s.kind === 'flight' && s.el.querySelector('.pin');
    const alt = pin && s.el.querySelector('.ch-stage img')?.alt;
    if (!alt) return;
    pin.querySelector(':scope > [data-described]')?.remove();
    if (!live) return;
    const d = document.createElement('span');
    d.className = 'sr-only';
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', alt);
    d.setAttribute('data-described', '');
    pin.prepend(d);
  }
  // Building goes in steps, as many in a frame as fit in BUDGET ms, the scene nearest the visitor first. Built
  // one step a frame, a room of fifty pieces took over a second, and a visitor who scrolled the moment the page
  // opened reached each room before it was built: the still, not the scene.
  // A frame already busy (the frame's own drawing, a room being made) gets no building on top, for up to three
  // frames in a row: building beside a room being made was one 90 ms frame as the visitor left the hero.
  const BUDGET = 5;
  const busyFrame = (frameStart) => performance.now() - frameStart > 2 * BUDGET;
  const steps = [];   // { s, run, done, fail }
  let pumping = false, waited = 0;
  const nearness = (s) => Math.abs(sections.indexOf(s) - current(scrollY));
  function pump(frameStart) {
    if (busyFrame(frameStart) && waited < 3) waited += 1;
    else {
      waited = 0;
      const t = performance.now();
      steps.sort((a, b) => nearness(a.s) - nearness(b.s));
      while (steps.length && performance.now() - t < BUDGET) {
        const x = steps.shift();
        try { x.run(); x.done(); } catch (err) { x.fail(err); }
      }
    }
    if (steps.length) requestAnimationFrame(pump); else pumping = false;
  }
  const step = (s, run) => new Promise((done, fail) => {
    steps.push({ s, run, done, fail });
    if (!pumping) { pumping = true; requestAnimationFrame(pump); }
  });
  // and one scene is made at a time (its module's mount: its objects and pictures), the nearest first: two made
  // in the same frames (the next room and the one after it) were one 90 ms frame as the visitor left the hero
  const making = [];   // { s, go }
  let makingOne = false;
  function nextMade() {
    if (makingOne || !making.length) return;
    making.sort((a, b) => nearness(a.s) - nearness(b.s));
    makingOne = true;
    making.shift().go();
  }
  const turnToMake = (s) => new Promise((go) => { making.push({ s, go }); nextMade(); });
  const made = () => { makingOne = false; nextMade(); };
  function mountScene(s) {
    if (mounted.has(s.name)) return Promise.resolve();
    if (pending.has(s.name)) return pending.get(s.name);
    const stillWanted = () => pending.get(s.name) === job;
    if (s.kind === 'flight') s.el.classList.add('near');   // its name's own typeface may load now
    const job = (async () => {
      const mod = await s.load();
      await turnToMake(s);
      let part;
      try {
        if (!stillWanted()) return;   // freed while it waited its turn
        part = await mod.mount({ THREE, world: api, stage, section: s.el, form: form0, origin: origins[s.name] ?? origins.page, invalidate: stage.invalidate });
      } finally { made(); }
      if (!stillWanted()) { part.dispose(); return; }   // freed while it was being made
      built.set(s.name, part);
      // shaders compile, textures go to the GPU and each piece is drawn once out of sight (warmUp), all before the
      // scene shows, in steps paced by the frame (step, below)
      if (part.group.parent) part.group.parent.remove(part.group);
      const pieces = [...part.group.children];
      const compiling = [];
      await Promise.all(pieces.map((piece) => step(s, () => { if (stillWanted()) compiling.push(stage.compile(piece)); })));
      await Promise.all(compiling);
      await Promise.all([...new Set([...texturesOf(part.group), ...(part.warm || [])])].map((tex) => step(s, () => { if (stillWanted()) renderer.initTexture(tex); })));
      if (!posing) {
        const warmed = pieces.map((piece) => new Promise((done) => warming.push({ s, group: part.group, piece, done, wanted: stillWanted })));
        stage.invalidate();
        await Promise.all(warmed);
      }
      if (!stillWanted()) return;   // freed while it was being built (free disposed it)
      built.delete(s.name);
      root.add(part.group);
      mounted.set(s.name, part);
      // the still gives way in the frame the scene is first drawn: this frame callback runs after the loop's, which
      // draws it. Hidden at once, the still left one frame with neither it nor the scene, a black flash.
      stage.invalidate();
      await nextFrame();
      if (mounted.get(s.name) !== part) return;   // freed meanwhile
      if (!document.documentElement.classList.contains('frozen')) anchorsOf(s).forEach((a) => a.setAttribute('data-live', ''));
      describe(s, true);
    })().catch((err) => {
      console.warn(`3D scene "${s.name}" did not load; its still stays.`, err);
      s.el.setAttribute('data-failed', '');
    }).finally(() => { if (pending.get(s.name) === job) pending.delete(s.name); });
    pending.set(s.name, job);
    return job;
  }
  // A scene's geometry goes to the GPU, and its draws are set up, the first time it is drawn: for a room with a
  // hundred objects that was one long frame, the frame it came into view mid-flight. So while it is being built,
  // each piece is drawn once into a single pixel, all of it in view and nothing else of the world, just before a
  // frame's own drawing (which then covers the whole picture), as many as fit in BUDGET, never in sight.
  const warming = [];   // { s, group, piece, done, wanted }
  let posing = false, warmWaited = 0;   // a posed still (design/stills.mjs): drawn once, before the frame loop runs, so no warming
  function warmUp({ group, piece, done, wanted }) {
    if (wanted()) {
      const undo = [];
      const set = (o, k, v) => { if (o[k] !== v) { undo.push([o, k, o[k]]); o[k] = v; } };
      for (const c of root.children) set(c, 'visible', false);
      for (const c of group.children) if (c !== piece) set(c, 'visible', false);
      piece.traverse((o) => { set(o, 'visible', true); set(o, 'frustumCulled', false); });
      const added = group.parent !== root;
      if (added) root.add(group);
      set(group, 'visible', true);
      renderer.setScissorTest(true);
      renderer.setScissor(0, 0, 1, 1);
      renderer.render(scene, camera);
      renderer.setScissorTest(false);
      if (added) root.remove(group);
      for (let i = undo.length - 1; i >= 0; i--) { const [o, k, v] = undo[i]; o[k] = v; }
    }
    done();
  }
  function free(s) {
    pending.delete(s.name);
    // a scene half built already has things on the GPU (its textures, its warmed pieces): they go now, not when
    // its build next looks up
    const half = built.get(s.name);
    if (half) { built.delete(s.name); half.dispose(); }
    const part = mounted.get(s.name);
    if (!part) return;
    mounted.delete(s.name);
    root.remove(part.group);
    part.dispose();
    anchorsOf(s).forEach((a) => a.removeAttribute('data-live'));
    describe(s, false);
  }

  const api = {
    root, rig, glint, mounted, layout, boxToWorld,
    get lastScroll() { return lastScroll; },
    origin: (name) => origins[name].clone(),
    // a section's top, in CSS pixels from the top of the screen, from the cached layout (no layout read)
    top(name) { const i = sections.findIndex((x) => x.name === name); return i < 0 ? 0 : spans[i][0] - scrollY; },
    shake(a) { shakeS.velocity += a; stage.invalidate(); },
    // the camera glides toward `point` over `ms`, stopping `near` from it, and holds there; the scroll (or coming back
    // to the page) takes it back
    // it resolves with how it ended: 'done', 'scrolled' (the visitor scrolled away), 'restored' (the page came back
    // from the browser's cache) or 'replaced' (another glide started)
    glideTo(point, ms = 600, near = GLIDE_NEAR) {
      if (glide) glide.resolve('replaced');
      return new Promise((resolve) => { glide = { to: point.toArray(), near, t: 0, ms, y: scrollY, resolve, done: false }; stage.invalidate(); });
    },
    endGlide(why = 'ended') { if (glide) { glide.resolve(why); glide = null; stage.invalidate(); } },
    glideT: () => (glide ? glide.t : null),   // how far the glide is (0..1), or null when there is none
    debugGlide: () => (glide ? glide.t : null),
    ray(clientX, clientY) {
      const r = new THREE.Raycaster();
      r.setFromCamera(new THREE.Vector2((clientX / view.w) * 2 - 1, -(clientY / view.h) * 2 + 1), camera);
      return r;
    },
    counts: () => ({ ...renderer.info.memory }),
    // builds one scene now, whatever the scroll (the stills)
    pose(name) { posing = true; return mountScene(sections.find((x) => x.name === name)); },
    freeAll() { sections.forEach(free); },
    // test seams: how far a fitted page object is from its box, in pixels; whether the camera is on the path
    debugFit(name) {
      const part = mounted.get(name);
      const fit = part && part.debug && part.debug.fit;
      if (!fit) return null;
      const r = fit.el.getBoundingClientRect();
      const px = (x, y) => { const v = new THREE.Vector3(x, y, fit.z).project(camera); return [(v.x + 1) / 2 * view.w, (1 - v.y) / 2 * view.h]; };
      const [l, t] = px(fit.x - fit.w / 2, fit.y + fit.h / 2);
      const [rr, b] = px(fit.x + fit.w / 2, fit.y - fit.h / 2);
      return Math.max(Math.abs(l - r.left), Math.abs(t - r.top), Math.abs(rr - r.right), Math.abs(b - r.bottom));
    },
    // where one of a scene's named points (part.debug.anchors) is on screen, in CSS pixels
    debugProject(name, key) {
      const part = mounted.get(name);
      const a = part && part.debug && part.debug.anchors && part.debug.anchors[key];
      if (!a) return null;
      const v = a.clone().project(camera);
      return { x: ((v.x + 1) / 2) * view.w, y: ((1 - v.y) / 2) * view.h };
    },
    debugCamera() {
      layout();
      const k = sampleKeys(keys, scrollY / vh, aspect);
      const want = new THREE.Vector3(...k.from).multiplyScalar(k.d).add(new THREE.Vector3(...k.at));
      const off = want.distanceTo(camPos);
      return { ok: off < 1e-3, off };
    },
    get form() { return form0; },
    building: () => pending.size > 0,   // a scene is being built (its frames are slow once, not for good)
    debugBuilding: () => pending.size,   // scenes still being built
    onRestore: null,
    // where the page is: the section across the middle of the screen and the time into it, in screens
    debugPlace() {
      const i = current(scrollY);
      return { name: sections[i].name, t: (scrollY - spans[i][0]) / unit };
    },
    debugTrim() {
      const cur = current(scrollY);
      sections.forEach((s, i) => { if (Math.abs(i - cur) > 1) free(s); });
    },
    update(now, dt) {
      const y = scrollY;
      lastScroll = y;
      const s = y / unit;
      { const i = current(y); place = { i, frac: (y - spans[i][0]) / Math.max(1, spans[i][1] - spans[i][0]) }; }
      // the scenes near the visitor exist; far ones are freed. The one on screen is built first and its
      // neighbours only once it is live (or has failed), so the two never share the frames: on arrival the
      // name board goes live sooner, and the first scroll is not slowed by the next room being built. Then, once
      // the next room is live, the room after next (still freed only three away): a visitor scrolling on finds it
      // built. (Built together with the next room, the two were one 90 ms frame.)
      const cur = current(y);
      const here = sections[cur];
      mountScene(here);
      const isSettled = (sec) => !sec || mounted.has(sec.name) || sec.el.hasAttribute('data-failed');
      const settled = isSettled(here);
      const nextSettled = settled && isSettled(sections[cur + 1]);   // the room after next waits for the next one
      sections.forEach((sec, i) => {
        if (i !== cur && ((Math.abs(i - cur) <= 1 && settled) || (i === cur + 2 && nextSettled))) mountScene(sec);
        else if (Math.abs(i - cur) >= 3) free(sec);
      });
      // the camera
      const k = sampleKeys(keys, s, aspect);
      camAt.set(...k.at);
      camPos.set(...k.from).multiplyScalar(k.d).add(camAt);
      const pw = pageWeight(s, heroEnd, pageStart);
      const P = stage.pointer;
      const mouse = P.inside && P.type === 'mouse';
      lookX.target = mouse ? P.nx * 0.045 * (1 - pw) : 0;
      lookY.target = mouse ? P.ny * 0.03 * (1 - pw) : 0;
      let busy = lookX.step(dt);
      busy = lookY.step(dt) || busy;
      busy = shakeS.step(dt) || busy;
      if (glide) {
        if (Math.abs(y - glide.y) > vh * 0.25) api.endGlide('scrolled');   // a smooth scroll's last few pixels do not count
        else {
          glide.t = Math.min(1, glide.t + (dt || 16) / glide.ms);
          const g = glidePose(camPos.toArray(), camAt.toArray(), glide.to, glide.t, glide.near);
          camPos.fromArray(g.pos);
          camAt.fromArray(g.at);
          if (glide.t < 1) busy = true;
          else if (!glide.done) { glide.done = true; glide.resolve('done'); }
        }
      }
      camera.position.copy(camPos);
      camera.position.x += shakeS.value * 0.04;
      camera.position.y += shakeS.value * 0.025;
      camera.lookAt(camAt);
      camera.rotateY(-lookX.value);
      camera.rotateX(lookY.value);
      camera.updateMatrixWorld();
      scene.fog.near = k.d * 1.4 + 2;
      scene.fog.far = scene.fog.near + 28;
      // the rig follows the camera and takes the colour of where the camera is
      rig.position.copy(camera.position);
      rig.quaternion.copy(camera.quaternion);
      rim.color.setRGB(...k.color);
      bounce.color.setRGB(...k.color);
      // each mounted scene poses itself; flight scenes get their chapter-local time
      const f = { now, dt, s, vh, unit, pointer: P, camera, form: form0, pageWeight: pw };
      sections.forEach((sec) => {
        const part = mounted.get(sec.name);
        if (!part) return;
        busy = part.update(sec.kind === 'flight' ? s - bases[sec.name] : null, f) || busy;
        // a scene out of range leaves the scene graph, so three.js does not walk its objects every frame
        const inGraph = part.group.parent === root;
        if (part.group.visible && !inGraph) root.add(part.group);
        else if (!part.group.visible && inGraph) root.remove(part.group);
      });
      // a piece of a scene being built, drawn out of sight just before this frame's own drawing (warmUp)
      if (warming.length) {
        if (busyFrame(now) && warmWaited < 3) warmWaited += 1;
        else {
          warmWaited = 0;
          warming.sort((a, b) => nearness(a.s) - nearness(b.s));
          const t = performance.now();
          do warmUp(warming.shift()); while (warming.length && performance.now() - t < BUDGET);
        }
        busy = true;
      }
      return busy;
    },
  };
  layout();
  // a resize lays the world out again; when the width changes (a rotation, a resized window) the page goes back to
  // the same place in the story, since every section's height is in screens while the scroll is in pixels
  addEventListener('resize', () => {
    const keep = innerWidth !== laidOut.w ? place : null;
    layout();
    if (keep && spans[keep.i]) {
      const [a, b] = spans[keep.i];
      const y = Math.round(a + keep.frac * (b - a));
      if (Math.abs(y - scrollY) > 1 && api.onRestore) api.onRestore(y);
    }
    stage.invalidate();
  });
  // back to the page from the browser's cache (after the newspaper's glide opened the article): the scroll's pose
  addEventListener('pageshow', (e) => { if (e.persisted) api.endGlide('restored'); });
  // crossing the phone breakpoint rebuilds the scenes for that form (phone camera keys, fewer objects)
  const narrow = matchMedia('(max-width: 860px)');
  narrow.addEventListener('change', () => {
    form0 = narrow.matches ? 'phone' : 'desk';
    sections.forEach(free);
    layout();
    stage.invalidate();
  });
  // content that changes size (an image arriving) lays the world out again; a window resize is handled above
  new ResizeObserver(() => { if (innerWidth === laidOut.w && innerHeight === laidOut.h) { layout(); stage.invalidate(); } }).observe(document.querySelector('main'));
  return api;
}
