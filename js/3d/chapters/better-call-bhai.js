// 03 · Better Call Bhai: the shop. Two glass barber poles with chrome caps frame the scene and turn with the
// scroll; grab one and spin it, and it keeps turning and slows down on its own. Between them the phone steps
// through the real booking (home, form, time slots, Booking Confirmed), each screen sliding up as the next
// arrives, and the day's real time slots lift off the phone onto a wall behind it, the taken ones struck
// through and the chosen 15:00 lit, as in the app. The laptop shows the desktop booking page.
import * as THREE from 'three';
import { makePhone, makeLaptop, makeStand } from '../devices.js';
import { loadTexture, bez, glow, screenGeometry, cropUV, disposeTree, nextFrame } from '../textures.js';
import { lerp } from '../../lib/motion.js';
import { spinStep } from '../../lib/physics.js';
import { bbScreen, bbSlots } from './bcb-timeline.js';

export const SLOT_GRID = [116, 784, 1054, 1850];   // must match design/build_3d_assets.py (tested)
// inside that crop: each slot pill's offset, pitch and size, in pixels of the 1170 x 2532 capture
const PILL = { x0: 2, y0: 2, px: 322.3, py: 156.1, w: 290, h: 124, cols: 3, n: 20, chosen: 10 };
const CAPTURE = { w: 1170, h: 2532 };
const GRID = { w: SLOT_GRID[2] - SLOT_GRID[0], h: SLOT_GRID[3] - SLOT_GRID[1] };
const YELLOW = 0xe3b53a;
const FLOOR = -1.0;
const POLES = [[-2.5, -0.6], [2.9, -0.8]];   // x, z
const WALL = { x: 1.25, y: 0.75, z: -1.3, scale: 4.2 };

// the pole's stripes: three bands, each band rising one full repeat across the width, so the pattern wraps
// around the drum and repeats down it without a seam
function stripes() {
  const W = 256, P = 144, c = document.createElement('canvas');
  c.width = W; c.height = 3 * P;
  const g = c.getContext('2d');
  const cols = ['#f2efe6', '#e3b53a', '#151515'];   // the shop's own yellow, black and white
  for (let i = -6; i < 12; i++) {
    g.fillStyle = cols[((i % 3) + 3) % 3];
    const y = i * (P / 3);
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + P); g.lineTo(W, y + P + P / 3); g.lineTo(0, y + P / 3); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 3);
  return t;
}

// a barber pole about 7.4 dm tall: the striped drum inside a glass tube, a chrome dome and base
function pole() {
  const g = new THREE.Group();
  const chrome = new THREE.MeshStandardMaterial({ color: 0xdadde2, metalness: 1, roughness: 0.14 });
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 6.2, 48, 1, true), new THREE.MeshStandardMaterial({ map: stripes(), roughness: 0.5 }));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 6.4, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false }));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), chrome);
  cap.position.y = 3.35;
  const ring = (y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.18, 48), chrome); m.position.y = y; return m; };
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.3, 48), chrome);
  base.position.y = -3.35;
  g.add(inner, glass, cap, ring(3.25), ring(-3.25), base);
  g.position.y = FLOOR + 3.5;
  return { group: g, inner, glass };
}

export async function mount({ world, stage, section, origin, form }) {
  const desk = form === 'desk';
  const names = ['bb-phone-1', 'bb-phone-2', 'bb-phone-3', 'bb-phone-4', 'bb-slots', ...(desk ? ['bb-laptop'] : [])];
  const tex = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await loadTexture(`assets/3d/${n}.webp`)])));
  const screensTex = [1, 2, 3, 4].map((i) => tex[`bb-phone-${i}`]);

  const group = new THREE.Group();
  group.position.copy(origin);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x14120c, roughness: 0.85, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR;
  const pool = glow(YELLOW, 10, 6, 0.12);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.3, FLOOR + 0.01, -1.5);
  const behind = glow(YELLOW, 14, 8, 0.2);
  behind.position.set(0.5, 1.4, -4.5);
  group.add(floor, pool, behind);

  const poles = POLES.map(([x, z]) => {
    const p = pole();
    p.group.position.x = x;
    p.group.position.z = z;
    group.add(p.group);
    return p;
  });

  await nextFrame();
  // the phone on its stand; its screen is two slides that pass each other inside the screen's edges
  const phone = makePhone({ screen: screensTex[0] });
  phone.group.position.set(-0.2, FLOOR + 0.04 + 0.72, 1.0);
  phone.group.rotation.set(-0.2, 0.12, 0);
  const stand = makeStand(FLOOR);
  stand.position.set(-0.2, 0, 0.98);
  stand.rotation.y = 0.12;
  group.add(phone.group, stand);
  if (desk) {
    const laptop = makeLaptop({ screen: tex['bb-laptop'] });
    laptop.group.position.set(-1.9, FLOOR + 0.0775, -2.6);
    laptop.group.rotation.y = 0.45;
    group.add(laptop.group);
  }
  group.updateMatrixWorld(true);
  const sw = phone.screenSize.w, sh = phone.screenSize.h;
  const toWorld = (v) => phone.screen.localToWorld(v.clone());   // the group already stands at the origin
  const up = new THREE.Vector3(0, 1, 0).transformDirection(phone.screen.matrixWorld);
  const top = toWorld(new THREE.Vector3(0, sh / 2, 0)), bottom = toWorld(new THREE.Vector3(0, -sh / 2, 0));
  const clip = [new THREE.Plane(up.clone().negate(), up.dot(top)), new THREE.Plane(up.clone(), -up.dot(bottom))];
  const slideGeo = screenGeometry(sw, sh, 0.085);
  const slide = (z) => {
    const m = new THREE.Mesh(slideGeo, new THREE.MeshBasicMaterial({ map: screensTex[0], toneMapped: false, clippingPlanes: clip }));
    m.position.z = z;
    phone.screen.add(m);
    return m;
  };
  const cur = slide(0.0006), next = slide(0.0007);

  await nextFrame();
  // the time slots: each a crop of its pill from the capture, starting where it sits on the phone's screen
  const slots = [];
  for (let i = 0; i < PILL.n; i++) {
    const c = i % PILL.cols, r = Math.floor(i / PILL.cols);
    const left = PILL.x0 + c * PILL.px, topPx = PILL.y0 + r * PILL.py;
    const geo = cropUV(new THREE.PlaneGeometry(1, 1), [left / GRID.w, 1 - (topPx + PILL.h) / GRID.h, (left + PILL.w) / GRID.w, 1 - topPx / GRID.h]);
    const w = (PILL.w / CAPTURE.w) * sw, h = (PILL.h / CAPTURE.h) * sh;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex['bb-slots'], toneMapped: false }));
    m.scale.set(w, h, 1);
    const onPhone = new THREE.Vector3(((SLOT_GRID[0] + left + PILL.w / 2) / CAPTURE.w - 0.5) * sw, (0.5 - (SLOT_GRID[1] + topPx + PILL.h / 2) / CAPTURE.h) * sh, 0.01);
    const from = group.worldToLocal(toWorld(onPhone));
    const to = new THREE.Vector3(WALL.x + (c - 1) * w * WALL.scale * 1.12, WALL.y + (3 - r) * h * WALL.scale * 1.25, WALL.z);
    group.add(m);
    slots.push({ m, from, to, w, h });
  }
  const chosen = glow(YELLOW, 1.6, 0.8, 0.45);
  chosen.position.copy(slots[PILL.chosen].to).add(new THREE.Vector3(0, 0, -0.02));
  group.add(chosen);
  world.root.add(group);

  // grab a pole and spin it: it keeps turning after the release and slows down on its own
  const spins = poles.map(() => ({ angle: 0, vel: 0, resting: true }));
  const pin = section.querySelector('.pin');
  pin.style.touchAction = 'pan-y';   // a vertical swipe still scrolls the page
  let drag = null;
  const onDown = (e) => {
    if (e.target.closest('a, button')) return;
    const hit = world.ray(e.clientX, e.clientY).intersectObjects(poles.map((p) => p.glass), false)[0];
    if (!hit) return;
    drag = { k: poles.findIndex((p) => p.glass === hit.object), x: e.clientX, t: performance.now(), vel: 0, id: e.pointerId };
    pin.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now();
    const turn = (e.clientX - drag.x) * 0.02;
    const s = spins[drag.k];
    s.angle += turn;
    s.resting = false;
    drag.vel = lerp(drag.vel, turn / Math.max(0.008, (now - drag.t) / 1000), 0.6);
    drag.x = e.clientX;
    drag.t = now;
    stage.invalidate();
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const s = spins[drag.k];
    s.vel = Math.max(-25, Math.min(25, drag.vel));   // at most about four turns a second
    s.resting = Math.abs(s.vel) < 0.02;
    drag = null;
    stage.invalidate();
  };
  pin.addEventListener('pointerdown', onDown);
  pin.addEventListener('pointermove', onMove);
  pin.addEventListener('pointerup', onUp);
  pin.addEventListener('pointercancel', onUp);

  const debug = { anchors: { pole0: new THREE.Vector3(POLES[0][0], 1.2, POLES[0][1]).add(origin) } };
  Object.defineProperty(debug, 'spin', { get: () => ({ ...spins[0] }) });
  return {
    group,
    debug,
    update(t, f) {
      const visible = t > -1.2 && t < 1.7;
      group.visible = visible;
      if (!visible) return false;
      let busy = false;
      spins.forEach((s, k) => {
        if (!s.resting && !(drag && drag.k === k)) { Object.assign(s, spinStep(s, f.dt, { drag: 2.0 })); busy = true; }
        poles[k].inner.rotation.y = t * 6 * (k ? -1 : 1) + s.angle;
      });
      // the booking: the leaving screen slides up and out as the next slides up into place
      const sc = bbScreen(t);
      cur.material.map = screensTex[sc.from];
      next.material.map = screensTex[sc.to];
      cur.position.y = sc.t * sh;
      next.position.y = -(1 - sc.t) * sh;
      cur.visible = sc.t < 1;   // at rest the arriving screen has slid fully into place
      slots.forEach((s, i) => {
        const k = bbSlots(t, i, PILL.n);
        s.m.visible = k > 0.001;
        if (!s.m.visible) return;
        s.m.position.copy(bez(s.from, s.from.clone().lerp(s.to, 0.5).add(new THREE.Vector3(0, 0.6, 0.8)), s.to, k));
        s.m.scale.set(s.w * lerp(1, WALL.scale, k), s.h * lerp(1, WALL.scale, k), 1);
        s.m.rotation.y = lerp(0.12, 0, k);
      });
      chosen.visible = bbSlots(t, PILL.chosen, PILL.n) > 0.95;
      return busy;
    },
    warm: Object.values(tex),
    dispose() {
      pin.removeEventListener('pointerdown', onDown);
      pin.removeEventListener('pointermove', onMove);
      pin.removeEventListener('pointerup', onUp);
      pin.removeEventListener('pointercancel', onUp);
      pin.style.touchAction = '';
      world.root.remove(group);
      disposeTree(group);
      slideGeo.dispose();
      Object.values(tex).forEach((x) => x.dispose());   // screens not on show at this moment too
    },
  };
}
