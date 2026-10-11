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
import { rectToWorld } from '../lib/fit.js';
import { CAM_Z } from './stage.js';
import { KEYS, ORIGINS, COLORS } from './paths.js';
import { glow, texturesOf } from './textures.js';

const BG = 0x0c0c0d;
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
  const pending = new Map();     // name -> promise
  const docRects = new Map();    // fitted element -> its box in document coordinates
  let spans = [];                // each section's top and bottom in document coordinates
  let keys = [], bases = {}, pageStart = 99, vh = 1, aspect = 1;
  const heroEnd = 0.4;
  let lastScroll = 0;
  const lookX = new Spring(0, { stiffness: 60, damping: 16 });
  const lookY = new Spring(0, { stiffness: 60, damping: 16 });
  const shakeS = new Spring(0, { stiffness: 900, damping: 18 });
  const camPos = new THREE.Vector3(), camAt = new THREE.Vector3();

  const docBox = (el) => { const r = el.getBoundingClientRect(); return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }; };
  function layout() {
    vh = innerHeight;
    aspect = innerWidth / innerHeight;
    docRects.clear();
    for (const s of sections) if (s.kind === 'page') for (const el of s.el.querySelectorAll('[data-anchor]')) docRects.set(el, docBox(el));
    spans = sections.map((s) => { const b = docBox(s.el); return [b.top, b.top + b.height]; });
    bases = Object.fromEntries(sections.map((s, i) => [s.name, spans[i][0] / vh]));
    const awards = sections.findIndex((s) => s.name === 'awards');
    pageStart = awards >= 0 ? spans[awards][0] / vh - 0.6 : 99;
    const pagePose = (t) => ({ t, at: [...ORIGINS.page], from: [0, 0, 1], d: CAM_Z, stop: true, color: COLORS.page });
    keys = [{ t: 0, at: [...ORIGINS.hero], from: [0, 0, 1], d: CAM_Z, stop: true, color: COLORS.hero }];
    for (const s of sections) {
      if (s.kind !== 'flight' || !KEYS[s.name]) continue;
      const o = ORIGINS[s.name];
      for (const key of KEYS[s.name]) {
        const k = form === 'phone' && key.phone ? { ...key, ...key.phone } : key;
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
    return spans.length && mid < spans[0][0] ? 0 : sections.length - 1;
  }

  const anchorsOf = (s) => [s.el, ...s.el.querySelectorAll('[data-anchor]')];
  function mountScene(s) {
    if (mounted.has(s.name)) return Promise.resolve();
    if (pending.has(s.name)) return pending.get(s.name);
    const stillWanted = () => pending.get(s.name) === job;
    const job = (async () => {
      const mod = await s.load();
      const part = await mod.mount({ THREE, world: api, stage, section: s.el, form, origin: origins[s.name] ?? origins.page, invalidate: stage.invalidate });
      // shaders compile and textures go to the GPU before the scene shows, a frame at a time
      if (part.group.parent) part.group.parent.remove(part.group);
      // one piece at a time, a frame apart, so compiling never stalls the scroll
      for (const piece of [...part.group.children]) {
        if (!stillWanted()) break;
        await renderer.compileAsync(piece, camera, scene);
        await nextFrame();
      }
      for (const tex of new Set([...texturesOf(part.group), ...(part.warm || [])])) {
        if (!stillWanted()) break;
        renderer.initTexture(tex);
        await nextFrame();
      }
      if (!stillWanted()) { part.dispose(); return; }   // freed while it was being built
      root.add(part.group);
      mounted.set(s.name, part);
      if (!document.documentElement.classList.contains('frozen')) anchorsOf(s).forEach((a) => a.setAttribute('data-live', ''));
      stage.invalidate();
    })().catch((err) => {
      console.warn(`3D scene "${s.name}" did not load; its still stays.`, err);
      s.el.setAttribute('data-failed', '');
    }).finally(() => { if (pending.get(s.name) === job) pending.delete(s.name); });
    pending.set(s.name, job);
    return job;
  }
  function free(s) {
    pending.delete(s.name);
    const part = mounted.get(s.name);
    if (!part) return;
    mounted.delete(s.name);
    root.remove(part.group);
    part.dispose();
    anchorsOf(s).forEach((a) => a.removeAttribute('data-live'));
  }

  const api = {
    root, rig, glint, mounted, layout, boxToWorld,
    get lastScroll() { return lastScroll; },
    origin: (name) => origins[name].clone(),
    // a section's top, in CSS pixels from the top of the screen, from the cached layout (no layout read)
    top(name) { const i = sections.findIndex((x) => x.name === name); return i < 0 ? 0 : spans[i][0] - scrollY; },
    shake(a) { shakeS.velocity += a; stage.invalidate(); },
    ray(clientX, clientY) {
      const r = new THREE.Raycaster();
      r.setFromCamera(new THREE.Vector2((clientX / view.w) * 2 - 1, -(clientY / view.h) * 2 + 1), camera);
      return r;
    },
    counts: () => ({ ...renderer.info.memory }),
    // builds one scene now, whatever the scroll (the stills)
    pose(name) { return mountScene(sections.find((x) => x.name === name)); },
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
    debugTrim() {
      const cur = current(scrollY);
      sections.forEach((s, i) => { if (Math.abs(i - cur) > 1) free(s); });
    },
    update(now, dt) {
      const y = scrollY;
      lastScroll = y;
      const s = y / vh;
      // the scenes near the visitor exist; far ones are freed
      const cur = current(y);
      sections.forEach((sec, i) => {
        if (Math.abs(i - cur) <= 1) mountScene(sec);
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
      const f = { now, dt, s, vh, pointer: P, camera, form, pageWeight: pw };
      sections.forEach((sec) => {
        const part = mounted.get(sec.name);
        if (part) busy = part.update(sec.kind === 'flight' ? s - bases[sec.name] : null, f) || busy;
      });
      return busy;
    },
  };
  layout();
  addEventListener('resize', () => { layout(); stage.invalidate(); });
  new ResizeObserver(() => { layout(); stage.invalidate(); }).observe(document.querySelector('main'));
  return api;
}
