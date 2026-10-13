// One renderer, one fixed canvas behind the page, and the environment the studio light reflects. It draws as
// one job of the page's single frame loop (js/lib/ticker.js), only when something changed (scroll, pointer,
// a spring still settling), so nothing moves by itself and a phone is not kept busy. The lights belong to
// the world's rig (js/3d/world.js), which travels with the camera.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { worldPerPixel, rectToWorld } from '../lib/fit.js';

export const FOV = 30;
export const CAM_Z = 20;

// Compiles what `obj` draws, the way three's compileAsync does (in parallel, off the page's thread, through
// KHR_parallel_shader_compile), but asks whether the shaders are ready only after a pause. On Windows the question
// is answered only once the shader is done, so asked at once (as compileAsync does) it held the page for the whole
// compile: 150-190 ms as the page opened, more on a slower laptop or a first visit, and again in every room built.
// (The commands go to the GPU at once too: left in the page's command buffer, the compile began only when asked.)
export function compileQuietly(renderer, obj, camera, target = null) {
  const waiting = renderer.compile(obj, camera, target);
  renderer.getContext().flush();   // sent to the GPU now, so it compiles during the pause, not when asked
  return new Promise((resolve) => {
    const check = () => {
      for (const m of waiting) { const p = renderer.properties.get(m).currentProgram; if (p === undefined || p.isReady()) waiting.delete(m); }
      if (waiting.size === 0) resolve(); else setTimeout(check, 50);
    };
    setTimeout(check, 150);
  });
}

// The studio light the scenes reflect: a room, rendered into a prefiltered environment map. Rendering it compiles
// four shaders, and compiled the usual way (one after another, the page waiting) that held the page still for
// a moment just as it opened, the moment a visitor starts to scroll. So they are compiled first in parallel,
// off the page's own thread (KHR_parallel_shader_compile, compileQuietly), each for the state the map is
// rendered in (its render target, no tone mapping), and the render itself then compiles nothing. This reaches
// into three.js's PMREMGenerator (0.186, vendored): if those parts are not there, the map is simply rendered.
async function environment(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  try {
    if (pmrem._setSize && pmrem._allocateTargets) {
      pmrem._setSize(256);
      const rt = pmrem._allocateTargets();
      // the roughness filter loops over a fixed 256 samples, and Windows' shader compiler (through ANGLE) writes
      // that loop out 256 times, which alone takes most of a second; a bound it cannot know in advance keeps the
      // loop a loop. The same 256 samples, the same map.
      const ggx = pmrem._ggxMaterial;
      const LOOP = 'for(uint i = 0u; i < uint(GGX_SAMPLES); i++)';
      if (ggx && ggx.fragmentShader.includes(LOOP)) {
        ggx.uniforms.samples = { value: 256 };
        ggx.fragmentShader = ggx.fragmentShader
          .replace('uniform sampler2D envMap;', 'uniform sampler2D envMap;\n\t\t\tuniform int samples;')
          .replace(LOOP, 'for(uint i = 0u; i < uint(samples); i++)');
        ggx.needsUpdate = true;
      }
      // compiled on the very objects the map is drawn with (three's own background box, its filter meshes with
      // the blur and roughness materials), so the render finds every program ready: compiled on stand-ins, it
      // compiled its own again as it drew, and waited for them (two waits of 70-80 ms as the page opened)
      if (pmrem._backgroundBox === null) {
        pmrem._backgroundBox = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ name: 'PMREM.Background', side: THREE.BackSide, depthWrite: false, depthTest: false }));
      }
      const flat = new THREE.OrthographicCamera(0, 1, 0, 1, 0, 1);
      const lod = pmrem._lodMeshes[0];
      const toneMapping = renderer.toneMapping;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.setRenderTarget(rt);
      const cube = new THREE.PerspectiveCamera(90, 1, 0.1, 100);
      const jobs = [compileQuietly(renderer, room, cube), compileQuietly(renderer, pmrem._backgroundBox, cube)];
      for (const m of [pmrem._ggxMaterial, pmrem._blurMaterial]) { lod.material = m; jobs.push(compileQuietly(renderer, lod, flat)); }
      renderer.setRenderTarget(null);
      renderer.toneMapping = toneMapping;
      await Promise.all(jobs);
      rt.dispose();
    }
  } catch { /* the render below compiles what it needs */ }
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  pmrem.dispose();
}

export function createStage(canvas, { maxDpr = 2, ticker } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.environmentIntensity = 0.45;
  const envReady = environment(renderer, scene);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CAM_Z);

  const view = { w: 1, h: 1, k: 1 };
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false, type: '' };
  const parts = new Set();
  const hooks = new Set();
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  let stopped = false;

  // frame hooks get the real time since the previous frame, or null after an idle pause (not a slow frame)
  let onError = (err) => { throw err; };
  ticker.add((now, dt, gap) => {
    if (stopped) return false;
    let busy = false;
    try {
      for (const p of parts) busy = p.update(now, dt) || busy;
      renderer.render(scene, camera);
    } catch (err) {
      stopped = true;   // a scene that throws stops the 3D; the page goes on (home.js shows the stills)
      onError(err);
      return false;
    }
    for (const h of hooks) h(now, gap);
    return busy;
  });
  const invalidate = ticker.invalidate;
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
    envReady,   // resolves once the studio light's reflections exist: build no scene before it
    add(part) { parts.add(part); invalidate(); },
    remove(part) { parts.delete(part); invalidate(); },
    onFrame(fn) { hooks.add(fn); return () => hooks.delete(fn); },
    compile: (obj, target = scene) => compileQuietly(renderer, obj, camera, target),
    invalidate,
    boxToWorld: (el) => rectToWorld(el.getBoundingClientRect(), view.w, view.h, view.k),
    setDpr(n) { dpr = Math.min(window.devicePixelRatio || 1, n); resize(); },
    // draw right now, outside the loop: the first frame of a scene, and stills
    renderNow() {
      if (stopped) return;
      for (const p of parts) p.update(performance.now(), 16);
      renderer.render(scene, camera);
    },
    stop() { stopped = true; },
    set onError(fn) { onError = fn; },
  };
}
