// The hero: the name as a 3D split-flap board, fitted into .hero-board. It leans toward the mouse with a
// warm glint following the pointer, flickers a flap under the mouse, ripples on a press, and tilts back
// and away as the visitor scrolls on. The first frame matches the still exactly (no pointer, no lean).
import * as THREE from 'three';
import { createBoard } from './board.js';
import { fitScale } from '../lib/fit.js';
import { clamp, easeInOut } from '../lib/motion.js';

const DESK = [{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL NATHAN', color: 'white' }];
const PHONE = [{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL', color: 'white' }, { text: 'NATHAN', color: 'white' }];

export async function mount(stage, section) {
  const box = section.querySelector('[data-anchor]');
  const narrow = matchMedia('(max-width: 860px)');
  let board = await createBoard({ rows: narrow.matches ? PHONE : DESK });
  stage.scene.add(board.group);
  // the layout follows the same breakpoint as the box's shape; rebuild when it is crossed
  narrow.addEventListener('change', async () => {
    const next = await createBoard({ rows: narrow.matches ? PHONE : DESK });
    stage.scene.remove(board.group);
    board = next;
    stage.scene.add(board.group);
    stage.invalidate();
  });

  const glint = new THREE.PointLight(0xfff1d6, 0, 8, 1.6);
  stage.scene.add(glint);

  const ndc = (e) => new THREE.Vector2((e.clientX / stage.view.w) * 2 - 1, -(e.clientY / stage.view.h) * 2 + 1);
  box.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { board.hover(board.pick(stage.camera, ndc(e))); stage.invalidate(); } });
  box.addEventListener('pointerleave', () => board.hover(-1));
  box.addEventListener('pointerdown', (e) => { board.ripple(board.pick(stage.camera, ndc(e))); stage.invalidate(); });

  return {
    update(now, dt) {
      const r = box.getBoundingClientRect();
      const vh = stage.view.h;
      const visible = r.bottom > -vh && r.top < vh * 1.5;
      board.group.visible = visible;
      glint.visible = visible;
      if (!visible) return false;
      const w = stage.boxToWorld(box);
      // leaving the hero: the board tilts back and rises away, tied to the scroll
      const e = easeInOut(clamp(-section.getBoundingClientRect().top / section.offsetHeight));
      board.group.scale.setScalar(fitScale(board.size, w));
      board.group.position.set(w.x, w.y + e * 1.5, -e * 6);
      board.group.rotation.x = -e * 1.05;
      const P = stage.pointer;
      const mouse = P.inside && P.type === 'mouse';
      board.lean(mouse ? P.nx : 0, mouse ? P.ny : 0);
      const halfW = (stage.view.w * stage.view.k) / 2;
      const halfH = (stage.view.h * stage.view.k) / 2;
      glint.position.set(mouse ? P.nx * halfW : 0, mouse ? P.ny * halfH : 0, 2.2);
      glint.intensity = mouse ? 9 * (1 - e) : 0;
      return board.update(now, dt);
    },
  };
}
