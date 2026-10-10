// Shared pieces for the 3D: loading real captures, rounded shapes, soft contact shadows, a keyboard deck.
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function loadTexture(url) {
  return new Promise((resolve, reject) => loader.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    resolve(t);
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
