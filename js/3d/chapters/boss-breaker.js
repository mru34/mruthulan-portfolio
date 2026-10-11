// 02 · Boss Breaker: the raid. The game's real Boss Raid screen stands large at the back of an arena with the
// Stress Dragon's health bar across the top; in front, the phone with the same screen, a hand of the real
// challenge cards, and the leaderboard with each player's damage standing as a bar. The scroll drains the
// boss to the HP in the captures; a click anywhere (or Attack) hits it for 350: a card flies into the bar,
// the arena shakes, and at 0 the Stress Dragon is defeated. Scrolling back above the chapter resets the fight.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makePhone, makeMonitor, makeStand } from '../devices.js';
import { loadTexture, card, bez, glow, panel, contactShadow, disposeTree, nextFrame } from '../textures.js';
import { lerp, Spring, easeInOut } from '../../lib/motion.js';
import { onTap } from '../tap.js';
import { bossHp, hpText, bxState, START_HP } from './boss-timeline.js';

const ORANGE = 0xf06a43;
const FLOOR = -1.0;
const BAR = { len: 9, at: [0.3, 6.2, -5.6] };
const DAMAGE = [1240, 760, 560, 360, 240];   // the leaderboard in the capture
// the big screen's crop of d-boss.png (the page's content, not its empty lower half): must match
// design/build_3d_assets.py (tested)
export const DISPLAY_CROP = [100, 0, 2780, 1120];
const DISPLAY = { w: 11, y: 3.5, z: -7 };
const DISPLAY_H = (DISPLAY.w * (DISPLAY_CROP[3] - DISPLAY_CROP[1])) / (DISPLAY_CROP[2] - DISPLAY_CROP[0]);

export async function mount({ world, stage, section, origin, form }) {
  const desk = form === 'desk';
  const nCards = desk ? 6 : 3;
  const names = ['bx-display', 'bx-phone', 'bx-dragon', ...(desk ? ['bx-leaderboard'] : []), ...Array.from({ length: nCards }, (_, i) => `bx-card-${i + 1}`)];
  const tex = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await loadTexture(`assets/3d/${n}.webp`)])));

  const group = new THREE.Group();
  group.position.copy(origin);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x120e0d, roughness: 0.85, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR;
  const pool = glow(ORANGE, 14, 7, 0.12);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, FLOOR + 0.01, -4.5);
  const behind = glow(ORANGE, 22, 12, 0.22);
  behind.position.set(0, 3, -8.6);
  group.add(floor, pool, behind);

  // the big screen on two posts
  const display = panel(tex['bx-display'], DISPLAY.w, DISPLAY_H);
  display.group.position.set(0, DISPLAY.y, DISPLAY.z);
  const postH = DISPLAY.y - DISPLAY_H / 2 - FLOOR;
  const post = (x) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, postH, 0.12), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.7 }));
    p.position.set(x, FLOOR + postH / 2, DISPLAY.z - 0.1);
    return p;
  };
  const displayShadow = contactShadow(DISPLAY.w + 0.4, 2.2, 0.6);
  displayShadow.position.set(0, FLOOR + 0.004, DISPLAY.z);
  group.add(display.group, post(-4.2), post(4.2), displayShadow);

  await nextFrame();
  // the health bar: a dark track, the fill growing from its left end, the dragon's portrait at the start
  const track = new THREE.Mesh(new RoundedBoxGeometry(BAR.len + 0.12, 0.46, 0.3, 3, 0.1), new THREE.MeshStandardMaterial({ color: 0x1b1716, roughness: 0.5, metalness: 0.4 }));
  track.position.set(...BAR.at);
  const fillGeo = new RoundedBoxGeometry(BAR.len, 0.34, 0.32, 3, 0.09);
  fillGeo.translate(BAR.len / 2, 0, 0);
  const fill = new THREE.Mesh(fillGeo, new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.55, roughness: 0.35 }));
  fill.position.set(BAR.at[0] - BAR.len / 2, BAR.at[1], BAR.at[2] + 0.01);
  const dragon = card(1.05, 1.05 * (244 / 184), tex['bx-dragon'], null, { color: 0x1b1716 });
  dragon.position.set(BAR.at[0] - BAR.len / 2 - 0.85, BAR.at[1], BAR.at[2] + 0.12);
  const barGlow = glow(ORANGE, BAR.len * 1.2, 1.6, 0.18);
  barGlow.position.set(BAR.at[0], BAR.at[1], BAR.at[2] - 0.2);
  group.add(track, fill, dragon, barGlow);

  await nextFrame();
  // the phone on its stand
  const phone = makePhone({ screen: tex['bx-phone'] });
  phone.group.position.set(-1.8, FLOOR + 0.04 + 0.72, 0.6);
  phone.group.rotation.set(-0.2, 0.3, 0);
  const stand = makeStand(FLOOR);
  stand.position.set(-1.8, 0, 0.58);
  stand.rotation.y = 0.3;
  group.add(phone.group, stand);

  await nextFrame();
  // the hand of challenge cards, fanned about a point below them
  const pivot = new THREE.Vector3(desk ? 1.6 : 0.6, -0.2, 2.0);
  const cards = Array.from({ length: nCards }, (_, i) => {
    const c = card(2.0, 2.0 * (194 / 640), tex[`bx-card-${i + 1}`], null, { color: 0x111521 });
    group.add(c);
    return c;
  });
  const fanPose = (i, open) => {
    const a = lerp(0, lerp(0.42, -0.42, nCards > 1 ? i / (nCards - 1) : 0.5), open);
    const r = 1.5;
    return { pos: new THREE.Vector3(pivot.x - Math.sin(a) * r, pivot.y + Math.cos(a) * r, pivot.z + i * 0.015), rz: a };
  };

  await nextFrame();
  // the leaderboard on its post, and a bar of each player's damage in front of it
  const bars = [];
  if (desk) {
    group.add(makeMonitor(tex['bx-leaderboard'], 2.6, 1271 / 518, -3.4, 0.7, -2.6, FLOOR));
    DAMAGE.forEach((dmg, i) => {
      const h = (3.0 * dmg) / DAMAGE[0];
      const g = new RoundedBoxGeometry(0.42, h, 0.42, 2, 0.05);
      g.translate(0, h / 2, 0);
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: i === 0 ? 0xb8553a : 0x3a2c27, roughness: 0.45, metalness: 0.3 }));
      m.position.set(-5.4 + i * 0.55, FLOOR, -1.4);
      bars.push(m);
      group.add(m);
    });
  }
  world.root.add(group);

  // the fight
  const hud = {
    box: section.querySelector('.bx-hud'),
    hp: section.querySelector('[data-hp]'), hit: section.querySelector('[data-hit]'),
    live: section.querySelector('[data-hp-live]'), down: section.querySelector('[data-defeated]'),
  };
  const hpSpring = new Spring(START_HP, { stiffness: 140, damping: 20 });
  let hits = 0, local = -1, shownHp = -1, throwN = 0, throwT = 1, hitTimer = 0, wasVisible = false;
  const fillEnd = () => new THREE.Vector3(fill.position.x + (BAR.len * hpSpring.value) / START_HP, BAR.at[1], BAR.at[2] + 0.3);
  function hit() {
    if (bossHp(local, hits) <= 0) return;
    hits += 1;
    throwN = (throwN + 1) % nCards;
    throwT = 0;
    world.shake(18);
    hud.hit.textContent = '−350';
    clearTimeout(hitTimer);
    hitTimer = setTimeout(() => { hud.hit.textContent = ''; }, 600);
    hud.live.textContent = `Stress Dragon: ${hpText(bossHp(local, hits))} HP`;
    stage.invalidate();
  }
  const pin = section.querySelector('.pin');
  const offTap = onTap(pin, (e) => { if (!e.target.closest('a, button')) hit(); });   // a tap, never a swipe
  const button = section.querySelector('[data-attack]');
  button.addEventListener('click', hit);

  return {
    group,
    debug: {
      fill: () => fill.scale.x,
      anchors: {
        screenLeft: new THREE.Vector3(-DISPLAY.w / 2, DISPLAY.y, DISPLAY.z).add(origin),
        screenRight: new THREE.Vector3(DISPLAY.w / 2, DISPLAY.y, DISPLAY.z).add(origin),
      },
    },
    update(t, f) {
      local = t;
      if (t < -0.6 && hits) { hits = 0; hud.live.textContent = ''; }
      const visible = t > -1.2 && t < 1.7;
      group.visible = visible;
      const hp = bossHp(t, hits);
      if (hp !== shownHp) {
        shownHp = hp;
        hud.hp.textContent = hpText(hp);
        hud.down.hidden = hp > 0;
      }
      if (!visible) { wasVisible = false; return false; }
      const st = bxState(t);
      hpSpring.target = hp;
      // arriving (by scroll, link or reload), the bar is where the HP is; it only moves with hits and the scroll
      if (!wasVisible) { hpSpring.value = hp; hpSpring.velocity = 0; wasVisible = true; }
      let busy = hpSpring.step(f.dt);
      fill.scale.x = Math.max(0.0001, hpSpring.value / START_HP);
      // the HP readout sits just above the middle of the bar, wherever the camera has it on screen; the pin it
      // lives in is stuck to the top of the screen while the chapter is pinned, and scrolls in and out with it
      const p = new THREE.Vector3(BAR.at[0], BAR.at[1] + 0.3, BAR.at[2]).add(origin).project(f.camera);
      const secTop = -t * f.unit;
      const pinTop = secTop > 0 ? secTop : Math.min(0, secTop + 0.6 * f.unit);
      hud.box.style.transform = `translate(${((p.x + 1) / 2) * innerWidth}px, ${((1 - p.y) / 2) * f.vh - pinTop}px) translate(-50%, -100%)`;
      fill.visible = hpSpring.value > 1;
      bars.forEach((b) => { b.scale.y = Math.max(0.001, st.bars); });
      // the hand opens with the scroll; the thrown card flies to the end of the bar and comes back
      if (throwT < 1) { throwT = Math.min(1, throwT + f.dt / 520); busy = true; }
      cards.forEach((c, i) => {
        const { pos, rz } = fanPose(i, st.cards);
        c.position.copy(pos);
        c.rotation.set(-0.25, 0, rz);
        c.visible = st.cards > 0.02 || i === 0;
        if (i === throwN && throwT < 1) {
          const k = throwT < 0.5 ? easeInOut(throwT * 2) : easeInOut((1 - throwT) * 2);
          const end = fillEnd();
          c.position.copy(bez(pos, pos.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 2.5, 1.5)), end, k));
          c.rotation.set(-0.25 + k * 0.4, k * 3, rz * (1 - k));
        }
      });
      return busy;
    },
    dispose() {
      clearTimeout(hitTimer);
      offTap();
      button.removeEventListener('click', hit);
      world.root.remove(group);
      disposeTree(group);
    },
  };
}
