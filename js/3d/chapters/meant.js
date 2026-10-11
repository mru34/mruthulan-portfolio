// 04 · MEANT: the café table. MEANT's demo is ordering food: the user's tablet, showing the four replies it
// suggested, and the partner's display, showing "Give me a moment", stand on a café table. The four real
// reply tiles rise off the tablet as the visitor scrolls; picking one (click, tap, or the keyboard: each tile
// is a real button) sends it across the table, and the partner's display shows that reply. Around the table
// hang tiles from the word board, coloured by word type; the Tamil Murasu page that featured MEANT lies on the
// table and opens the article.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeTablet } from '../devices.js';
import { loadTexture, card, bez, glow, screenGeometry, cropUV, disposeTree, nextFrame } from '../textures.js';
import { lerp, Spring } from '../../lib/motion.js';
import { mulberry32 } from '../../lib/scatter.js';
import { mtState, REPLIES } from './meant-timeline.js';

// the reply tiles in the 1600 x 1000 tablet capture: must match design/build_3d_assets.py (tested)
export const REPLY_BOXES = [[56, 332, 522, 548], [534, 332, 1000, 548], [56, 558, 522, 774], [534, 558, 1000, 774]];
const CAPTURE = { w: 1600, h: 1000 };
// the word board crop: 8 x 3 tiles, each 172 x 144, 182.1 x 150.5 apart, starting 2 px in (of 1448 x 446)
const WORDS = { cols: 8, rows: 3, x0: 2, y0: 2, px: 182.1, py: 150.5, w: 172, h: 144, gw: 1448, gh: 446 };
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

export async function mount({ world, stage, section, origin, form }) {
  const desk = form === 'desk';
  const names = ['mt-tablet', 'mt-partner-wait', 'mt-words', 'mt-paper', ...[1, 2, 3, 4].flatMap((i) => [`mt-partner-${i}`, `mt-reply-${i}`])];
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
    const c = card(w, h, tex[`mt-reply-${i + 1}`], null, { color: 0xeeeeea });
    const scaleOnTablet = (((r - l) / CAPTURE.w) * tw) / w;
    const from = inGroup(tablet.screen, new THREE.Vector3((((l + r) / 2) / CAPTURE.w - 0.5) * tw, (0.5 - ((t + b) / 2) / CAPTURE.h) * th, 0.03));
    const to = new THREE.Vector3(-0.42 + (i % 2) * 1.04, 2.5 - Math.floor(i / 2) * 0.56, 0.35);
    const lift = new Spring(0, { stiffness: 160, damping: 20 });
    group.add(c);
    c.traverse((o) => { if (o.isMesh) o.userData.reply = i; });
    return { c, from, to, scaleOnTablet, lift };
  });
  await nextFrame();

  // tiles from the word board, hanging around the back of the table at different depths
  const rand = mulberry32(17);
  const nWords = desk ? 24 : 10;
  const words = Array.from({ length: nWords }, (_, i) => {
    const col = i % WORDS.cols, row = Math.floor(i / WORDS.cols) % WORDS.rows;
    const l = WORDS.x0 + col * WORDS.px, t = WORDS.y0 + row * WORDS.py;
    const geo = cropUV(new THREE.PlaneGeometry(0.62, 0.52), [l / WORDS.gw, 1 - (t + WORDS.h) / WORDS.gh, (l + WORDS.w) / WORDS.gw, 1 - t / WORDS.gh]);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex['mt-words'], roughness: 0.8 }));
    const a = Math.PI * (1.08 + rand() * 0.84);   // behind the table, from one side round to the other
    const r = 4.6 + rand() * 3.2;
    const depth = 0.4 + rand() * 0.9;
    m.position.set(Math.cos(a) * r, 0.5 + rand() * 3.4, Math.sin(a) * r);
    m.rotation.y = (rand() - 0.5) * 0.4;
    group.add(m);
    return { m, y: m.position.y, depth };
  });

  // the newspaper page, lying on the table with a slight curl
  const paperGeo = new THREE.PlaneGeometry(2.2, 2.2 * (957 / 1200), 24, 1);
  const pos = paperGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.12 * (pos.getX(i) / 1.1) ** 2);
  paperGeo.computeVertexNormals();
  const paper = new THREE.Mesh(paperGeo, new THREE.MeshStandardMaterial({ map: tex['mt-paper'], roughness: 0.92, side: THREE.DoubleSide }));
  paper.position.set(0.55, 0.068, 1.7);
  paper.rotation.set(-Math.PI / 2, 0, 0.32);
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
  const onDown = (e) => {
    if (e.target.closest('a, button')) return;
    const hit = ndcHit(e, [...tileMeshes, paper]);
    if (!hit) return;
    if (hit.object === paper) location.href = 'meant.html#press';
    else pick(hit.object.userData.reply);
  };
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const hit = ndcHit(e, tileMeshes);
    const i = hit ? hit.object.userData.reply : -1;
    if (i !== hovered) { hovered = i; pin.style.cursor = i >= 0 ? 'pointer' : ''; stage.invalidate(); }
  };
  const onClick = (e) => pick(Number(e.currentTarget.dataset.reply));
  const onFocus = (e) => { focused = Number(e.target.dataset.reply); stage.invalidate(); };
  const onBlur = () => { focused = -1; stage.invalidate(); };
  pin.addEventListener('pointerdown', onDown);
  pin.addEventListener('pointermove', onMove);
  buttons.forEach((b) => { b.addEventListener('click', onClick); b.addEventListener('focus', onFocus); b.addEventListener('blur', onBlur); });

  const debug = {};
  Object.defineProperties(debug, { shown: { get: () => shown }, focused: { get: () => focused } });
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
        const rest = tile.from.clone().lerp(tile.to, st.rise).add(new THREE.Vector3(0, tile.lift.value * 0.15, tile.lift.value * 0.15));
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
      // the word tiles drift with the scroll, the nearer ones more (never by themselves)
      words.forEach((w) => { w.m.position.y = w.y + (st.words - 0.25) * w.depth * 0.6; });
      return busy;
    },
    dispose() {
      pin.removeEventListener('pointerdown', onDown);
      pin.removeEventListener('pointermove', onMove);
      pin.style.cursor = '';
      buttons.forEach((b) => { b.removeEventListener('click', onClick); b.removeEventListener('focus', onFocus); b.removeEventListener('blur', onBlur); });
      world.root.remove(group);
      disposeTree(group);
      Object.values(tex).forEach((x) => x.dispose());   // the replies not on show at this moment too
    },
  };
}
