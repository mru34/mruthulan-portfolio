// "Five projects.": a few hundred grains of gold dust stream toward the visitor as they scroll, which is
// what makes the page feel like it is moving forward. Tied to the scroll; still the moment it stops.
// If it reads as filler at the review, this scene is removed and the title stands alone.
import * as THREE from 'three';
import { clamp, ramp } from '../lib/motion.js';

export async function mount(stage, section) {
  const N = 420;
  const DEPTH = 60;
  const pos = new Float32Array(N * 3);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);   // the same field every visit
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rnd() - 0.5) * 28;
    pos[i * 3 + 1] = (rnd() - 0.5) * 16;
    pos[i * 3 + 2] = -rnd() * DEPTH;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const g = dot.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const mat = new THREE.PointsMaterial({
    color: 0xe8b64c, size: 0.07, map: new THREE.CanvasTexture(dot), transparent: true,
    opacity: 0, depthWrite: false, sizeAttenuation: true,
  });
  const dust = new THREE.Points(geo, mat);
  stage.scene.add(dust);

  return {
    update() {
      const r = section.getBoundingClientRect();
      const vh = stage.view.h;
      // 0 as the section's top comes up from the bottom of the screen, 1 as its bottom leaves the top
      const f = clamp((vh - r.top) / (r.height + vh));
      const o = 0.6 * Math.min(ramp(f, 0, 0.12), 1 - ramp(f, 0.85, 1));
      dust.visible = o > 0.001;
      mat.opacity = o;
      dust.position.z = f * 40;
      return false;
    },
  };
}
