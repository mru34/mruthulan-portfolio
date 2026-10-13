// 04 · MEANT: the café table. MEANT's demo is ordering food: the user's tablet, showing the four replies it
// suggested, and the partner's display, showing "Give me a moment", stand on a café table. The four real
// reply tiles rise off the tablet as the visitor scrolls; picking one (click, tap, or the keyboard: each tile
// is a real button) sends it across the table, and the partner's display shows that reply. Behind the table
// hang tiles from MEANT's word boards, coloured by word class, with MEANT's own pictures. The Tamil Murasu page
// that featured MEANT lies on the table as a folded newspaper: drag it to pick it up and turn it in the light (on
// a touch screen, hold it first, so a swipe still scrolls), let go and it settles back; press it and the camera
// glides into it before the article opens.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeTablet } from '../devices.js';
import { loadTexture, card, bez, glow, screenGeometry, roundedRect, cropUV, disposeTree, nextFrame } from '../textures.js';
import { lerp, Spring } from '../../lib/motion.js';
import { mulberry32 } from '../../lib/scatter.js';
import { mtState, REPLIES } from './meant-timeline.js';
import { FOV } from '../stage.js';
import { fitNear } from '../../lib/glide.js';
import { onTap } from '../tap.js';

// the reply tiles in the 1600 x 1000 tablet capture: must match design/build_3d_assets.py (tested)
export const REPLY_BOXES = [[56, 332, 522, 548], [534, 332, 1000, 548], [56, 558, 522, 774], [534, 558, 1000, 774]];
const CAPTURE = { w: 1600, h: 1000 };
// the word tiles' atlas (design/build_meant_tiles.mjs): 8 x 6 tiles of 256 x 214, edge to edge, each face rounded
// by 30 px; MEANT's ink is the colour of the tile's edge
const WORDS = { cols: 8, rows: 6, w: 256, h: 214, r: 30 };
const INK = 0x17181c;
// the newspaper's centre on the table, and how far it is turned there; the table's top is at TABLE_TOP, and no
// sheet of the paper ever goes lower than PAPER_CLEAR above it (the lowest sheet lies 0.018 under the centre)
const TABLE_TOP = 0.06, PAPER_CLEAR = 0.01;
const PAPER_AT = [0.55, TABLE_TOP + PAPER_CLEAR + 0.018, 1.7], PAPER_YAW = 0.32;
// where the camera stands at MEANT's payoff (relative to the table; measured from js/3d/paths.js's keys) and how
// its screen is shared out to the word tiles: a cols x rows grid between heights v (-1 bottom, 1 top), less the
// box `clear` (u0, v0, u1, v1) where the chapter's words are
const EYE = {
  desk: { at: [3.7, 5.19, 9.83], dir: [-0.181, -0.381, -0.907], aspect: 1.6, near: 14.8, size: 1,
    cols: 12, rows: 5, v: [-0.12, 0.84], clear: [0.2, -0.45, 1.05, 0.42] },
  phone: { at: [4.59, 9.64, 23.0], dir: [-0.181, -0.381, -0.907], aspect: 0.46, near: 26.5, size: 1.5,
    cols: 4, rows: 6, v: [-0.05, 0.86], clear: [-1, -1, 1, -0.05] },
};
const BLUE = 0x4da3ff;
const TABLE_R = 3.6;
const FLOOR = -7.5;   // a café table stands about 75 cm high

// a device on a small stand on the table, leaning back
function standFor(device, tilt) {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.7 });
  const foot = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.04, 0.7, 2, 0.015), dark);
  foot.position.set(0, 0.08, -0.15);
  const arm = new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.2, 0.04, 2, 0.015), dark);
  arm.position.set(0, 0.62, -0.42);
  arm.rotation.x = -tilt;
  device.position.set(0, 0.06 + (device.userData.h / 2) * Math.cos(tilt) + 0.02, 0);
  device.rotation.x = -tilt;
  g.add(foot, arm, device);
  return g;
}

// the Tamil Murasu page as a folded broadsheet lying open: the top sheet bends a little along its centre fold and
// curls up at one corner, and three sheets under it show their edges
function newspaper(tex) {
  const W = 2.2, H = 2.2 * (1416 / 1776);
  const shape = (curlBy) => {
    const geo = new THREE.PlaneGeometry(W, H, 32, 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const curl = Math.max(0, x / W + 0.5 + y / H + 0.5 - 1.55) / 0.45;
      p.setZ(i, Math.abs(x) * 0.05 + curlBy * curl * curl * 0.28);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const group = new THREE.Group();
  const under = new THREE.MeshStandardMaterial({ color: 0xe6e1d4, roughness: 0.95, side: THREE.DoubleSide });
  for (let k = 1; k <= 3; k++) {
    const s = new THREE.Mesh(shape(0.3), under);
    s.position.set(k * 0.012, -k * 0.008, -k * 0.006);
    group.add(s);
  }
  const top = new THREE.Mesh(shape(1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, side: THREE.DoubleSide }));
  group.add(top);
  group.traverse((o) => { o.userData.paper = true; });
  return { group, top };
}

export async function mount({ world, stage, section, origin, form }) {
  const desk = form === 'desk';
  const names = ['mt-tablet', 'mt-partner-wait', 'mt-words', 'mt-paper', ...[1, 2, 3, 4].flatMap((i) => [`mt-partner-${i}`, `mt-reply-${i}`])];
  // the newspaper is a photograph of a printed page: decoded off the main thread (textures.js)
  const tex = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await loadTexture(`assets/3d/${n}.webp`)])));

  const group = new THREE.Group();
  group.position.copy(origin);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.9, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(TABLE_R, TABLE_R, 0.12, 72), new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.55, metalness: 0.15 }));
  top.position.y = 0;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, -FLOOR - 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.7 }));
  pedestal.position.y = FLOOR / 2;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.12, 48), pedestal.material);
  foot.position.y = FLOOR + 0.06;
  const pool = glow(BLUE, 7, 7, 0.16);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.065;
  const behind = glow(BLUE, 20, 11, 0.2);
  behind.position.set(0, 1.5, -6);
  group.add(floor, top, pedestal, foot, pool, behind);
  await nextFrame();

  // the user's tablet and the partner's display, turned a little toward each other
  const tablet = makeTablet({ screen: tex['mt-tablet'] });
  tablet.group.userData.h = 1.78;
  const tabletStand = standFor(tablet.group, 0.32);
  tabletStand.position.set(-1.35, 0, 0.55);
  tabletStand.rotation.y = 0.38;
  const partner = makeTablet({ screen: tex['mt-partner-wait'] });
  partner.group.userData.h = 1.78;
  const partnerStand = standFor(partner.group, 0.32);
  partnerStand.position.set(1.45, 0, -0.45);
  partnerStand.rotation.y = -0.42;
  group.add(tabletStand, partnerStand);
  // the reply, laid over the partner's screen when one arrives
  const shownMat = new THREE.MeshBasicMaterial({ map: tex['mt-partner-1'], toneMapped: false, transparent: true, opacity: 0 });
  const shownMesh = new THREE.Mesh(screenGeometry(partner.screenSize.w, partner.screenSize.h, 0.06), shownMat);
  shownMesh.position.z = 0.0006;
  partner.screen.add(shownMesh);
  group.updateMatrixWorld(true);
  const inGroup = (obj, v) => group.worldToLocal(obj.localToWorld(v.clone()));
  const partnerScreen = inGroup(partner.screen, new THREE.Vector3(0, 0, 0.05));

  // the four reply tiles: each starts where it sits on the tablet's screen and rises to a 2 x 2 grid above
  const tw = tablet.screenSize.w, th = tablet.screenSize.h;
  const tiles = REPLY_BOXES.map(([l, t, r, b], i) => {
    const w = 0.95, h = (w * (b - t)) / (r - l);
    const c = card(w, h, tex[`mt-reply-${i + 1}`], null, { color: INK });
    const scaleOnTablet = (((r - l) / CAPTURE.w) * tw) / w;
    const from = inGroup(tablet.screen, new THREE.Vector3((((l + r) / 2) / CAPTURE.w - 0.5) * tw, (0.5 - ((t + b) / 2) / CAPTURE.h) * th, 0.03));
    const to = new THREE.Vector3(-0.42 + (i % 2) * 1.04, 2.5 - Math.floor(i / 2) * 0.56, 0.35);
    const lift = new Spring(0, { stiffness: 160, damping: 20 });
    group.add(c);
    c.traverse((o) => { if (o.isMesh) o.userData.reply = i; });
    return { c, from, to, scaleOnTablet, lift, rest: new THREE.Vector3() };
  });
  await nextFrame();

  // MEANT's word tiles, hanging behind the table at different depths. They are laid out from the payoff camera
  // (EYE): one to each cell of a jittered grid on the screen, clear of the chapter's words and the bar at the
  // top, each pushed back along its line of sight to its depth and grown with it, so at the payoff they fill the
  // view evenly, all read about the same size, and none sits in front of another.
  const rand = mulberry32(17);
  const L = desk ? EYE.desk : EYE.phone;
  const eye = new THREE.Vector3(...L.at), look = new THREE.Vector3(...L.dir).normalize();
  const right = new THREE.Vector3().crossVectors(look, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, look);
  const order = Array.from({ length: WORDS.cols * WORDS.rows }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const cells = [];
  for (let r = 0; r < L.rows; r++) {
    for (let c = 0; c < L.cols; c++) {
      const u = -1 + (2 * (c + 0.5 + (rand() - 0.5) * 0.3)) / L.cols;
      const v = L.v[0] + ((L.v[1] - L.v[0]) * (r + 0.5 + (rand() - 0.5) * 0.25)) / L.rows;
      const [u0, v0, u1, v1] = L.clear;
      if (!(u > u0 && u < u1 && v > v0 && v < v1)) cells.push([u, v]);
    }
  }
  const ww = 0.66, wh = (ww * WORDS.h) / WORDS.w, wr = (wh * WORDS.r) / WORDS.h;
  const slabGeo = new THREE.ExtrudeGeometry(roundedRect(ww, wh, wr), { depth: 0.03, bevelEnabled: false, curveSegments: 6 });
  slabGeo.translate(0, 0, -0.031);
  const slabMat = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6, metalness: 0.1 });
  const faceMat = new THREE.MeshStandardMaterial({ map: tex['mt-words'], roughness: 0.8 });
  const aw = WORDS.cols * WORDS.w, ah = WORDS.rows * WORDS.h;
  const faceGeo = screenGeometry(ww, wh, wr);   // shaped once; each tile's copy points at its own cell
  const tanY = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), tanX = tanY * L.aspect;
  const words = cells.slice(0, order.length).map(([u, v], k) => {
    const i = order[k];
    const l = (i % WORDS.cols) * WORDS.w, t = Math.floor(i / WORDS.cols) * WORDS.h;
    const face = new THREE.Mesh(cropUV(faceGeo.clone(), [l / aw, 1 - (t + WORDS.h) / ah, (l + WORDS.w) / aw, 1 - t / ah]), faceMat);
    const m = new THREE.Group();
    m.add(new THREE.Mesh(slabGeo, slabMat), face);
    const back = rand();
    const ray = look.clone().addScaledVector(right, u * tanX).addScaledVector(up, v * tanY);
    const dist = (-4.4 - back * 3.2 - eye.z) / ray.z;     // from just behind the table to well behind it
    m.position.copy(eye).addScaledVector(ray, dist);
    m.scale.setScalar((dist / L.near) * L.size);
    m.lookAt(eye);
    m.rotateY((rand() - 0.5) * 0.35);
    m.rotateZ((rand() - 0.5) * 0.1);
    group.add(m);
    return { m, y: m.position.y, depth: 0.4 + (1 - back) * 0.9 };
  });
  faceGeo.dispose();
  await nextFrame();

  // the newspaper, folded open on the table, on a pivot at its centre that the visitor can pick up and turn
  const news = newspaper(tex['mt-paper']);
  news.group.rotation.set(-Math.PI / 2, 0, PAPER_YAW);
  const paper = new THREE.Group();
  paper.position.set(...PAPER_AT);
  paper.add(news.group);
  // the corners of a box around all four sheets, in the paper's space: the table holds the paper up by them
  const sheetsBox = new THREE.Box3();
  news.group.children.forEach((m) => { m.geometry.computeBoundingBox(); sheetsBox.union(m.geometry.boundingBox.clone().translate(m.position)); });
  news.group.updateMatrix();
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(
    i & 1 ? sheetsBox.max.x : sheetsBox.min.x, i & 2 ? sheetsBox.max.y : sheetsBox.min.y, i & 4 ? sheetsBox.max.z : sheetsBox.min.z,
  ).applyMatrix4(news.group.matrix));
  const corner = new THREE.Vector3();
  group.add(paper);
  world.root.add(group);

  // picking: a tile flies across the table into the partner's display, which then shows that reply
  const live = section.querySelector('[data-partner-live]');
  const buttons = [...section.querySelectorAll('[data-reply]')];
  const fade = new Spring(0, { stiffness: 120, damping: 20 });
  let shown = -1, flying = -1, flyT = 1, hovered = -1, focused = -1, local = -1;
  function pick(i) {
    if (flying === i || shown === i) return;
    flying = i;
    flyT = 0;
    stage.invalidate();
  }
  const pin = section.querySelector('.pin');
  const ndcHit = (e, objs) => world.ray(e.clientX, e.clientY).intersectObjects(objs, true)[0];
  const tileMeshes = tiles.map((t) => t.c);
  const pressLink = section.querySelector('a.mt-press');
  // pressing the paper (or its link) glides the camera into it, then opens the article; a new-tab click, or
  // reduced motion, is left to the browser
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let leaving = false, pressId = 0;
  const onPress = async (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduced.matches) return;
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    const id = ++pressId;
    // if the 3D stops mid-glide (it falls back to the stills, say), the glide stops moving: go anyway
    let watch = 0;
    const stalled = new Promise((r) => {
      let last = -1, still = 0;
      watch = setInterval(() => {
        const t = world.glideT();
        if (t === null || t >= 1) { clearInterval(watch); return; }
        if (t !== last) { last = t; still = 0; } else if (++still >= 3) { clearInterval(watch); r('stalled'); }
      }, 250);
    });
    // the glide ends with the whole page just filling the screen, whatever its shape and the angle it is seen at
    const to = news.top.getWorldPosition(new THREE.Vector3());
    news.top.geometry.computeBoundingBox();
    const { min, max } = news.top.geometry.boundingBox;
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).applyMatrix4(news.top.matrixWorld).toArray());
    const near = fitNear(corners, to.toArray(), stage.camera.position.toArray(), FOV, stage.view.w / stage.view.h);
    const why = await Promise.race([world.glideTo(to, 600, near), stalled]);
    clearInterval(watch);
    if (id !== pressId || why === 'restored') return;   // the visitor came back to this page meanwhile
    location.href = pressLink.href;
  };
  // back from the article (the browser's cache): this page stays, and a press can glide again
  const onShow = (e) => { if (e.persisted) { pressId += 1; leaving = false; } };
  pressLink.addEventListener('click', onPress);
  addEventListener('pageshow', onShow);

  // handling the paper: a mouse drag that starts on it picks it up at once; a finger has to rest on it a moment
  // first (a finger that moves straight away is scrolling the page). While it is held, the drag turns it and
  // tilts it; let go and it springs back to where it lay. A press that never moved is a tap: it opens the article.
  const lift = new Spring(0, { stiffness: 140, damping: 18 });
  const yaw = new Spring(0, { stiffness: 120, damping: 17 }), pitch = new Spring(0, { stiffness: 120, damping: 17 });
  let hold = null, handled = false, overPaper = false;
  const onPaper = (e) => !!ndcHit(e, [news.group]);
  const pickUp = () => { hold.held = true; pin.style.cursor = 'grabbing'; stage.invalidate(); };
  const onDown = (e) => {
    handled = false;
    if (e.button !== 0 || e.target.closest('a, button') || !onPaper(e)) return;
    hold = { id: e.pointerId, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse', held: false, timer: 0 };
    if (hold.touch) hold.timer = setTimeout(() => { if (hold) pickUp(); }, 260);
    else e.preventDefault();   // a mouse press here handles the paper; it never starts a text selection
  };
  const onDrag = (e) => {
    if (!hold || e.pointerId !== hold.id) return;
    const dx = e.clientX - hold.x, dy = e.clientY - hold.y;
    if (!hold.held) {
      if (Math.hypot(dx, dy) < 8) return;
      if (hold.touch) { clearTimeout(hold.timer); hold = null; return; }   // a swipe: the page scrolls
      pickUp();
    }
    if (!pin.hasPointerCapture(e.pointerId)) pin.setPointerCapture(e.pointerId);
    yaw.target = Math.max(-1.6, Math.min(1.6, dx * 0.006));
    pitch.target = Math.max(-0.7, Math.min(0.6, dy * 0.005));
    stage.invalidate();
  };
  const onUp = (e) => {
    if (!hold || e.pointerId !== hold.id) return;
    clearTimeout(hold.timer);
    handled = hold.held;   // a pick-up is not a tap
    hold = null;
    yaw.target = pitch.target = 0;
    pin.style.cursor = overPaper ? 'grab' : '';
    stage.invalidate();
  };
  // while a finger holds the paper, it turns the paper instead of scrolling the page
  const noScroll = (e) => { if (hold && hold.held) e.preventDefault(); };
  pin.addEventListener('pointerdown', onDown);
  pin.addEventListener('pointermove', onDrag);
  pin.addEventListener('pointerup', onUp);
  pin.addEventListener('pointercancel', onUp);
  pin.addEventListener('touchmove', noScroll, { passive: false });

  const offTap = onTap(pin, (e) => {
    if (handled || e.target.closest('a, button')) return;
    const hit = ndcHit(e, [...tileMeshes, news.group]);
    if (!hit) return;
    if (hit.object.userData.paper) pressLink.click();   // through the real link, so it behaves like one
    else pick(hit.object.userData.reply);
  });
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || hold) return;
    const hit = ndcHit(e, [...tileMeshes, news.group]);
    const paperHit = !!hit && !!hit.object.userData.paper;
    const i = hit && !paperHit ? hit.object.userData.reply : -1;
    if (i !== hovered || paperHit !== overPaper) {
      hovered = i;
      overPaper = paperHit;
      pin.style.cursor = paperHit ? 'grab' : i >= 0 ? 'pointer' : '';
      stage.invalidate();
    }
  };
  const onClick = (e) => pick(Number(e.currentTarget.dataset.reply));
  const onFocus = (e) => { focused = Number(e.target.dataset.reply); stage.invalidate(); };
  const onBlur = () => { focused = -1; stage.invalidate(); };
  pin.addEventListener('pointermove', onMove);
  buttons.forEach((b) => { b.addEventListener('click', onClick); b.addEventListener('focus', onFocus); b.addEventListener('blur', onBlur); });

  const debug = { anchors: { paper: paper.position.clone().add(origin) } };
  Object.defineProperties(debug, { shown: { get: () => shown }, focused: { get: () => focused }, held: { get: () => lift.value } });
  return {
    group,
    debug,
    warm: Object.values(tex),
    update(t, f) {
      local = t;
      const visible = t > -1.2 && t < 1.7;
      group.visible = visible;
      if (t < -0.6 && (shown >= 0 || flying >= 0)) { shown = -1; flying = -1; flyT = 1; fade.value = fade.target = 0; live.textContent = ''; }
      if (!visible) return false;
      const st = mtState(t);
      let busy = false;
      if (flying >= 0) {
        flyT = Math.min(1, flyT + f.dt / 520);
        busy = true;
        if (flyT >= 1) {
          shown = flying;
          flying = -1;
          shownMat.map = tex[`mt-partner-${shown + 1}`];
          fade.value = 0;
          fade.target = 1;
          live.textContent = `Partner display: ${REPLIES[shown]}`;
        }
      }
      busy = fade.step(f.dt) || busy;
      shownMat.opacity = fade.value;
      tiles.forEach((tile, i) => {
        tile.lift.target = i === hovered || i === focused ? 1 : 0;
        busy = tile.lift.step(f.dt) || busy;
        const rest = tile.rest.copy(tile.from).lerp(tile.to, st.rise);
        rest.y += tile.lift.value * 0.15;
        rest.z += tile.lift.value * 0.15;
        const s = lerp(tile.scaleOnTablet, 1, st.rise) * (1 + tile.lift.value * 0.06);
        tile.c.visible = i !== shown;
        if (i === flying) {
          const k = flyT;
          tile.c.position.copy(bez(rest, rest.clone().lerp(partnerScreen, 0.5).add(new THREE.Vector3(0, 1.2, 0.6)), partnerScreen, k * k * (3 - 2 * k)));
          tile.c.scale.setScalar(lerp(s, 0.25, k));
          tile.c.rotation.set(0, lerp(0, -0.42, k), 0);
        } else {
          tile.c.position.copy(rest);
          tile.c.scale.setScalar(s);
          tile.c.rotation.set(lerp(-0.32, 0, st.rise), lerp(0.38, 0, st.rise), 0);
        }
        tile.c.children.forEach((m) => { if (m.material.emissive) { m.material.emissive.setHex(BLUE); m.material.emissiveIntensity = tile.lift.value * 0.35; } });
      });
      // the paper: held up toward the camera and turned by the drag, or lying where it was (a hover lifts it a little)
      lift.target = hold && hold.held ? 1 : overPaper ? 0.1 : 0;
      busy = lift.step(f.dt) || busy;
      busy = yaw.step(f.dt) || busy;
      busy = pitch.step(f.dt) || busy;
      const k = lift.value;
      paper.position.set(PAPER_AT[0] - 0.25 * k, PAPER_AT[1] + 1.25 * k, PAPER_AT[2] + 0.55 * k);
      paper.rotation.set(1.05 * k + pitch.value, -PAPER_YAW * k + yaw.value, 0, 'YXZ');
      // turned while it is still low (or settling back after it is let go), an edge would go into the table: the
      // table holds it up
      paper.updateMatrix();
      let low = Infinity;
      for (const c of corners) low = Math.min(low, corner.copy(c).applyMatrix4(paper.matrix).y);
      if (low < TABLE_TOP + PAPER_CLEAR) paper.position.y += TABLE_TOP + PAPER_CLEAR - low;
      // the word tiles drift with the scroll, the nearer ones more (never by themselves)
      words.forEach((w) => { w.m.position.y = w.y + (st.words - 0.25) * w.depth * 0.6; });
      return busy;
    },
    dispose() {
      offTap();
      if (hold) clearTimeout(hold.timer);
      pin.removeEventListener('pointerdown', onDown);
      pin.removeEventListener('pointermove', onDrag);
      pin.removeEventListener('pointerup', onUp);
      pin.removeEventListener('pointercancel', onUp);
      pin.removeEventListener('touchmove', noScroll);
      pressLink.removeEventListener('click', onPress);
      removeEventListener('pageshow', onShow);
      pin.removeEventListener('pointermove', onMove);
      pin.style.cursor = '';
      buttons.forEach((b) => { b.removeEventListener('click', onClick); b.removeEventListener('focus', onFocus); b.removeEventListener('blur', onBlur); });
      world.root.remove(group);
      disposeTree(group);
      Object.values(tex).forEach((x) => x.dispose());   // the replies not on show at this moment too
    },
  };
}
