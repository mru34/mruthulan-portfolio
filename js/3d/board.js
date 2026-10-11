// The split-flap board in 3D: each tile is a matte housing with hinge pins and two printed half-flaps.
// A turning letter is a third flap falling about the split line, showing the old top on its face and
// the new bottom on its back, as a real departures board does.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLYPHS, glyphIndex, glyphUV, flickerSequence, tileState, layoutRows } from './flap.js';
import { Spring, easeIn } from '../lib/motion.js';

const COLS = 8, ROWS = 5, CELL_W = 128, CELL_H = 176, TILE_H = 1.37;
const INK = { gold: '#E8B64C', white: '#F2F2F2' };

// every glyph printed on a flap, with the flap's slight shading; one atlas per ink colour
async function atlas(ink) {
  await document.fonts.load('800 150px Archivo');
  const c = document.createElement('canvas');
  c.width = COLS * CELL_W;
  c.height = ROWS * CELL_H;
  const g = c.getContext('2d');
  [...GLYPHS].forEach((ch, i) => {
    const x = (i % COLS) * CELL_W;
    const y = Math.floor(i / COLS) * CELL_H;
    const face = g.createLinearGradient(0, y, 0, y + CELL_H);
    face.addColorStop(0, '#1a1a1d');
    face.addColorStop(0.5, '#141416');
    face.addColorStop(1, '#0f0f11');
    g.fillStyle = face;
    g.fillRect(x, y, CELL_W, CELL_H);
    if (ch === ' ') return;
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '800 150px Archivo';
    if ('fontStretch' in g) g.fontStretch = 'condensed';
    g.fillText(ch, x + CELL_W / 2, y + CELL_H / 2 + 8, CELL_W * 0.86);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData.shared = true;   // every board shares the atlases; disposeTree must leave them
  return t;
}

function setUV(geo, { u0, u1, v0, v1 }) {
  const a = geo.attributes.uv;
  a.setXY(0, u0, v1); a.setXY(1, u1, v1); a.setXY(2, u0, v0); a.setXY(3, u1, v0);
  a.needsUpdate = true;
}

function makeTile(mat) {
  const h2 = TILE_H / 2 - 0.012;                     // each half, leaving the split line
  const half = () => new THREE.PlaneGeometry(1, h2);
  const y = TILE_H / 4 + 0.006;
  const top = new THREE.Mesh(half(), mat); top.position.y = y;
  const bottom = new THREE.Mesh(half(), mat); bottom.position.y = -y;
  const hinge = new THREE.Group(); hinge.position.z = 0.004;   // the falling flap turns about the split
  const front = new THREE.Mesh(half(), mat); front.position.y = y;
  const back = new THREE.Mesh(half(), mat); back.position.y = y; back.rotation.x = Math.PI;
  hinge.add(front, back);
  hinge.visible = false;
  const group = new THREE.Group();
  group.add(top, bottom, hinge);
  return { group, top, bottom, hinge, front, back, shown: '' };
}

function show(tile, st) {
  const key = `${st.from}${st.to}${st.done ? 1 : st.t.toFixed(3)}`;
  if (key === tile.shown) return;
  tile.shown = key;
  const uv = (ch, half) => glyphUV(glyphIndex(ch), half, COLS, ROWS);
  setUV(tile.top.geometry, uv(st.to, 'top'));
  setUV(tile.bottom.geometry, uv(st.done ? st.to : st.from, 'bottom'));
  if (st.done || st.from === st.to) { tile.hinge.visible = false; return; }
  tile.hinge.visible = true;
  setUV(tile.front.geometry, uv(st.from, 'top'));
  setUV(tile.back.geometry, uv(st.to, 'bottom'));
  tile.hinge.rotation.x = Math.PI * easeIn(st.t);    // a flap falls: slow to start, fast at the end
}

// the atlases do not depend on the rows, so every board shares one pair (made once, never thrown away)
let atlases = null;

export async function createBoard({ rows }) {
  atlases ??= Promise.all([atlas(INK.gold), atlas(INK.white)]);
  const [goldMap, whiteMap] = await atlases;
  const flap = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.55, metalness: 0.12 });
  const mats = { gold: flap(goldMap), white: flap(whiteMap) };
  const { tiles: spots, size } = layoutRows(rows, { tileH: TILE_H });

  const group = new THREE.Group();    // placed, scaled and turned by the scene
  const body = new THREE.Group();     // leans toward the pointer
  group.add(body);
  const housing = new THREE.InstancedMesh(
    new RoundedBoxGeometry(1.06, TILE_H + 0.06, 0.16, 2, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.85, metalness: 0.25 }), spots.length);
  const pins = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12),
    new THREE.MeshStandardMaterial({ color: 0x55555b, roughness: 0.35, metalness: 1 }), spots.length * 2);
  const m = new THREE.Matrix4();
  const sideways = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
  const one = new THREE.Vector3(1, 1, 1);
  const tiles = spots.map((s, i) => {
    housing.setMatrixAt(i, m.makeTranslation(s.x, s.y, -0.09));
    pins.setMatrixAt(i * 2, m.compose(new THREE.Vector3(s.x - 0.515, s.y, -0.004), sideways, one));
    pins.setMatrixAt(i * 2 + 1, m.compose(new THREE.Vector3(s.x + 0.515, s.y, -0.004), sideways, one));
    const t = makeTile(mats[s.color]);
    t.group.position.set(s.x, s.y, 0);
    t.top.userData.tile = i;
    t.bottom.userData.tile = i;
    body.add(t.group);
    const tile = Object.assign(t, { ch: s.ch, x: s.x, y: s.y, anim: null });
    show(tile, { from: s.ch, to: s.ch, t: 1, done: true });
    return tile;
  });
  body.add(housing, pins);

  const pickables = tiles.flatMap((t) => [t.top, t.bottom]);
  const ray = new THREE.Raycaster();
  const leanX = new Spring(0, { stiffness: 120, damping: 22 });
  const leanY = new Spring(0, { stiffness: 120, damping: 22 });
  let hovered = -1;

  return {
    group,
    size,
    // free this board's geometry and materials (the shared atlases stay)
    dispose() {
      group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry) o.geometry.dispose(); });
      housing.geometry.dispose();
      pins.geometry.dispose();
      for (const m of [mats.gold, mats.white, housing.material, pins.material]) m.dispose();
    },
    pick(camera, ndc) {
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      return hit ? hit.object.userData.tile : -1;
    },
    // a flap flickers under the mouse and lands back on its letter
    hover(i) {
      if (i >= 0 && i !== hovered && !tiles[i].anim) {
        tiles[i].anim = { seq: flickerSequence(tiles[i].ch, 3), start: performance.now(), turnMs: 90 };
      }
      hovered = i;
    },
    // a press ripples the whole name out from that tile
    ripple(i0) {
      const o = tiles[Math.max(0, i0)];
      const now = performance.now();
      for (const t of tiles) {
        t.anim = { seq: flickerSequence(t.ch, 2), start: now + Math.hypot(t.x - o.x, t.y - o.y) * 30, turnMs: 80 };
      }
    },
    lean(nx, ny) { leanY.target = nx * 0.07; leanX.target = -ny * 0.05; },
    update(now, dt) {
      let busy = leanX.step(dt);
      busy = leanY.step(dt) || busy;
      body.rotation.x = leanX.value;
      body.rotation.y = leanY.value;
      for (const t of tiles) {
        if (!t.anim) continue;
        const st = tileState(t.anim.seq, t.anim.start, t.anim.turnMs, now);
        show(t, st);
        if (st.done) t.anim = null; else busy = true;
      }
      return busy;
    },
  };
}
