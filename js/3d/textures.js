// Shared pieces for the 3D: loading real captures, rounded shapes, soft contact shadows, a keyboard deck, glows
// of light, displays, photographic prints, cards with a crop on their face, and freeing it all again.
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

// a real capture as a texture, already decoded (off the main thread where the browser can), so putting it on
// the GPU later never stalls a frame on decoding
export function loadTexture(url) {
  return new Promise((resolve, reject) => loader.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const img = t.image;
    (img && img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(t));
  }, undefined, reject));
}

// a rounded rectangle, centred on the origin
export function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// a flat rounded rectangle whose texture covers it exactly (ShapeGeometry's own UVs are in shape units)
export function screenGeometry(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 12);
  const uv = g.attributes.uv;
  const pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
}

// a soft shadow on the surface under an object: a horizontal plane, drawn once
export function contactShadow(w, d, opacity = 0.5) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// a laptop keyboard: rows of dark keys on a darker deck
export function keyboardTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#121214';
  g.fillRect(0, 0, c.width, c.height);
  const rows = [14, 14, 13, 12, 11];
  const key = 64, gap = 8;
  rows.forEach((n, r) => {
    const y = 24 + r * (key + gap);
    const w = (c.width - 48 - (n - 1) * gap) / n;
    for (let i = 0; i < n; i++) {
      const x = 24 + i * (w + gap);
      g.fillStyle = '#1d1d21';
      g.beginPath(); g.roundRect(x, y, w, key, 8); g.fill();
      g.fillStyle = 'rgba(255,255,255,.05)';
      g.fillRect(x + 6, y + 3, w - 12, 2);
    }
  });
  g.fillStyle = '#1d1d21';
  g.beginPath(); g.roundRect(24 + 3 * 80, 24 + 5 * (key + gap), c.width - 48 - 6 * 80, key - 10, 8); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// shared textures are made once and never freed (disposeTree skips them)
let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.userData.shared = true;
  return glowTex;
}

// a soft glow of light: additive, so it brightens what is behind it the way light does; never a shape
export function glow(color, w, h = w, opacity = 0.5) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
    map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.renderOrder = -1;
  return m;
}

// a display: a dark body with a thin bezel and a lit screen showing a real capture
export function panel(tex, w, h, { bezel = 0.07, depth = 0.08, r = 0.05 } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(w + 2 * bezel, h + 2 * bezel, r), { depth, bevelEnabled: false, curveSegments: 8 }),
    new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.45, metalness: 0.6 }));
  body.position.z = -depth;
  const screen = new THREE.Mesh(screenGeometry(w, h, Math.max(0.005, r - bezel / 2)),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.002;
  group.add(body, screen);
  return { group, screen };
}

// a photographic print: the photo on white paper with a border, a hair thick
export function print(tex, w, h, { border = 0.07, thick = 0.012 } = {}) {
  const group = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.BoxGeometry(w + 2 * border, h + 2 * border, thick),
    new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.82, metalness: 0 }));
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.38, metalness: 0 }));
  photo.position.z = thick / 2 + 0.001;
  group.add(paper, photo);
  return group;
}

// a physical card: a thin dark slab with the crop printed on its face (and another on its back)
export function card(w, h, front, back, { color = 0x101a19 } = {}) {
  const r = Math.min(w, h) * 0.18;
  const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth: 0.02, bevelEnabled: false, curveSegments: 10 }),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 }));
  slab.position.z = -0.01;
  const face = (map, z, turned) => {
    const m = new THREE.Mesh(screenGeometry(w, h, r), new THREE.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0, transparent: true }));
    m.position.z = z;
    if (turned) m.rotation.y = Math.PI;
    return m;
  };
  const g = new THREE.Group();
  g.add(slab, face(front, 0.011, false));
  if (back) g.add(face(back, -0.011, true));
  return g;
}

// a point on the quadratic Bézier from a through control c to b
export const bez = (a, c, b, t) => new THREE.Vector3()
  .addScaledVector(a, (1 - t) ** 2).addScaledVector(c, 2 * (1 - t) * t).addScaledVector(b, t * t);

// point a plane's texture at one box of an atlas: [u0, v0, u1, v1], v = 0 at the bottom of the image
export function cropUV(geo, [u0, v0, u1, v1]) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  uv.needsUpdate = true;
  return geo;
}

// every texture used under `root`, once each
export function texturesOf(root) {
  const out = new Set();
  root.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) for (const k of ['map', 'alphaMap', 'emissiveMap', 'roughnessMap', 'normalMap']) if (m[k]) out.add(m[k]);
  });
  return [...out];
}

// free everything under `root`: geometry, materials and their textures (shared ones stay)
export function disposeTree(root) {
  root.traverse((o) => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      for (const k of ['map', 'alphaMap', 'emissiveMap', 'roughnessMap', 'normalMap']) {
        if (m[k] && !m[k].userData.shared) m[k].dispose();
      }
      m.dispose();
    }
  });
}
