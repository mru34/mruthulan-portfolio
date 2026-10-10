// One renderer, one fixed canvas behind the page, one studio light for everything. It draws only when
// something changed (scroll, pointer, a spring still settling) and sleeps otherwise, so nothing moves
// by itself and a phone is not kept busy.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { worldPerPixel, rectToWorld } from '../lib/fit.js';

export const FOV = 30;
export const CAM_Z = 20;

export function createStage(canvas, { maxDpr = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();
  // the studio: a soft key from the top left and a dim cool fill; project colour only ever comes in as rim light
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-6, 8, 10);
  const fill = new THREE.DirectionalLight(0xc8d2ff, 0.25);
  fill.position.set(6, -3, 6);
  scene.add(key, fill);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CAM_Z);

  const view = { w: 1, h: 1, k: 1 };
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false, type: '' };
  const parts = new Set();
  const hooks = new Set();
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  let raf = 0;
  let last = 0;
  let stopped = false;

  function invalidate() {
    if (!raf && !stopped) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(now - last, 100) : 16;
    last = now;
    let busy = false;
    for (const p of parts) busy = p.update(now, dt) || busy;
    renderer.render(scene, camera);
    for (const h of hooks) h(now, dt);
    if (busy) invalidate(); else last = 0;
  }
  function resize() {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(view.w, view.h, false);
    camera.aspect = view.w / view.h;
    camera.updateProjectionMatrix();
    view.k = worldPerPixel(FOV, CAM_Z, view.h);
    invalidate();
  }

  addEventListener('resize', resize);
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / view.w) * 2 - 1;
    pointer.ny = -((e.clientY / view.h) * 2 - 1);
    pointer.inside = true;
    pointer.type = e.pointerType;
    invalidate();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.inside = false; invalidate(); });
  resize();

  return {
    renderer, scene, camera, view, pointer,
    add(part) { parts.add(part); invalidate(); },
    remove(part) { parts.delete(part); invalidate(); },
    onFrame(fn) { hooks.add(fn); return () => hooks.delete(fn); },
    invalidate,
    boxToWorld: (el) => rectToWorld(el.getBoundingClientRect(), view.w, view.h, view.k),
    setDpr(n) { dpr = Math.min(window.devicePixelRatio || 1, n); resize(); },
    // draw right now, outside the loop: the first frame of a scene, and stills
    renderNow() { for (const p of parts) p.update(performance.now(), 16); renderer.render(scene, camera); },
    stop() { stopped = true; cancelAnimationFrame(raf); raf = 0; },
  };
}
