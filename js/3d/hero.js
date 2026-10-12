// The hero: the name as a 3D split-flap board, fitted into .hero-board (a page scene: the camera holds the page
// pose here). It leans toward the mouse with a warm glint following the pointer, flickers a flap under the
// mouse, ripples on a tap; as the visitor scrolls it first goes up with the page, then tilts back and rises out
// of the camera's way while the camera flies on into SignalBridge. The first frame matches the still exactly (no pointer, no lean).
import * as THREE from 'three';
import { createBoard } from './board.js';
import { fitScale } from '../lib/fit.js';
import { onTap } from './tap.js';
import { clamp, easeInOut } from '../lib/motion.js';

const DESK = [{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL NATHAN', color: 'white' }];
const PHONE = [{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL', color: 'white' }, { text: 'NATHAN', color: 'white' }];

export async function mount({ world, stage, section }) {
  const box = section.querySelector('[data-anchor]');
  const narrow = matchMedia('(max-width: 860px)');
  const group = new THREE.Group();
  let board = await createBoard({ rows: narrow.matches ? PHONE : DESK });
  group.add(board.group);
  // the layout follows the same breakpoint as the box's shape; rebuild when it is crossed
  // only the latest rebuild counts: a slower earlier one is thrown away when it finishes
  let generation = 0;
  let gone = false;
  const onBreak = async () => {
    const mine = ++generation;
    const next = await createBoard({ rows: narrow.matches ? PHONE : DESK });
    if (mine !== generation || gone) { next.dispose(); return; }
    group.remove(board.group);
    board.dispose();
    board = next;
    group.add(board.group);
    stage.invalidate();
  };
  narrow.addEventListener('change', onBreak);

  const ndc = (e) => new THREE.Vector2((e.clientX / stage.view.w) * 2 - 1, -(e.clientY / stage.view.h) * 2 + 1);
  const onMove = (e) => { if (e.pointerType === 'mouse') { board.hover(board.pick(stage.camera, ndc(e))); stage.invalidate(); } };
  const onLeave = () => board.hover(-1);
  // a tap ripples the name; a drag or a swipe that starts on it does not
  const debug = { fit: null, rippled: false };
  const offTap = onTap(box, (e) => { board.ripple(board.pick(stage.camera, ndc(e))); debug.rippled = true; stage.invalidate(); });
  box.addEventListener('pointermove', onMove);
  box.addEventListener('pointerleave', onLeave);
  const glint = world.glint;

  return {
    group,
    debug,
    update(local, f) {
      const w = world.boxToWorld(box, 'hero');
      const visible = f.s < 1.6;
      group.visible = visible;
      if (!visible) { glint.intensity = 0; return false; }
      // leaving the hero: until 0.3 of a screen the camera holds still and the board goes up with the page, like
      // the links under it; then, as the camera turns to fly on, it tilts back and rises out of the camera's path
      const e = easeInOut(clamp((f.s - 0.3) / 0.25));
      board.group.scale.setScalar(fitScale(board.size, w));
      board.group.position.set(w.x, w.y + e * 9, w.z - e * 2);
      board.group.rotation.x = -e * 1.2;
      debug.fit = { el: box, x: w.x, y: w.y, z: w.z, w: board.size.w * fitScale(board.size, w), h: board.size.h * fitScale(board.size, w) };
      const P = f.pointer;
      const mouse = P.inside && P.type === 'mouse';
      board.lean(mouse ? P.nx : 0, mouse ? P.ny : 0);
      const halfW = (stage.view.w * stage.view.k) / 2;
      const halfH = (stage.view.h * stage.view.k) / 2;
      glint.position.set(mouse ? P.nx * halfW : 0, mouse ? P.ny * halfH : 0, w.z + 2.2);
      glint.intensity = mouse ? 9 * (1 - e) : 0;
      return board.update(f.now, f.dt);
    },
    dispose() {
      gone = true;
      narrow.removeEventListener('change', onBreak);
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerleave', onLeave);
      glint.intensity = 0;
      offTap();
      board.dispose();
    },
  };
}
