// Awards: the gallery wall (a page scene: the camera holds the page pose, and every object is fitted to its HTML
// box, so the 3D and the words line up). A dark, warm wall runs behind the section; each win is a framed shadow
// box of its real photos (a thin dark-gold moulding, an off-white mat, the photos stacked behind the mat's window,
// shown exactly as shot) under its own spotlight, with its placing on a small gold flip-board below like a
// plaque. As the section scrolls in the spotlights come up one after another and the boards turn to their
// placings, all tied to the scroll. Point at a frame and it tilts toward the pointer under a brighter light. Next
// photo (or a drag past a third of the photo) lifts the front photo out past the frame's edge and slips it in
// behind the others, showing the next; a short drag springs back; a tap opens the photo full size.
import * as THREE from 'three';
import { createBoard } from './board.js';
import { loadTexture, glow, disposeTree, nextFrame } from './textures.js';
import { fitScale } from '../lib/fit.js';
import { Spring } from '../lib/motion.js';
import { awState, awProgress, slidePose, SLIDE_MS, REST_Z, LIFT_Z, GAP_Z } from './awards-timeline.js';
import { onTap } from './tap.js';

const WARM = 0xffd49a;
const FRAME = { w: 1, h: 1 / 1.5, mould: 0.045, depth: 0.06 };   // built one unit wide, scaled to its 3:2 box
const OPEN = { w: 0.8, h: 0.8 / 1.5 };                            // the mat's window

// the wall fades out at its edges into the page's own dark
function fadeMap() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  const edge = (u) => Math.min(1, Math.min(u, 1 - u) / 0.18);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const a = edge(x / 255) * edge(y / 255);
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(a * a * (3 - 2 * a) * 255);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}

// a shadow-box frame: dark-gold moulding, an off-white mat with a window, a dark back
function frameBox() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0x5a4320, metalness: 0.85, roughness: 0.4 });
  const { w, h, mould: m, depth: d } = FRAME;
  const bar = (bw, bh, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), gold); b.position.set(x, y, d / 2); g.add(b); };
  bar(w, m, 0, h / 2 - m / 2);
  bar(w, m, 0, -h / 2 + m / 2);
  bar(m, h - 2 * m, -w / 2 + m / 2, 0);
  bar(m, h - 2 * m, w / 2 - m / 2, 0);
  const iw = w - 2 * m, ih = h - 2 * m;
  const shape = new THREE.Shape();
  shape.moveTo(-iw / 2, -ih / 2); shape.lineTo(iw / 2, -ih / 2); shape.lineTo(iw / 2, ih / 2); shape.lineTo(-iw / 2, ih / 2); shape.lineTo(-iw / 2, -ih / 2);
  const hole = new THREE.Path();
  hole.moveTo(-OPEN.w / 2, -OPEN.h / 2); hole.lineTo(-OPEN.w / 2, OPEN.h / 2); hole.lineTo(OPEN.w / 2, OPEN.h / 2); hole.lineTo(OPEN.w / 2, -OPEN.h / 2); hole.lineTo(-OPEN.w / 2, -OPEN.h / 2);
  shape.holes.push(hole);
  const mat = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0xeee9df, roughness: 0.95, metalness: 0 }));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0x0e0d0b, roughness: 1 }));
  back.position.z = -0.08;
  g.add(mat, back);
  return g;
}

// a photo on thin white paper, big enough to fill the window, shown exactly as shot (not lit)
function photo(tex) {
  const a = tex.image.width / tex.image.height;
  const pw = Math.max(OPEN.w, OPEN.h * a) * 1.02, ph = pw / a;
  const g = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(pw + 0.03, ph + 0.03), new THREE.MeshBasicMaterial({ color: 0xf4f2ed }));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  pic.position.z = 0.001;
  g.add(paper, pic);
  return g;
}

export async function mount({ world, stage, section }) {
  const items = [...section.querySelectorAll('.aw')];
  const group = new THREE.Group();
  const wallTex = await loadTexture('assets/3d/aw-wall.webp');
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: wallTex, alphaMap: fadeMap(), transparent: true, depthWrite: false, roughness: 0.95, metalness: 0 }));
  wall.renderOrder = -2;
  group.add(wall);

  const frames = [];
  for (const [i, el] of items.entries()) {
    const stackEl = el.querySelector('.aw-stack'), placeEl = el.querySelector('.aw-place');
    const shots = [...stackEl.querySelectorAll('.shot')];
    const tex = await Promise.all(shots.map((s) => loadTexture(`assets/3d/aw-${s.dataset.photo}.webp`, { bitmap: true })));
    const frame = frameBox();
    const prints = tex.map((t) => { const p = photo(t); frame.add(p); return p; });
    const pool = glow(WARM, 1, 1, 0), beam = glow(WARM, 1, 1, 0);
    const text = placeEl.textContent.trim().toUpperCase();
    const board = await createBoard({ rows: [{ text, color: 'gold' }], scrub: true });
    group.add(pool, beam, frame, board.group);
    const top = shots.findIndex((s) => s.hasAttribute('data-on'));
    frames.push({
      i, el, stackEl, placeEl, shots, prints, frame, pool, beam, board, tex,
      order: prints.map((_, k) => (k + Math.max(0, top)) % prints.length),   // order[0] is in front
      tiltX: new Spring(0, { stiffness: 120, damping: 20 }), tiltY: new Spring(0, { stiffness: 120, damping: 20 }),
      bright: new Spring(0, { stiffness: 120, damping: 20 }),
      hover: null, drag: null, slide: null, back: null, pending: undefined, byHand: false, fromDrag: false,
    });
    await nextFrame();
  }
  world.root.add(group);

  const fitOf = (s) => world.boxToWorld(s.stackEl, 'page');
  let k = stage.view.k;
  const reorder = (s, top) => { s.order = s.prints.map((_, j) => (j + top) % s.prints.length); };
  // the gallery script (js/script.js) is the one source of truth: it moves data-on and tells us
  // a slide out of the front photo; the photo to show next is put straight behind it first (out of sight), so the
  // slide reveals that one, whichever way the gallery moved
  function startSlide(s, dir, fromX, fromZ) {
    const target = s.pending;
    if (target !== undefined && s.order[0] !== target) s.order = [s.order[0], target, ...s.order.slice(1).filter((k) => k !== target)];
    s.slide = { t: 0, dir, fromX, fromZ, pi: s.order[0] };
    stage.invalidate();
  }
  function onGal(s, e) {
    if (s.fromDrag) { s.fromDrag = false; reorder(s, e.detail.index); return; }
    s.pending = e.detail.index;
    if (s.slide) return;   // this slide lands first, then the next one runs on to the latest press
    s.drag = null;
    s.back = null;
    startSlide(s, 1, 0, REST_Z);
  }
  const listeners = [];
  const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); };
  frames.forEach((s) => {
    on(s.stackEl, 'gal:show', (e) => onGal(s, e));
    on(s.stackEl, 'pointermove', (e) => {
      const r = s.stackEl.getBoundingClientRect();
      s.hover = { u: (e.clientX - r.left) / r.width - 0.5, v: (e.clientY - r.top) / r.height - 0.5 };
      if (s.drag && e.pointerId === s.drag.id) { s.drag.dx = e.clientX - s.drag.x0; s.drag.dy = e.clientY - s.drag.y0; }
      stage.invalidate();
    });
    on(s.stackEl, 'pointerleave', () => { s.hover = null; stage.invalidate(); });
    on(s.stackEl, 'pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || s.slide || s.back) return;
      s.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
      s.stackEl.setPointerCapture(e.pointerId);
      e.preventDefault();   // a press here is a drag of the photo, not a text selection or a link follow
    });
    const release = (e, cancelled) => {
      const d = s.drag;
      if (!d || e.pointerId !== d.id) return;
      s.drag = null;
      if (!cancelled && Math.hypot(d.dx, d.dy) < 6) { s.shots[s.order[0]].click(); return; }   // a tap: full size
      const x = (d.dx * k) / fitOf(s).w;   // in the frame's units (the frame is one unit wide)
      if (!cancelled && Math.abs(x) > OPEN.w / 3) {
        s.slide = { t: 0, dir: Math.sign(x), fromX: x, fromZ: LIFT_Z, pi: s.order[0] };
        s.byHand = true;
      } else {
        s.back = { x, t: 0 };   // not far enough: it springs back
      }
      stage.invalidate();
    };
    on(s.stackEl, 'pointerup', (e) => release(e, false));
    on(s.stackEl, 'pointercancel', (e) => release(e, true));   // a touch that turned into a scroll
    // the placing's board flickers under the mouse and ripples on a tap, like the name board
    const ndc = (e) => new THREE.Vector2((e.clientX / stage.view.w) * 2 - 1, -(e.clientY / stage.view.h) * 2 + 1);
    on(s.placeEl, 'pointermove', (e) => { if (e.pointerType === 'mouse') { s.board.hover(s.board.pick(stage.camera, ndc(e))); stage.invalidate(); } });
    on(s.placeEl, 'pointerleave', () => s.board.hover(-1));
    s.offTap = onTap(s.placeEl, (e) => { s.board.ripple(s.board.pick(stage.camera, ndc(e))); stage.invalidate(); });
    s.next = s.stackEl.querySelector('[data-gal-step]');
  });

  const debug = {
    boardText: (i) => frames[i].board.text(),
    resting: (i) => !frames[i].slide && !frames[i].drag && !frames[i].back,
    topPhoto: (i) => frames[i].shots[frames[i].order[0]].dataset.photo,
    slideT: (i) => (frames[i].slide ? frames[i].slide.t : null),
    // the photo showing in the window: mid-slide, the one being revealed behind the front
    revealed: (i) => frames[i].shots[frames[i].order[frames[i].slide ? 1 : 0]].dataset.photo,
  };
  return {
    group,
    debug,
    warm: [...frames.flatMap((s) => s.tex), wallTex],
    update(local, f) {
      k = stage.view.k;
      let busy = false;
      const boxes = frames.map(fitOf);
      const visible = boxes.some((b) => Math.abs(b.y - world.origin('page').y) < 40);
      group.visible = visible;
      if (!visible) return false;
      const arrival = awProgress(world.top('awards'), f.vh);
      const z0 = boxes[0].z;
      // the wall behind every frame and its words, fading into the page at its edges
      const left = Math.min(...boxes.map((b) => b.x - b.w / 2)), right = Math.max(...boxes.map((b) => b.x + b.w / 2));
      const top = Math.max(...boxes.map((b) => b.y + b.h / 2)), bottom = Math.min(...boxes.map((b) => b.y - b.h / 2));
      const ww = (right - left) * 1.6, wh = top - bottom + boxes[0].h * 2.4;
      wall.scale.set(ww, wh, 1);
      wall.position.set((left + right) / 2, (top + bottom) / 2, z0 - 0.3);
      wallTex.repeat.set(ww / (boxes[0].w * 0.6), wh / (boxes[0].w * 0.6));
      frames.forEach((s, i) => {
        const b = boxes[i];
        const st = awState(arrival, i);
        const scale = fitScale({ w: FRAME.w, h: FRAME.h }, b);
        s.frame.scale.setScalar(scale);
        s.frame.position.set(b.x, b.y, z0);
        // hover: the frame tilts toward the pointer (at most 4° each way) and its light brightens
        const h = s.hover && !s.drag && !s.slide ? s.hover : null;
        s.tiltX.target = h ? h.v * 0.14 : 0;
        s.tiltY.target = h ? h.u * 0.14 : 0;
        s.bright.target = h ? 1 : 0;
        for (const sp of [s.tiltX, s.tiltY, s.bright]) busy = sp.step(f.dt) || busy;
        s.frame.rotation.set(s.tiltX.value, s.tiltY.value, 0);
        // the photos: stacked behind the window; the front one follows a drag, springs back, or slides
        if (s.slide) { s.slide.t = Math.min(1, s.slide.t + f.dt / SLIDE_MS); busy = true; }
        else if (s.back) { s.back.t = Math.min(1, s.back.t + f.dt / 260); busy = true; }
        const n = s.prints.length;
        s.order.forEach((pi, depth) => {
          const p = s.prints[pi];
          p.position.set(0, 0, REST_Z - depth * GAP_Z);
          if (depth !== 0) return;
          if (s.drag) p.position.set((s.drag.dx * k) / b.w, 0, LIFT_Z);
          else if (s.back) {
            const e = 1 - (1 - s.back.t) ** 3;
            p.position.set(s.back.x * (1 - e), 0, LIFT_Z + (REST_Z - LIFT_Z) * e);
          }
        });
        if (s.slide) {
          const pose = slidePose(s.slide.t, { w: OPEN.w, dir: s.slide.dir, back: REST_Z - n * GAP_Z, fromX: s.slide.fromX, fromZ: s.slide.fromZ });
          s.prints[s.slide.pi].position.set(pose.x, 0, pose.z);
          if (s.slide.t >= 1) {
            s.slide = null;
            if (s.byHand) { s.byHand = false; s.fromDrag = true; s.pending = undefined; s.next.click(); }   // the gallery moves on (and tells us)
            else {
              s.order = [...s.order.slice(1), s.order[0]];   // the front goes to the back; the revealed photo is in front
              if (s.pending !== undefined && s.pending !== s.order[0]) startSlide(s, 1, 0, REST_Z);   // on to a later press
              else s.pending = undefined;
            }
          }
        }
        if (s.back && s.back.t >= 1) s.back = null;
        // the spotlight: a warm pool on the wall around the frame and a soft beam above it
        const lit = st.light;
        s.pool.position.set(b.x, b.y + b.h * 0.12, z0 - 0.28);
        s.pool.scale.set(b.w * 1.9, b.h * 2.3, 1);
        s.pool.material.opacity = 0.2 * lit + 0.1 * s.bright.value;
        s.beam.position.set(b.x, b.y + b.h * 1.05, z0 - 0.29);
        s.beam.scale.set(b.w * 0.7, b.h * 2.2, 1);
        s.beam.material.opacity = 0.07 * lit + 0.04 * s.bright.value;
        s.pool.visible = s.beam.visible = lit > 0.001 || s.bright.value > 0.001;
        // the placing on its flip-board, turned up with the scroll
        const pb = world.boxToWorld(s.placeEl, 'page');
        s.board.group.scale.setScalar(fitScale(s.board.size, pb));
        s.board.group.position.set(pb.x, pb.y, pb.z);
        s.board.scrub(st.board);
        busy = s.board.update(f.now, f.dt) || busy;
      });
      return busy;
    },
    dispose() {
      listeners.forEach(([el, type, fn, opts]) => el.removeEventListener(type, fn, opts));
      frames.forEach((s) => { s.offTap(); s.board.dispose(); });
      world.root.remove(group);
      disposeTree(group);
    },
  };
}
