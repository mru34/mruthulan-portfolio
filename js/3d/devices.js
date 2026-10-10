// A phone and a laptop, built in code at real-world proportions (units: decimetres), generic rather than any
// brand's product. Screens show real captures; mix(t) crossfades to a second capture.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { roundedRect, screenGeometry, contactShadow, keyboardTexture } from './textures.js';

export const PHONE = { w: 0.715, h: 1.47, d: 0.078, r: 0.11 };
export const LAPTOP = { w: 3.12, depth: 2.21, base: 0.155, lidH: 2.06, lid: 0.06 };

function screens(w, h, r, a, b) {
  const geo = screenGeometry(w, h, r);
  const lit = (map, extra) => new THREE.MeshBasicMaterial({ map: map || null, color: map ? 0xffffff : 0x050506, toneMapped: false, ...extra });
  const front = new THREE.Mesh(geo, lit(a));
  const next = new THREE.Mesh(geo, lit(b, { transparent: true, opacity: 0, depthWrite: false }));
  next.position.z = 0.0005;
  next.visible = false;
  const glass = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false }));
  glass.position.z = 0.001;
  const group = new THREE.Group();
  group.add(front, next, glass);
  return { group, mix(t) { next.material.opacity = t; next.visible = t > 0.001 && Boolean(b); } };
}

export function makePhone({ screen, after, shadow = true } = {}) {
  const { w, h, d, r } = PHONE;
  const bevel = 0.012;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, r - bevel), {
    depth: d - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 16,
  });
  bodyGeo.center();
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x2a2b2f, metalness: 1, roughness: 0.3 }));
  const screenSize = { w: w - 0.05, h: h - 0.05 };
  const s = screens(screenSize.w, screenSize.h, r - 0.025, screen, after);
  s.group.position.z = d / 2 + 0.001;
  const group = new THREE.Group();
  group.add(body, s.group);
  if (shadow) {
    const sh = contactShadow(w * 1.6, d * 6);
    sh.position.y = -h / 2 - 0.004;
    group.add(sh);
  }
  return { group, screen: s.group, screenSize, mix: s.mix, size: { w, h } };
}

export function makeLaptop({ screen, after, shadow = true, detail = true } = {}) {
  const L = LAPTOP;
  const alu = new THREE.MeshStandardMaterial({ color: 0x4a4c52, metalness: 0.9, roughness: 0.36 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(L.w, L.base, L.depth, 4, 0.04), alu);
  const group = new THREE.Group();
  group.add(base);
  if (detail) {
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(L.w * 0.86, L.depth * 0.42),
      new THREE.MeshStandardMaterial({ map: keyboardTexture(), roughness: 0.7, metalness: 0.2 }));
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(0, L.base / 2 + 0.002, -L.depth * 0.17);
    const pad = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(1.15, 0.72, 0.06), 8),
      new THREE.MeshStandardMaterial({ color: 0x55575d, metalness: 0.6, roughness: 0.5 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, L.base / 2 + 0.002, L.depth * 0.27);
    group.add(deck, pad);
  }
  // the lid turns about the back edge of the base: open 0 = shut flat on the keys, 1 = open at about 106°
  const hinge = new THREE.Group();
  hinge.position.set(0, L.base / 2, -L.depth / 2 + 0.03);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(L.w, L.lidH, L.lid, 4, 0.025), alu);
  lid.position.set(0, L.lidH / 2, -L.lid / 2);
  const bezel = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(L.w - 0.04, L.lidH - 0.04, 0.05), 8),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.4 }));
  bezel.position.set(0, L.lidH / 2, 0.0005);
  const sw = L.w - 0.22;
  const s = screens(sw, sw / 1.6, 0.02, screen, after);
  s.group.position.set(0, L.lidH / 2 + 0.03, 0.001);
  hinge.add(lid, bezel, s.group);
  group.add(hinge);
  if (shadow) {
    const sh = contactShadow(L.w * 1.25, L.depth * 1.3);
    sh.position.y = -L.base / 2 - 0.004;
    group.add(sh);
  }
  const setOpen = (t) => { hinge.rotation.x = Math.PI / 2 + (-0.28 - Math.PI / 2) * t; };
  setOpen(1);
  return { group, screen: s.group, mix: s.mix, setOpen, size: { w: L.w, h: 2.2 } };
}
