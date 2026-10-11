// 01 · SignalBridge: the control room at night. The youth's phone stands in front; behind it the rest of
// SignalBridge's real screens stand in rows on their monitor posts. The scroll lifts the youth's real message
// off the phone and the camera follows it along a line of light, through the real consent card (which turns
// to "Worker notified"), onto the worker's laptop, whose screen becomes the handoff brief. Every picture is a
// capture or a crop of the running app (design/build_3d_assets.py); every object is built at real size.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makePhone, makeLaptop } from '../devices.js';
import { loadTexture, card, bez, glow, panel, contactShadow, disposeTree } from '../textures.js';
import { lerp, Spring } from '../../lib/motion.js';
import { sbLocal } from './signalbridge-timeline.js';

export const MESSAGE_BOX = [285, 240, 1122, 510];   // must match design/build_3d_assets.py (tested)
const CAPTURE = { w: 1170, h: 2532 };
const TEAL = 0x2bc4bc;
const FLOOR = -0.98;
// the scene, in decimetres from the chapter's origin
const PHONE_AT = [-1.6, -0.22, 1.0];
const LAPTOP_AT = [1.3, FLOOR + 0.0775, 0];
const GATE = { at: [-0.1, 0.95, 0.9], w: 1.3 };
// the screens in the room: [texture, width, x, centre height, z, desk only]
const WALL = [
  ['sb-wall-chat', 2.9, -3.5, 0.95, -3.2, false],
  ['sb-wall-radar', 2.9, 0, 0.95, -3.4, false],
  ['sb-wall-cases', 2.9, 3.5, 0.95, -3.2, false],
  ['sb-wall-supervisor', 4.2, -5.8, 2.3, -6.8, true],
  ['sb-wall-preview', 4.0, 0, 2.4, -7.2, true],
  ['sb-phone-preview', 1.3, 5.6, 1.7, -6.6, true],
];

const dark = () => new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.7 });

// a monitor on its post: the panel, a post down to the floor and a foot, turned a little toward the middle
function monitor(tex, w, aspect, x, y, z) {
  const h = w / aspect;
  const g = new THREE.Group();
  const { group } = panel(tex, w, h);
  g.add(group);
  const postH = y - h / 2 - FLOOR;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, postH, 0.07), dark());
  post.position.set(0, -h / 2 - postH / 2, -0.08);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(Math.min(0.9, w * 0.3), 0.04, 0.5, 2, 0.015), dark());
  foot.position.set(0, FLOOR - y + 0.02, -0.08);
  const shadow = contactShadow(w * 0.6, 0.9, 0.55);
  shadow.position.set(0, FLOOR - y + 0.002, -0.08);
  g.add(post, foot, shadow);
  g.position.set(x, y, z);
  g.rotation.y = -x * 0.05;
  return g;
}

// a small dark stand the phone leans back on
function stand() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.04, 0.42, 2, 0.015), dark());
  base.position.set(0, FLOOR + 0.02, 0);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.9, 0.035, 2, 0.012), dark());
  back.position.set(0, FLOOR + 0.45, -0.1);
  back.rotation.x = -0.2;
  g.add(base, back);
  return g;
}

export async function mount({ world, stage, section, origin, form }) {
  const desk = form === 'desk';
  const wall = WALL.filter((p) => desk || !p[5]);
  const names = ['sb-phone-consent', 'sb-phone-notified', 'sb-laptop-handoffs', 'sb-laptop-brief', 'sb-message', 'sb-consent-ask', 'sb-consent-given', ...wall.map((p) => p[0])];
  const tex = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await loadTexture(`assets/3d/${n}.webp`)])));

  const group = new THREE.Group();
  group.position.copy(origin);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x0d1313, roughness: 0.4, metalness: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR;
  const pool = glow(TEAL, 16, 11, 0.2);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, FLOOR + 0.01, 0.2);
  const behind = glow(TEAL, 18, 10, 0.24);
  behind.position.set(0.5, 1.4, -5);
  group.add(floor, pool, behind);
  for (const [n, w, x, y, z] of wall) {
    const img = tex[n].image;
    group.add(monitor(tex[n], w, img.width / img.height, x, y, z));
    const under = glow(TEAL, w * 1.1, 1.2, 0.16);
    under.rotation.x = -Math.PI / 2;
    under.position.set(x, FLOOR + 0.008, z + 0.5);
    group.add(under);
  }

  const phone = makePhone({ screen: tex['sb-phone-consent'], after: tex['sb-phone-notified'] });
  phone.group.position.set(...PHONE_AT);
  phone.group.rotation.set(-0.2, 0.25, 0);
  const phoneStand = stand();
  phoneStand.position.set(PHONE_AT[0], 0, PHONE_AT[2] - 0.02);
  phoneStand.rotation.y = 0.25;
  const laptop = makeLaptop({ screen: tex['sb-laptop-handoffs'], after: tex['sb-laptop-brief'] });
  laptop.group.position.set(...LAPTOP_AT);
  laptop.group.rotation.y = -0.3;
  laptop.setOpen(1);
  group.add(phone.group, phoneStand, laptop.group);
  group.updateMatrixWorld(true);

  // the message: as wide on the phone's screen as the bubble is in the capture
  const msgW = phone.screenSize.w * ((MESSAGE_BOX[2] - MESSAGE_BOX[0]) / CAPTURE.w);
  const msgH = msgW * ((MESSAGE_BOX[3] - MESSAGE_BOX[1]) / (MESSAGE_BOX[2] - MESSAGE_BOX[0]));
  const message = card(msgW, msgH, tex['sb-message']);
  const bubbleLocal = new THREE.Vector3(
    ((MESSAGE_BOX[0] + MESSAGE_BOX[2]) / 2 / CAPTURE.w - 0.5) * phone.screenSize.w,
    (0.5 - (MESSAGE_BOX[1] + MESSAGE_BOX[3]) / 2 / CAPTURE.h) * phone.screenSize.h, 0.01);
  const consent = card(1, 213 / 1074, tex['sb-consent-ask'], tex['sb-consent-given']);   // unit width
  group.add(message, consent);

  // the three points of the journey, in the scene's own space
  const local = (obj, v) => group.worldToLocal(obj.localToWorld(v.clone()));
  const S = local(phone.screen, bubbleLocal);
  const S1 = S.clone().add(new THREE.Vector3(0.1, 0.05, 0.45));
  const G = new THREE.Vector3(...GATE.at);
  // the message waits just above the card while it turns
  const Gm = G.clone().add(new THREE.Vector3(0, (GATE.w * 213) / 1074 / 2 + (GATE.w * 0.8 * msgH) / msgW / 2 + 0.08, 0.06));
  const E = local(laptop.screen, new THREE.Vector3(0, 0, 0.02));
  const beam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([S1, Gm, E]), 160, 0.012, 6, false),
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
  group.add(beam);
  world.root.add(group);

  // tapping the consent card turns it over (decorative: the words carry the meaning)
  const flip = new Spring(0, { stiffness: 120, damping: 18 });
  const pin = section.querySelector('.pin');
  const onDown = (e) => {
    if (e.target.closest('a, button')) return;
    if (world.ray(e.clientX, e.clientY).intersectObject(consent, true).length) {
      flip.target = flip.target ? 0 : 1;
      stage.invalidate();
    }
  };
  pin.addEventListener('pointerdown', onDown);

  return {
    group,
    debug: { anchors: { laptopScreen: E.clone().add(origin), phoneScreen: S.clone().add(origin), gate: G.clone().add(origin) } },
    update(t, f) {
      const visible = t > -1.2 && t < 1.7;
      group.visible = visible;
      if (!visible) return false;
      const st = sbLocal(t);
      const busy = flip.step(f.dt);
      phone.mix(st.phoneAfter);
      laptop.mix(st.brief);
      const ix = beam.geometry.index.count;
      beam.geometry.setDrawRange(0, Math.floor((ix * st.beam) / 3) * 3);
      beam.visible = st.beam > 0 && st.brief < 1;
      beam.material.opacity = 0.55 * (1 - st.brief);   // the line has done its work once the brief is there

      message.visible = st.lift > 0 && st.toLaptop < 1;
      if (message.visible) {
        const pos = st.toGate < 1
          ? bez(S.clone().lerp(S1, st.lift), S1.clone().lerp(Gm, 0.5).add(new THREE.Vector3(0, 0.5, 0.3)), Gm, st.toGate)
          : bez(Gm, Gm.clone().lerp(E, 0.5).add(new THREE.Vector3(0, 0.4, 0.5)), E, st.toLaptop);
        // as wide as the bubble on the phone, then most of the card's width at the gate, then small into the laptop
        const atGate = (GATE.w * 0.8) / msgW;
        message.position.copy(pos);
        message.scale.setScalar(lerp(lerp(1, atGate, st.toGate), 0.5, st.toLaptop));
        message.rotation.set(0, lerp(lerp(0.25, 0, st.lift), -0.3, st.toLaptop), 0);
      }
      const cs = st.cardIn * (1 - st.cardOut);
      consent.visible = cs > 0.001;
      consent.position.copy(G);
      consent.scale.setScalar(Math.max(cs, 0.001) * GATE.w);
      consent.rotation.set(0, Math.PI * ((st.consent + flip.value) % 2), 0);
      return busy;
    },
    dispose() {
      pin.removeEventListener('pointerdown', onDown);
      world.root.remove(group);
      disposeTree(group);
    },
  };
}
