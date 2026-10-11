// 05 · KnowCad: the archive. Hundreds of drawing sheets fill the screen at every depth, and the camera flies
// through them while the scroll types the question. The sheets that answer it light up violet along their
// edges and fly out of the archive into one stack in front of the camera, which turns over to the champion
// photo. The sheets carry only generic drafting marks (border, title block, grid, centre lines), no invented
// content. Move the cursor through them and they drift out of its way, and back when it leaves.
import * as THREE from 'three';
import { glow, print, cropUV, loadTexture, disposeTree, nextFrame } from '../textures.js';
import { scatter, mulberry32 } from '../../lib/scatter.js';
import { kcState, QUESTION } from './knowcad-timeline.js';

const VIOLET = 0xb3a4ff;
const SHEET = { w: 2.5, h: 1.77 };   // A-series proportions, enlarged
const STACK = new THREE.Vector3(0, 0, -31);
const MATCHES = [7, 31, 52, 77, 101, 140, 166, 190, 215, 247, 280, 305];
const PART_R = 2.2;

// four sheets of generic drafting paper in one atlas: border, title block, light grid, centre lines
function sheetsAtlas() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 724;
  const g = c.getContext('2d');
  for (let v = 0; v < 4; v++) {
    const x0 = (v % 2) * 512, y0 = Math.floor(v / 2) * 362;
    g.fillStyle = '#e9e8e4';
    g.fillRect(x0, y0, 512, 362);
    g.strokeStyle = '#cfcdc7';
    g.lineWidth = 1;
    const step = [16, 20, 12, 24][v];
    for (let x = x0 + 12; x < x0 + 500; x += step) { g.beginPath(); g.moveTo(x + 0.5, y0 + 12); g.lineTo(x + 0.5, y0 + 350); g.stroke(); }
    for (let y = y0 + 12; y < y0 + 350; y += step) { g.beginPath(); g.moveTo(x0 + 12, y + 0.5); g.lineTo(x0 + 500, y + 0.5); g.stroke(); }
    g.strokeStyle = '#3a3a44';
    g.lineWidth = 3;
    g.strokeRect(x0 + 12, y0 + 12, 488, 338);
    g.lineWidth = 2;
    g.strokeRect(x0 + 340, y0 + 280, 160, 70);
    g.beginPath();
    g.moveTo(x0 + 340, y0 + 315); g.lineTo(x0 + 500, y0 + 315);
    g.moveTo(x0 + 420, y0 + 280); g.lineTo(x0 + 420, y0 + 350);
    g.stroke();
    g.setLineDash([14, 6, 3, 6]);
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x0 + 30, y0 + 160 + v * 6); g.lineTo(x0 + 320, y0 + 160 + v * 6);
    g.moveTo(x0 + 170 + v * 8, y0 + 30); g.lineTo(x0 + 170 + v * 8, y0 + 270);
    g.stroke();
    g.setLineDash([]);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export async function mount({ world, stage, section, origin, form }) {
  const champion = await loadTexture('assets/3d/kc-champion.webp');
  const n = form === 'desk' ? 360 : 140;
  const matches = MATCHES.filter((i) => i < n);
  const isMatch = new Set(matches);

  const group = new THREE.Group();
  group.position.copy(origin);
  const atlas = sheetsAtlas();
  const material = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.85, side: THREE.DoubleSide });
  // one instanced mesh per sheet design (their UVs differ); sheet i is design i % 4
  const meshes = [0, 1, 2, 3].map((v) => {
    const geo = cropUV(new THREE.PlaneGeometry(SHEET.w, SHEET.h), [(v % 2) / 2, 1 - (Math.floor(v / 2) + 1) / 2, (v % 2 + 1) / 2, 1 - Math.floor(v / 2) / 2]);
    const count = Math.ceil((n - v) / 4);
    const m = new THREE.InstancedMesh(geo, material, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(m);
    return m;
  });
  // the archive, with clear air in front of the stack so nothing stands between the camera and the answer
  const points = scatter(n, 23, { x: [-9, 9], y: [-4.5, 5.5], z: [-36, 4] }, 1.6).map(([x, y, z]) =>
    (z > -31.5 && z < -19 && Math.abs(x) < 4.6 && Math.abs(y) < 3.2 ? [Math.sign(x || 1) * (4.6 + Math.abs(x) * 0.6), y, z] : [x, y, z]));
  const r = mulberry32(29);
  const DIM = new THREE.Color(0x5a5a66), LIT = new THREE.Color(VIOLET);
  const sheets = points.map((p, i) => ({
    mesh: meshes[i % 4], k: Math.floor(i / 4),
    pos: new THREE.Vector3(...p),
    quat: new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.6, (r() - 0.5) * 1.2, (r() - 0.5) * 0.3)),
    off: new THREE.Vector3(), aim: new THREE.Vector3(),
  }));
  const stackSlot = (j) => STACK.clone().add(new THREE.Vector3(0, j * 0.012, j * 0.004));
  const facing = new THREE.Quaternion();
  await nextFrame();

  // the answer: the champion photo, printed, on top of the stack; it shows its back until the stack turns
  const answer = print(champion, 3.93, 3.93 * (705 / 1179));
  answer.position.copy(STACK).add(new THREE.Vector3(0, matches.length * 0.012 + 0.02, 0.1));
  const behind = glow(VIOLET, 14, 9, 0.28);
  behind.position.set(0, 0, -34);
  group.add(answer, behind);
  world.root.add(group);

  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
  function place(s, i, st) {
    p.copy(s.pos).add(s.off);
    q.copy(s.quat);
    if (isMatch.has(i) && st.gather > 0) {
      const j = matches.indexOf(i);
      p.lerp(stackSlot(j), st.gather);
      q.slerp(facing, st.gather);
    }
    s.mesh.setMatrixAt(s.k, m4.compose(p, q, one));
    col.copy(DIM);
    if (isMatch.has(i)) col.lerp(LIT, st.light);
    s.mesh.setColorAt(s.k, col);
  }

  // every sheet placed and coloured once now, so the colour buffer exists before the shaders are compiled
  sheets.forEach((s, i) => place(s, i, kcState(-1)));

  const typed = section.querySelector('[data-typed]');
  let shownTyped = -1, lastPointer = '', lastKey = '';
  const ray = new THREE.Ray(), local = new THREE.Vector3(), closest = new THREE.Vector3();
  function aimAway(f) {
    const P = f.pointer;
    const key = P.inside && P.type === 'mouse' ? `${P.x},${P.y}` : 'out';
    if (key === lastPointer) return;
    lastPointer = key;
    if (key === 'out') { sheets.forEach((s) => s.aim.set(0, 0, 0)); return; }
    ray.copy(world.ray(P.x, P.y).ray);
    ray.origin.sub(origin);
    sheets.forEach((s, i) => {
      if (isMatch.has(i) && kcState(f.local).gather > 0) { s.aim.set(0, 0, 0); return; }
      ray.closestPointToPoint(s.pos, closest);
      local.copy(s.pos).sub(closest);
      const d = local.length();
      if (d < PART_R && d > 1e-4) s.aim.copy(local.multiplyScalar(((PART_R - d) * 0.6) / d));
      else s.aim.set(0, 0, 0);
    });
  }

  return {
    group,
    debug: { parted: () => Math.max(0, ...sheets.map((s) => s.off.length())) },
    update(t, f) {
      const visible = t > -1.2 && t < 1.7;
      group.visible = visible;
      if (!visible) return false;
      const st = kcState(t);
      if (st.typed !== shownTyped) { shownTyped = st.typed; typed.textContent = QUESTION.slice(0, st.typed); }
      aimAway({ ...f, local: t });
      let busy = false;
      const k = Math.min(1, f.dt / 120);
      sheets.forEach((s) => {
        if (s.off.distanceToSquared(s.aim) > 1e-6) { s.off.lerp(s.aim, k); busy = true; }
        else s.off.copy(s.aim);
      });
      const stateKey = `${st.light.toFixed(3)},${st.gather.toFixed(3)}`;
      if (busy || stateKey !== lastKey) {
        lastKey = stateKey;
        sheets.forEach((s, i) => place(s, i, st));
        meshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
      }
      answer.visible = st.gather > 0.9;
      answer.rotation.y = Math.PI * (1 - st.turn);
      return busy;
    },
    dispose() {
      typed.textContent = QUESTION;   // without the 3D, the question shows in full
      world.root.remove(group);
      disposeTree(group);
    },
  };
}
