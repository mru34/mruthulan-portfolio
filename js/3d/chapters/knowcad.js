// 05 · KnowCad: the support rep's desk. The camera flies down an aisle of manuals (shelves of standing manuals,
// stacks lying flat, their spines titled, loose pages drifting between them) to a support rep's desk. As the
// visitor scrolls, a customer's ticket lands on the rep's screen, the rep's question to KnowCad types out by the
// name, three manuals light up violet and a page slides out of each to the desk with the passage that answers it
// highlighted, and KnowCad's suggested answer appears on the screen with its three sources. The screen and pages
// are drawn in KnowCad's style (the product is private): the ticket, the manuals and the answer are an example.
// Move the cursor through the loose pages and they drift aside; tap a source page to bring it forward (tap again
// to put it back), tap a manual to pull it out a little.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { glow, panel, screenGeometry, cropUV, loadTexture, bez, disposeTree, nextFrame } from '../textures.js';
import { scatter, mulberry32 } from '../../lib/scatter.js';
import { Spring, ramp } from '../../lib/motion.js';
import { onTap } from '../tap.js';
import { kcState, QUESTION } from './knowcad-timeline.js';

const VIOLET = 0xb3a4ff;
const TITLES = 5;   // Installation Guide, Licensing, Admin Handbook, Release Notes, Troubleshooting (the spine atlas)
const COVERS = [0x2a2346, 0x332a57, 0x3d3266, 0x282040, 0x463a75];
const FLOOR = -2.4;
const DESK = { x: 1.4, y: -1.0, z: -33 };
const SCREEN = { w: 4.4, h: 2.75, x: 1.4, y: 0.55, z: -33.6 };
const PAGE = { w: 1.1, h: 1.1 * (780 / 600) };
const LOOSE = { w: 0.85, h: 1.1 };
const PART_R = 2.0;
const AISLE = 4.6;   // the shelves' front edges stand this far either side of the aisle's middle (x)
// where the three source pages come to rest: two standing beside the screen, one lying on the desk
const REST = [
  { p: [4.0, 0.95, -32.9], r: [0, -0.35, 0.05] },
  { p: [4.35, -0.2, -32.6], r: [0, -0.3, -0.04] },
  { p: [3.5, DESK.y + 0.005, -32.3], r: [-Math.PI / 2, 0, 0.3] },   // flat on the desk, clear of the keyboard
];

// four loose pages of generic text (bars, no words) in one atlas
function pagesAtlas() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1324;
  const g = c.getContext('2d');
  const r = mulberry32(41);
  for (let v = 0; v < 4; v++) {
    const x0 = (v % 2) * 512, y0 = Math.floor(v / 2) * 662;
    g.fillStyle = '#e6e4ee';
    g.fillRect(x0, y0, 512, 662);
    g.fillStyle = '#4a4266';
    g.fillRect(x0 + 40, y0 + 44, 180 + v * 30, 18);
    g.fillStyle = '#c9c6d6';
    for (let y = y0 + 96; y < y0 + 620; y += 26) g.fillRect(x0 + 40, y, 160 + r() * 270, 9);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;   // three caps it at what the GPU offers
  return t;
}

// a book as a unit box whose +z face shows spine `i` of the atlas
function spineGeo(i) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const uv = g.attributes.uv;
  for (let v = 16; v < 20; v++) uv.setX(v, (i + uv.getX(v)) / TITLES);
  return g;
}

export async function mount({ world, stage, section, origin, form }) {
  const desk = form === 'desk';
  const names = ['kc-console-0', 'kc-console-1', 'kc-console-2', 'kc-console-3', 'kc-spines', 'kc-source-1', 'kc-source-2', 'kc-source-3'];
  const tex = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await loadTexture(`assets/3d/${n}.webp`)])));
  const group = new THREE.Group();
  group.position.copy(origin);
  const rand = mulberry32(31);
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: 0x0f0e15, roughness: 0.9, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR, -18);
  const behind = glow(VIOLET, 16, 10, 0.25);
  behind.position.set(1.4, 0.6, -38);
  group.add(floor, behind);

  // the aisle: shelf units on both sides, each three shelves of standing manuals, spines toward the aisle
  const books = [], boards = [];
  const units = desk ? 8 : 4;
  for (let u = 0; u < units; u++) {
    for (const side of [-1, 1]) {
      const x = side * 5.2, z0 = -3 - u * 3.4;
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0));
      const out = new THREE.Vector3(-side, 0, 0);
      for (let level = 0; level < 3; level++) {
        const y = FLOOR + 0.12 + level * 1.9;
        boards.push([[x, y - 0.06, z0 - 1.5], [1.2, 0.08, 3.1]]);
        let z = z0 - 0.05, n = 0;
        while (true) {
          const th = 0.16 + rand() * 0.2, h = 1.1 + rand() * 0.5;
          if (z - th < z0 - 2.95) break;
          books.push({ title: Math.floor(rand() * TITLES), pos: new THREE.Vector3(x + side * (0.05 + rand() * 0.08), y + h / 2, z - th / 2), quat, scale: new THREE.Vector3(th, h, 1.0), out, u, side, level, n: n++ });
          z -= th + 0.012;
        }
      }
      boards.push([[x, FLOOR + 3 * 1.9, z0 - 1.5], [1.2, 0.08, 3.1]]);
      boards.push([[x, FLOOR + 2.85, z0 - 0.02], [1.2, 5.7, 0.08]]);
      boards.push([[x, FLOOR + 2.85, z0 - 2.98], [1.2, 5.7, 0.08]]);
    }
  }
  // stacks lying flat, spines toward the camera: three on the floor near the desk, one on the desk
  const stacks = [[-2.9, FLOOR, -30.4, 7], [-3.8, FLOOR, -32.4, 5], [6.0, FLOOR, -30.8, 6], [-0.6, DESK.y, -31.5, 3]].filter((_, k) => desk || k !== 2);
  for (const [sx, sy, sz, count] of stacks) {
    let y = sy;
    for (let k = 0; k < count; k++) {
      const th = 0.12 + rand() * 0.1, len = 1.3 + rand() * 0.3, ry = (rand() - 0.5) * 0.25;
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, Math.PI / 2, 'YXZ'));
      books.push({ title: Math.floor(rand() * TITLES), pos: new THREE.Vector3(sx, y + th / 2, sz), quat, scale: new THREE.Vector3(th, len, 1.0), out: new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry), stack: sy === DESK.y, top: k === count - 1 });
      y += th;
    }
  }
  // the three manuals that answer the ticket: Licensing and Admin Handbook on the last shelves, Troubleshooting
  // on top of the stack on the desk
  const matched = [
    books.find((b) => b.u === units - 1 && b.side === -1 && b.level === 1 && b.n === 3),
    books.find((b) => b.u === units - 1 && b.side === 1 && b.level === 2 && b.n === 2),
    books.find((b) => b.stack && b.top),
  ];
  [1, 2, 4].forEach((title, i) => { matched[i].title = title; });
  // under it on the desk, two other manuals, never a second Troubleshooting (nor the two from the shelves)
  books.filter((b) => b.stack && !b.top).forEach((b, k) => { b.title = [0, 3][k % 2]; });   // Installation Guide, Release Notes

  const pagesMat = new THREE.MeshStandardMaterial({ color: 0xd9d5e6, roughness: 0.9 });
  const spineMat = new THREE.MeshStandardMaterial({ map: tex['kc-spines'], roughness: 0.65 });
  const shelves = Array.from({ length: TITLES }, (_, ti) => {
    const list = books.filter((b) => b.title === ti);
    const cover = new THREE.MeshStandardMaterial({ color: COVERS[ti], roughness: 0.7, metalness: 0.05 });
    const mesh = new THREE.InstancedMesh(spineGeo(ti), [cover, cover, pagesMat, pagesMat, spineMat, pagesMat], Math.max(1, list.length));
    list.forEach((b, k) => { b.mesh = mesh; b.k = k; mesh.setMatrixAt(k, m4.compose(b.pos, b.quat, b.scale)); });
    mesh.count = list.length;
    mesh.userData.books = list;
    group.add(mesh);
    return mesh;
  });
  const shelf = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x1a1824, roughness: 0.6, metalness: 0.3 }), boards.length);
  boards.forEach(([p, s], k) => shelf.setMatrixAt(k, m4.compose(v3.set(...p), new THREE.Quaternion(), new THREE.Vector3(...s))));
  group.add(shelf);
  await nextFrame();

  // the desk, the rep's monitor and keyboard; the console's later states lie over its screen
  const dark = new THREE.MeshStandardMaterial({ color: 0x24212f, roughness: 0.55, metalness: 0.2 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(7.2, 0.12, 3.0, 2, 0.04), dark);
  top.position.set(DESK.x, DESK.y - 0.06, DESK.z + 0.3);
  group.add(top);
  for (const [lx, lz] of [[-3.4, -1.2], [3.4, -1.2], [-3.4, 1.6], [3.4, 1.6]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, DESK.y - FLOOR, 0.1), dark);
    leg.position.set(DESK.x + lx, (DESK.y + FLOOR) / 2, DESK.z + lz);
    group.add(leg);
  }
  const mon = panel(tex['kc-console-0'], SCREEN.w, SCREEN.h);
  mon.group.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  mon.group.rotation.x = -0.04;
  const overlays = [1, 2, 3].map((n) => {
    const m = new THREE.Mesh(screenGeometry(SCREEN.w, SCREEN.h, 0.015), new THREE.MeshBasicMaterial({ map: tex[`kc-console-${n}`], toneMapped: false, transparent: true, opacity: 0, depthWrite: false }));
    m.position.z = 0.002 + n * 0.0005;
    mon.group.add(m);
    return m;
  });
  const postH = SCREEN.y - SCREEN.h / 2 - DESK.y;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, postH, 0.12), dark);
  post.position.set(SCREEN.x, DESK.y + postH / 2, SCREEN.z - 0.12);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.05, 0.6, 2, 0.02), dark);
  foot.position.set(SCREEN.x, DESK.y + 0.025, SCREEN.z - 0.1);
  const keys = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.05, 0.85, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x17151f, roughness: 0.6 }));
  keys.position.set(SCREEN.x, DESK.y + 0.025, DESK.z + 1.0);
  const screenGlow = glow(VIOLET, SCREEN.w * 1.6, SCREEN.h * 1.6, 0.12);
  screenGlow.position.set(SCREEN.x, SCREEN.y, SCREEN.z - 0.3);
  group.add(mon.group, post, foot, keys, screenGlow);

  // the matched manuals glow, and a page slides out of each to the desk
  const lights = matched.map((b) => {
    const g = glow(VIOLET, 1.1, 1.9, 0);
    g.position.copy(b.pos).addScaledVector(b.out, 0.4);
    group.add(g);
    return g;
  });
  const pages = matched.map((b, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PAGE.w, PAGE.h), new THREE.MeshBasicMaterial({ map: tex[`kc-source-${i + 1}`], toneMapped: false, side: THREE.DoubleSide }));
    m.userData.page = i;
    m.visible = false;
    group.add(m);
    const look = new THREE.Object3D();
    look.position.copy(b.pos);
    look.lookAt(b.pos.clone().add(b.out));
    // from a shelf, it starts just clear of the shelf's front (a manual's spine is half its depth out from its
    // centre, a little behind the boards' front edges), first moves out into the aisle and turns once it is out, so
    // it never passes through a board or the manuals beside it; from the stack on the desk it rises straight off
    const shelved = b.side !== undefined;
    const from = b.pos.clone().addScaledVector(b.out, shelved ? 0.5 + 0.3 : 0.6);
    const rest = new THREE.Vector3(...REST[i].p);
    return {
      m, from, fromQ: look.quaternion.clone(), turnFrom: shelved ? 0.2 : 0,
      ctrl: shelved ? from.clone().addScaledVector(b.out, 1.6).add(new THREE.Vector3(0, 0.5, 0)) : from.clone().lerp(rest, 0.5).add(new THREE.Vector3(0, 1.4, 0.8)),
      rest, restQ: new THREE.Quaternion().setFromEuler(new THREE.Euler(...REST[i].r)),
      fwd: new Spring(0, { stiffness: 150, damping: 20 }),
    };
  });
  await nextFrame();

  // loose pages drifting in the aisle (four designs, one instanced mesh each), off the camera's path down the
  // middle and with clear air by the desk
  const atlas = pagesAtlas();
  const looseMat = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.85, side: THREE.DoubleSide });
  const nLoose = desk ? 40 : 18;
  const looseMeshes = [0, 1, 2, 3].map((v) => {
    const geo = cropUV(new THREE.PlaneGeometry(LOOSE.w, LOOSE.h), [(v % 2) / 2, 1 - (Math.floor(v / 2) + 1) / 2, (v % 2 + 1) / 2, 1 - Math.floor(v / 2) / 2]);
    const m = new THREE.InstancedMesh(geo, looseMat, Math.ceil((nLoose - v) / 4));
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(m);
    return m;
  });
  const r2 = mulberry32(29);
  // (a phone has half the shelf units: its pages stay between them, not in the open by the desk, where the camera
  // passes close as it comes down to the desk)
  const loose = scatter(nLoose, 23, { x: [-4.2, 4.2], y: [FLOOR + 0.6, 4], z: desk ? [-19, -1] : [-15, -1] }, 1.6).map(([x, y, z], i) => ({
    mesh: looseMeshes[i % 4], k: Math.floor(i / 4), pos: new THREE.Vector3(Math.abs(x) < 1.6 ? Math.sign(x || 1) * (1.6 + Math.abs(x) * 0.8) : x, y, z),
    quat: new THREE.Quaternion().setFromEuler(new THREE.Euler((r2() - 0.5) * 0.7, (r2() - 0.5) * 1.3, (r2() - 0.5) * 0.4)),
    off: new THREE.Vector3(), aim: new THREE.Vector3(),
  }));
  // how far each loose page reaches from its centre across the aisle and down, as it is turned
  loose.forEach((s) => {
    s.reach = [0, 0];
    for (const [cx, cy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      v3.set((cx * LOOSE.w) / 2, (cy * LOOSE.h) / 2, 0).applyQuaternion(s.quat);
      s.reach[0] = Math.max(s.reach[0], Math.abs(v3.x));
      s.reach[1] = Math.max(s.reach[1], Math.abs(v3.y));
    }
    // and none hangs over the shelves' front edge, where a push up or down would slide it into a shelf
    const lim = AISLE - 0.05 - s.reach[0];
    s.pos.x = Math.max(-lim, Math.min(lim, s.pos.x));
  });
  const placeLoose = () => {
    loose.forEach((s) => s.mesh.setMatrixAt(s.k, m4.compose(v3.copy(s.pos).add(s.off), s.quat, one)));
    looseMeshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  };
  placeLoose();
  world.root.add(group);

  // taps: a source page comes forward (once it has landed) and goes back; a manual slides out a little
  const pin = section.querySelector('.pin');
  const pulls = new Map();   // book -> Spring
  let local = -1;
  const offTap = onTap(pin, (e) => {
    if (e.target.closest('a, button')) return;
    // (a source page still in its manual is hidden, and must not catch the tap meant for the manual)
    const hit = world.ray(e.clientX, e.clientY).intersectObjects([...pages.filter((p) => p.m.visible).map((p) => p.m), ...shelves], false)[0];
    if (!hit) return;
    if (hit.object.userData.page !== undefined) {
      if (kcState(local).pull < 1) return;
      const p = pages[hit.object.userData.page];
      const on = p.fwd.target ? 0 : 1;
      pages.forEach((q) => { q.fwd.target = 0; });
      p.fwd.target = on;
    } else {
      const b = hit.object.userData.books[hit.instanceId];
      if (!b) return;
      const s = pulls.get(b) || new Spring(0, { stiffness: 140, damping: 18 });
      const on = s.target ? 0 : 1;
      pulls.forEach((x) => { x.target = 0; });
      s.target = on;
      pulls.set(b, s);
    }
    stage.invalidate();
  });

  // the cursor parts the loose pages, and they come back when it leaves
  const typed = section.querySelector('[data-typed]');
  let shownTyped = -1, lastPointer = '';
  const ray = new THREE.Ray(), rel = new THREE.Vector3(), closest = new THREE.Vector3();
  function aimAway(f) {
    const P = f.pointer;
    const key = P.inside && P.type === 'mouse' ? `${P.x},${P.y}` : 'out';
    if (key === lastPointer) return;
    lastPointer = key;
    if (key === 'out') { loose.forEach((s) => s.aim.set(0, 0, 0)); return; }
    ray.copy(world.ray(P.x, P.y).ray);
    ray.origin.sub(origin);
    loose.forEach((s) => {
      ray.closestPointToPoint(s.pos, closest);
      rel.copy(s.pos).sub(closest);
      const d = rel.length();
      if (d < PART_R && d > 1e-4) s.aim.copy(rel.multiplyScalar(((PART_R - d) * 0.6) / d));
      else s.aim.set(0, 0, 0);
      // pushed aside, a page stops at the shelves and above the floor
      const side = AISLE - 0.05 - s.reach[0];
      s.aim.x = Math.max(-side, Math.min(side, s.pos.x + s.aim.x)) - s.pos.x;
      s.aim.y = Math.max(s.aim.y, Math.min(0, FLOOR + 0.05 + s.reach[1] - s.pos.y));
    });
  }

  const tmp = new THREE.Object3D(), face = new THREE.Object3D(), camL = new THREE.Vector3();
  const debug = {
    parted: () => Math.max(0, ...loose.map((s) => s.off.length())),
    state: () => ({ ...kcState(local) }),
    forward: (i) => pages[i].fwd.value,
    pulled: () => Math.max(0, ...[...pulls.values()].map((s) => s.value)),
    anchors: { manual: matched[2].pos.clone().add(origin) },
    // the page that lands on the desk: its lowest point and front edge against the desk's top and front edge
    deskPage() {
      const b = new THREE.Box3().setFromObject(pages[2].m);
      return { bottom: b.min.y - origin.y, desk: DESK.y, front: b.max.z - origin.z, edge: DESK.z + 0.3 + 1.5 };
    },
    // each source page's box on screen, in CSS pixels
    pageBoxes() {
      return pages.map((p) => {
        const b = new THREE.Box3().setFromObject(p.m);
        const xs = [], ys = [];
        for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
          const v = new THREE.Vector3(x, y, z).project(stage.camera);
          xs.push(((v.x + 1) / 2) * stage.view.w); ys.push(((1 - v.y) / 2) * stage.view.h);
        }
        return { l: Math.round(Math.min(...xs)), r: Math.round(Math.max(...xs)), t: Math.round(Math.min(...ys)), b: Math.round(Math.max(...ys)) };
      });
    },
  };
  pages.forEach((p, i) => Object.defineProperty(debug.anchors, `source${i}`, { get: () => p.m.getWorldPosition(new THREE.Vector3()) }));

  return {
    group,
    debug,
    warm: Object.values(tex),
    update(t, f) {
      local = t;
      const visible = t > -1.2 && t < 1.7;
      group.visible = visible;
      if (!visible) return false;
      const st = kcState(t);
      if (st.typed !== shownTyped) { shownTyped = st.typed; typed.textContent = QUESTION.slice(0, st.typed); }
      [st.ticket, st.search, st.answer].forEach((o, k) => { overlays[k].material.opacity = o; overlays[k].visible = o > 0.001; });
      lights.forEach((g) => { g.material.opacity = 0.45 * st.light; g.visible = st.light > 0.001; });
      let busy = false;
      const camLocal = group.worldToLocal(camL.copy(f.camera.position));
      pages.forEach((p) => {
        busy = p.fwd.step(f.dt) || busy;
        p.m.visible = st.pull > 0.01;
        if (!p.m.visible) return;
        bez(p.from, p.ctrl, p.rest, st.pull, tmp.position);
        tmp.quaternion.copy(p.fromQ).slerp(p.restQ, ramp(st.pull, p.turnFrom, 1));
        if (p.fwd.value > 0.001) {
          face.position.copy(tmp.position);
          face.lookAt(camLocal);
          const toCam = camLocal.clone().sub(tmp.position).normalize();
          tmp.position.addScaledVector(toCam, 2.4 * p.fwd.value);
          tmp.quaternion.slerp(face.quaternion, p.fwd.value);
        }
        p.m.position.copy(tmp.position);
        p.m.quaternion.copy(tmp.quaternion);
        p.m.scale.setScalar(1 + 0.45 * p.fwd.value);
      });
      for (const [b, s] of pulls) {
        busy = s.step(f.dt) || busy;
        b.mesh.setMatrixAt(b.k, m4.compose(v3.copy(b.pos).addScaledVector(b.out, 0.4 * s.value), b.quat, b.scale));
        b.mesh.instanceMatrix.needsUpdate = true;
        if (s.target === 0 && s.value < 0.001) pulls.delete(b);
      }
      // a phone's camera backs out down the aisle for its long view of the desk, and the loose pages would brush
      // the edges of that view: they go once the camera is deep in the aisle, where none of them is on screen
      const pagesOut = desk || t < 0.15;
      looseMeshes.forEach((m) => { m.visible = pagesOut; });
      if (pagesOut) aimAway(f);
      const k = Math.min(1, f.dt / 120);
      let moved = false;
      loose.forEach((s) => {
        if (s.off.distanceToSquared(s.aim) > 1e-6) { s.off.lerp(s.aim, k); moved = true; }
        else s.off.copy(s.aim);
      });
      if (moved) { placeLoose(); busy = true; }
      return busy;
    },
    dispose() {
      offTap();
      typed.textContent = QUESTION;   // without the 3D, the question shows in full
      world.root.remove(group);
      disposeTree(group);
      Object.values(tex).forEach((x) => x.dispose());
    },
  };
}
