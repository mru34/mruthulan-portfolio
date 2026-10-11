// Awards: the photo table (a page scene: the camera holds the page pose, and every object is fitted to its HTML
// box, so the 3D and the words always line up). Each win is a stack of its real photos, printed with a white
// border, on a long dark table; as the section arrives the stacks stand up one after another, a soft light
// brightening over each, and each placing turns up on a small gold flip-board, all tied to the scroll. Point at
// a stack and its prints lift and fan out with a gloss that follows the pointer; flick the top print and it
// slides off with momentum, settles and tucks under the stack, showing the next photo (Next photo does the
// same from the keyboard); tap a print to open it full size.
import * as THREE from 'three';
import { createBoard } from './board.js';
import { loadTexture, print, glow, disposeTree, nextFrame } from './textures.js';
import { fitScale } from '../lib/fit.js';
import { Spring, lerp } from '../lib/motion.js';
import { flickStep } from '../lib/physics.js';
import { mulberry32 } from '../lib/scatter.js';
import { awState, awProgress } from './awards-timeline.js';

const GOLD = 0xe8b64c;
const UNIT = 1;   // prints are built one unit wide and scaled to their box each frame

export async function mount({ world, stage, section }) {
  const items = [...section.querySelectorAll('.aw')];
  const group = new THREE.Group();
  const table = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x15120c, roughness: 0.6, metalness: 0.25 }));
  table.rotation.x = -Math.PI / 2;
  group.add(table);

  const stacks = [];
  for (const [i, el] of items.entries()) {
    const stackEl = el.querySelector('.aw-stack'), placeEl = el.querySelector('.aw-place');
    const shots = [...stackEl.querySelectorAll('.shot')];
    const tex = await Promise.all(shots.map((s) => loadTexture(`assets/3d/aw-${s.dataset.photo}.webp`)));
    const r = mulberry32(i + 3);
    const prints = tex.map((t) => {
      const a = t.image.width / t.image.height;
      const g = print(t, UNIT * Math.min(1, a / 1.5), (UNIT * Math.min(1, a / 1.5)) / a, { border: 0.045, thick: 0.008 });
      const holder = new THREE.Group();   // the print's resting jitter; the print itself moves on flicks
      holder.add(g);
      holder.rotation.z = (r() - 0.5) * 0.08;
      holder.position.set((r() - 0.5) * 0.03, (r() - 0.5) * 0.03, 0);
      return { g, holder, a };
    });
    const stack = new THREE.Group();     // stands on the table at the box's bottom edge, rotating up about it
    const inner = new THREE.Group();     // the prints, lifted half a box above that edge
    stack.add(inner);
    prints.forEach((p) => inner.add(p.holder));
    const pool = glow(GOLD, 1, 1, 0);
    pool.rotation.x = -Math.PI / 2;
    const halo = glow(GOLD, 1, 1, 0);
    const gloss = glow(0xffffff, 1, 1, 0);
    const text = placeEl.textContent.trim().toUpperCase();
    const board = await createBoard({ rows: [{ text, color: 'gold' }], scrub: true });
    group.add(stack, pool, halo, gloss, board.group);
    const top = shots.findIndex((s) => s.hasAttribute('data-on'));
    stacks.push({
      el, stackEl, placeEl, shots, prints, stack, inner, pool, halo, gloss, board, tex,
      order: prints.map((_, k) => (k + Math.max(0, top)) % prints.length),   // order[0] is on top
      lift: new Spring(0, { stiffness: 140, damping: 20 }), fan: new Spring(0, { stiffness: 120, damping: 20 }),
      tiltX: new Spring(0, { stiffness: 120, damping: 20 }), tiltY: new Spring(0, { stiffness: 120, damping: 20 }),
      hover: null, drag: null, fly: null, tuck: null, fromDrag: false,
    });
    await nextFrame();
  }
  world.root.add(group);

  // the box's world rectangle and the scale a print needs to fill it (the box is the photo frame, 3:2)
  const fitOf = (s) => world.boxToWorld(s.stackEl, 'page');
  let k = stage.view.k;

  function startFly(s, v) {
    s.fly = { x: 0, y: 0, vx: v.vx, vy: v.vy, rot: 0, vr: v.vr, resting: false };
    stage.invalidate();
  }
  function onGal(s, e) {
    if (s.fromDrag) { s.fromDrag = false; reorder(s, e.detail.index); return; }
    if (s.fly || s.tuck) { reorder(s, e.detail.index); return; }
    s.pending = e.detail.index;
    const w = fitOf(s).w;
    startFly(s, { vx: w * 1.6, vy: w * 0.25, vr: 1.4 });   // the top print is flicked off by the button
  }
  function reorder(s, top) {
    s.order = s.prints.map((_, j) => (j + top) % s.prints.length);
  }
  const listeners = [];
  const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); };
  stacks.forEach((s, i) => {
    on(s.stackEl, 'gal:show', (e) => onGal(s, e));
    on(s.stackEl, 'pointermove', (e) => {
      const r = s.stackEl.getBoundingClientRect();
      s.hover = { u: (e.clientX - r.left) / r.width - 0.5, v: (e.clientY - r.top) / r.height - 0.5 };
      if (s.drag && e.pointerId === s.drag.id) {
        const now = performance.now();
        const dt = Math.max(1, now - s.drag.t);
        s.drag.vx = lerp(s.drag.vx, (e.clientX - s.drag.lx) / dt, 0.5);
        s.drag.vy = lerp(s.drag.vy, (e.clientY - s.drag.ly) / dt, 0.5);
        s.drag.lx = e.clientX; s.drag.ly = e.clientY; s.drag.t = now;
        s.drag.dx = e.clientX - s.drag.x0; s.drag.dy = e.clientY - s.drag.y0;
      }
      stage.invalidate();
    });
    on(s.stackEl, 'pointerleave', () => { s.hover = null; stage.invalidate(); });
    on(s.stackEl, 'pointerdown', (e) => {
      if (e.target.closest('button') || s.fly || s.tuck) return;
      s.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), vx: 0, vy: 0, dx: 0, dy: 0 };
      s.stackEl.setPointerCapture(e.pointerId);
      e.preventDefault();   // a press here is a drag of the print, not a text selection or a link follow
    });
    const release = (e, cancelled) => {
      const d = s.drag;
      if (!d || e.pointerId !== d.id) return;
      s.drag = null;
      const moved = Math.hypot(d.dx, d.dy);
      if (!cancelled && moved < 6) { s.shots[s.order[0]].click(); return; }   // a tap: the photo full size
      const speed = Math.hypot(d.vx, d.vy);
      const w = fitOf(s).w;
      if (!cancelled && (moved * k > 0.25 * w || speed > 0.6)) {
        s.fly = { x: d.dx * k, y: -d.dy * k, vx: d.vx * 1000 * k, vy: -d.vy * 1000 * k, rot: 0, vr: d.vx * 2, resting: false };
        s.flyByHand = true;
      } else {
        s.back = { x: d.dx * k, y: -d.dy * k, t: 0 };   // not far enough: it springs back
      }
      stage.invalidate();
    };
    on(s.stackEl, 'pointerup', (e) => release(e, false));
    on(s.stackEl, 'pointercancel', (e) => release(e, true));   // a touch that turned into a scroll
    // the placing's board flickers under the mouse and ripples on a press, like the name board
    const ndc = (e) => new THREE.Vector2((e.clientX / stage.view.w) * 2 - 1, -(e.clientY / stage.view.h) * 2 + 1);
    on(s.placeEl, 'pointermove', (e) => { if (e.pointerType === 'mouse') { s.board.hover(s.board.pick(stage.camera, ndc(e))); stage.invalidate(); } });
    on(s.placeEl, 'pointerleave', () => s.board.hover(-1));
    on(s.placeEl, 'pointerdown', (e) => { s.board.ripple(s.board.pick(stage.camera, ndc(e))); stage.invalidate(); });
    s.next = s.stackEl.querySelector('[data-gal-step]');
    s.i = i;
  });

  const debug = {
    boardText: (i) => stacks[i].board.text(),
    resting: (i) => !stacks[i].fly && !stacks[i].tuck && !stacks[i].drag && !stacks[i].back,
    topPhoto: (i) => stacks[i].shots[stacks[i].order[0]].dataset.photo,
  };
  return {
    group,
    debug,
    warm: stacks.flatMap((s) => s.tex),
    update(local, f) {
      k = stage.view.k;
      let busy = false;
      const boxes = stacks.map(fitOf);
      const visible = boxes.some((b) => Math.abs(b.y - world.origin('page').y) < 40);
      group.visible = visible;
      if (!visible) return false;
      const arrival = awProgress(world.top('awards'), f.vh);
      // the table under all three stacks, running back into the dark
      const left = Math.min(...boxes.map((b) => b.x - b.w / 2)), right = Math.max(...boxes.map((b) => b.x + b.w / 2));
      const bottom = Math.min(...boxes.map((b) => b.y - b.h / 2));
      const z0 = boxes[0].z;
      const narrow = boxes.length > 1 && Math.abs(boxes[0].y - boxes[1].y) > boxes[0].h;   // one stack per row
      const tw = (right - left) * (narrow ? 1.5 : 1.25);
      if (narrow) {
        // on a phone the stacks are a column: the table stands behind them, running down the screen
        const topMost = Math.max(...boxes.map((b) => b.y + b.h / 2));
        table.rotation.x = 0;
        table.scale.set(tw, topMost - bottom + boxes[0].h * 1.2, 1);
        table.position.set((left + right) / 2, (topMost + bottom) / 2, z0 - 0.5);
      } else {
        table.rotation.x = -Math.PI / 2;
        table.scale.set(tw, 40, 1);
        table.position.set((left + right) / 2, bottom - 0.01, z0 + 1.5 - 20);
      }
      stacks.forEach((s, i) => {
        const b = boxes[i];
        const st = awState(arrival, i);
        // the stack: prints scaled to fill the box, standing up about the box's bottom edge
        const scale = fitScale({ w: UNIT, h: UNIT / 1.5 }, b) * 0.94;
        s.stack.position.set(b.x, b.y - b.h / 2, z0);
        s.stack.rotation.x = -(1 - st.stand) * Math.PI / 2;
        s.inner.position.set(0, b.h / 2, 0);
        s.inner.scale.setScalar(scale);
        // hover: the top print lifts and leans toward the pointer, the ones under it fan out
        const h = s.hover && !s.drag && !s.fly && !s.tuck ? s.hover : null;
        s.lift.target = h ? 1 : 0;
        s.fan.target = h ? 1 : 0;
        s.tiltX.target = h ? h.v * 0.18 : 0;
        s.tiltY.target = h ? h.u * 0.24 : 0;
        for (const sp of [s.lift, s.fan, s.tiltX, s.tiltY]) busy = sp.step(f.dt) || busy;
        // a flick: the top print slides off with momentum, settles, then tucks under the stack
        if (s.fly) {
          Object.assign(s.fly, flickStep(s.fly, f.dt, { friction: 3.6 }));
          busy = true;
          if (s.fly.resting || Math.hypot(s.fly.x, s.fly.y) > b.w * 1.6) { s.tuck = { from: { ...s.fly }, t: 0 }; s.fly = null; }
        } else if (s.tuck) {
          s.tuck.t = Math.min(1, s.tuck.t + f.dt / 350);
          busy = true;
          if (s.tuck.t >= 1) {
            s.tuck = null;
            if (s.flyByHand) { s.flyByHand = false; s.fromDrag = true; s.next.click(); }   // the gallery moves on (and tells us)
            else if (s.pending !== undefined) { reorder(s, s.pending); s.pending = undefined; }
          }
        } else if (s.back) {
          s.back.t = Math.min(1, s.back.t + f.dt / 260);
          busy = true;
          if (s.back.t >= 1) s.back = null;
        }
        const n = s.prints.length;
        s.order.forEach((pi, depth) => {
          const p = s.prints[pi];
          const isTop = depth === 0;
          p.holder.position.z = -depth * 0.025;
          p.holder.rotation.z = (p.holder.userData.rz ??= p.holder.rotation.z) + (depth ? (depth - (n - 1) / 2) * 0.06 * s.fan.value : 0);
          p.g.position.set(0, 0, 0);
          p.g.rotation.set(0, 0, 0);
          if (!isTop) return;
          p.g.position.z = s.lift.value * 0.12;
          p.g.rotation.set(s.tiltX.value, s.tiltY.value, 0);
          const toLocal = 1 / scale;
          if (s.drag) p.g.position.set(s.drag.dx * k * toLocal, -s.drag.dy * k * toLocal, 0.15);
          if (s.fly) { p.g.position.set(s.fly.x * toLocal, s.fly.y * toLocal, 0.15); p.g.rotation.z = s.fly.rot; }
          if (s.back) { const e = 1 - (1 - s.back.t) ** 3; p.g.position.set(s.back.x * toLocal * (1 - e), s.back.y * toLocal * (1 - e), 0.15 * (1 - e)); }
          if (s.tuck) {
            const e = s.tuck.t * s.tuck.t * (3 - 2 * s.tuck.t);
            p.g.position.set(lerp(s.tuck.from.x * toLocal, 0, e), lerp(s.tuck.from.y * toLocal, 0, e), lerp(0.15, -n * 0.025 - 0.02, e));
            p.g.rotation.z = lerp(s.tuck.from.rot, 0, e);
          }
        });
        // the light over the stack and the gloss that follows the pointer
        const glowBoost = s.lift.value * 0.25;
        s.pool.visible = !narrow;
        s.pool.position.set(b.x, bottom + 0.005, z0 + 0.4);
        s.pool.scale.set(b.w * 1.6, b.w * 1.1, 1);
        s.pool.material.opacity = 0.32 * st.pool + glowBoost * 0.4;
        s.halo.position.set(b.x, b.y, z0 - 0.6);
        s.halo.scale.set(b.w * 1.5, b.h * 1.7, 1);
        s.halo.material.opacity = 0.16 * st.pool + glowBoost * 0.2;
        s.gloss.visible = Boolean(h);
        if (h) {
          s.gloss.position.set(b.x + h.u * b.w * 0.9, b.y - h.v * b.h * 0.9 + 0, z0 + 0.2);
          s.gloss.scale.setScalar(b.w * 0.55);
          s.gloss.material.opacity = 0.1 * s.lift.value;
        }
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
      stacks.forEach((s) => s.board.dispose());
      world.root.remove(group);
      disposeTree(group);
    },
  };
}
