// The ending: OPEN TO INTERNSHIPS / 2027/28 as a 3D split-flap board, fitted into .end-board (a page
// scene: the camera holds the page pose). Built from the same parts as the name board: it leans toward the
// mouse, flickers a flap under it, and ripples from a tap. A drag or a swipe that starts on it is not a tap.
import * as THREE from 'three';
import { createBoard } from './board.js';
import { fitScale } from '../lib/fit.js';
import { onTap } from './tap.js';

const DESK = [{ text: 'OPEN TO INTERNSHIPS', color: 'gold' }, { text: '2027/28', color: 'white' }];
const PHONE = [{ text: 'OPEN TO', color: 'gold' }, { text: 'INTERNSHIPS', color: 'gold' }, { text: '2027/28', color: 'white' }];

export async function mount({ world, stage, section }) {
  const box = section.querySelector('.end-board');
  const narrow = matchMedia('(max-width: 860px)');
  const group = new THREE.Group();
  let board = await createBoard({ rows: narrow.matches ? PHONE : DESK });
  group.add(board.group);
  // rebuilt when the breakpoint is crossed; only the latest rebuild counts
  let generation = 0, gone = false;
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
  const debug = { fit: null, rippled: false, text: () => board.text() };
  const onMove = (e) => { if (e.pointerType === 'mouse') { board.hover(board.pick(stage.camera, ndc(e))); stage.invalidate(); } };
  const onLeave = () => board.hover(-1);
  // a tap ripples the board; a drag or a swipe that starts on it does not
  const offTap = onTap(box, (e) => { board.ripple(board.pick(stage.camera, ndc(e))); debug.rippled = true; stage.invalidate(); });
  box.addEventListener('pointermove', onMove);
  box.addEventListener('pointerleave', onLeave);

  return {
    group,
    debug,
    update(local, f) {
      const w = world.boxToWorld(box, 'page');
      const s = fitScale(board.size, w);
      board.group.scale.setScalar(s);
      board.group.position.set(w.x, w.y, w.z);
      debug.fit = { el: box, x: w.x, y: w.y, z: w.z, w: board.size.w * s, h: board.size.h * s };
      const P = f.pointer;
      const mouse = P.inside && P.type === 'mouse';
      board.lean(mouse ? P.nx : 0, mouse ? P.ny : 0);
      return board.update(f.now, f.dt);
    },
    dispose() {
      gone = true;
      narrow.removeEventListener('change', onBreak);
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerleave', onLeave);
      offTap();
      board.dispose();
    },
  };
}
