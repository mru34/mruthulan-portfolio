// 01 · SignalBridge: the bridge. The youth's phone and the worker's laptop stand apart. The scroll lifts the
// youth's real message off the phone, stops it at the real consent card, which turns to "Worker notified",
// and lands it on the laptop as the handoff brief. Every picture is a crop of the running app's screens.
import * as THREE from 'three';
import { makePhone, makeLaptop } from '../devices.js';
import { loadTexture, roundedRect, screenGeometry } from '../textures.js';
import { fitScale } from '../../lib/fit.js';
import { sectionProgress, clamp, lerp, Spring } from '../../lib/motion.js';
import { sbState } from './signalbridge-timeline.js';

export const MESSAGE_BOX = [285, 240, 1122, 510];   // must match design/build_3d_assets.py (tested)
const CAPTURE = { w: 1170, h: 2532 };
const TEAL = 0x2bc4bc;
// where things stand inside the chapter's box, in the set's own units; the gate is where the message
// stops at the consent card (w: the card's width), in front of and between the two devices
const SETS = {
  desk: { size: { w: 8.0, h: 5.0 }, phone: { x: -2.65, y: -0.25, s: 1.7, turn: 0.28 }, laptop: { x: 1.1, y: -0.45, s: 1.45, turn: -0.3 }, gate: { x: -0.6, y: 1.35, z: 1.4, w: 2.4 } },
  narrow: { size: { w: 4.6, h: 5.6 }, phone: { x: -1.2, y: -1.5, s: 1.15, turn: 0.2 }, laptop: { x: 0.4, y: 0.3, s: 1.0, turn: -0.2 }, gate: { x: -0.1, y: -0.45, z: 1.4, w: 2.0 } },
};

// a physical card: a thin dark slab with the crop printed on its face (and another on its back)
function card(w, h, front, back) {
  const r = Math.min(w, h) * 0.18;
  const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth: 0.02, bevelEnabled: false, curveSegments: 10 }),
    new THREE.MeshStandardMaterial({ color: 0x101a19, roughness: 0.6, metalness: 0.1 }));
  slab.position.z = -0.01;
  const face = (map, z, turned) => {
    const m = new THREE.Mesh(screenGeometry(w, h, r), new THREE.MeshStandardMaterial({ map, roughness: 0.45, metalness: 0, transparent: true }));
    m.position.z = z;
    if (turned) m.rotation.y = Math.PI;
    return m;
  };
  const g = new THREE.Group();
  g.add(slab, face(front, 0.011, false));
  if (back) g.add(face(back, -0.011, true));
  return g;
}

const bez = (a, c, b, t) => new THREE.Vector3()
  .addScaledVector(a, (1 - t) ** 2).addScaledVector(c, 2 * (1 - t) * t).addScaledVector(b, t * t);

export async function mount(stage, section) {
  const box = section.querySelector('[data-anchor]');
  const names = ['sb-phone-consent', 'sb-phone-notified', 'sb-laptop-handoffs', 'sb-laptop-brief', 'sb-message', 'sb-consent-ask', 'sb-consent-given'];
  const [consentScreen, notified, handoffs, brief, messageTex, ask, given] = await Promise.all(names.map((n) => loadTexture(`assets/3d/${n}.webp`)));

  const phone = makePhone({ screen: consentScreen, after: notified });
  const laptop = makeLaptop({ screen: handoffs, after: brief });
  const set = new THREE.Group();
  set.add(phone.group, laptop.group);
  stage.scene.add(set);
  const rim = new THREE.DirectionalLight(TEAL, 1.1);   // the project colour, as light on the edges only
  rim.position.set(8, 4, -6);
  stage.scene.add(rim);

  // the message: as wide on the phone's screen as the bubble is in the capture
  const msgW = phone.screenSize.w * ((MESSAGE_BOX[2] - MESSAGE_BOX[0]) / CAPTURE.w);
  const msgH = msgW * ((MESSAGE_BOX[3] - MESSAGE_BOX[1]) / (MESSAGE_BOX[2] - MESSAGE_BOX[0]));
  const message = card(msgW, msgH, messageTex);
  const bubbleLocal = new THREE.Vector3(
    ((MESSAGE_BOX[0] + MESSAGE_BOX[2]) / 2 / CAPTURE.w - 0.5) * phone.screenSize.w,
    (0.5 - (MESSAGE_BOX[1] + MESSAGE_BOX[3]) / 2 / CAPTURE.h) * phone.screenSize.h, 0.01);
  const consent = card(1, 213 / 1074, ask, given);   // unit width; scaled to the layout's gate width
  set.add(message, consent);

  const narrow = matchMedia('(max-width: 860px)');
  let layout = SETS[narrow.matches ? 'narrow' : 'desk'];
  let beam = null;
  const leanX = new Spring(0, { stiffness: 90, damping: 19 });
  const leanY = new Spring(0, { stiffness: 90, damping: 19 });

  function place(st) {
    const L = layout;
    const a = 1 - st.arrive;
    phone.group.position.set(L.phone.x - 3.5 * a, L.phone.y, -1.5 * a);
    phone.group.scale.setScalar(L.phone.s);
    phone.group.rotation.set(0.12, lerp(0.9, L.phone.turn, st.arrive), 0);
    laptop.group.position.set(L.laptop.x + 4 * a, L.laptop.y, -1.5 * a);
    laptop.group.scale.setScalar(L.laptop.s);
    laptop.group.rotation.set(0.3, lerp(-0.8, L.laptop.turn, st.arrive), 0);
    laptop.setOpen(st.lid);
    set.updateMatrixWorld(true);
  }
  // the three points of the journey, in the set's own space
  function points() {
    const S = set.worldToLocal(phone.screen.localToWorld(bubbleLocal.clone()));
    const E = set.worldToLocal(laptop.screen.localToWorld(new THREE.Vector3(0, 0, 0.02)));
    const g = layout.gate;
    const G = new THREE.Vector3(g.x, g.y, g.z);
    // the message waits just above the card while it turns
    const Gm = G.clone().add(new THREE.Vector3(0, (g.w * 213) / 1074 / 2 + (g.w * 0.8 * msgH) / msgW / 2 + 0.08, 0.06));
    return { S, S1: S.clone().add(new THREE.Vector3(0, 0, 0.45)), G, Gm, E };
  }
  // the line of light, built once the devices stand in their final places
  function buildBeam() {
    if (beam) { set.remove(beam); beam.geometry.dispose(); }
    place(sbState(1));
    const { S1, Gm, E } = points();
    const curve = new THREE.CatmullRomCurve3([S1, Gm, E]);
    beam = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.012, 6, false),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.45, depthWrite: false }));
    set.add(beam);
  }
  buildBeam();
  narrow.addEventListener('change', () => { layout = SETS[narrow.matches ? 'narrow' : 'desk']; buildBeam(); stage.invalidate(); });

  return {
    update(now, dt) {
      const r = section.getBoundingClientRect();
      const vh = stage.view.h;
      const visible = r.bottom > -0.2 * vh && r.top < 1.2 * vh;
      set.visible = visible;
      rim.visible = visible;
      if (!visible) return false;

      const st = sbState(sectionProgress(r.top, r.height, vh));
      const w = stage.boxToWorld(box);
      set.scale.setScalar(fitScale(layout.size, w));
      set.position.set(w.x, w.y, 0);
      const P = stage.pointer;
      const mouse = P.inside && P.type === 'mouse';
      leanY.target = mouse ? P.nx * 0.05 : 0;
      leanX.target = mouse ? -P.ny * 0.04 : 0;
      let busy = leanX.step(dt);
      busy = leanY.step(dt) || busy;
      const away = clamp((vh - r.bottom) / (0.6 * vh));       // after the pin: the devices turn away
      set.rotation.set(leanX.value, leanY.value + away * 0.5, 0);

      place(st);
      phone.mix(st.phoneAfter);
      laptop.mix(st.brief);
      const ix = beam.geometry.index.count;
      beam.geometry.setDrawRange(0, Math.floor((ix * st.beam) / 3) * 3);
      beam.visible = st.beam > 0;

      const { S, S1, G, Gm, E } = points();
      message.visible = st.lift > 0 && st.toLaptop < 1;
      if (message.visible) {
        const pos = st.toGate < 1
          ? bez(S.clone().lerp(S1, st.lift), S1.clone().lerp(Gm, 0.5).add(new THREE.Vector3(0, 0.5, 0.3)), Gm, st.toGate)
          : bez(Gm, Gm.clone().lerp(E, 0.5).add(new THREE.Vector3(0, 0.4, 0.5)), E, st.toLaptop);
        // as wide as the bubble on the phone, then most of the card's width at the gate, then small into the laptop
        const onPhone = layout.phone.s;
        const atGate = (layout.gate.w * 0.8) / msgW;
        message.position.copy(pos);
        message.scale.setScalar(lerp(lerp(onPhone, atGate, st.toGate), onPhone * 0.5, st.toLaptop));
        message.rotation.set(0, lerp(lerp(layout.phone.turn, 0, st.lift), layout.laptop.turn, st.toLaptop), 0);
      }
      const cs = st.cardIn * (1 - st.cardOut);
      consent.visible = cs > 0.001;
      consent.position.copy(G);
      consent.scale.setScalar(Math.max(cs, 0.001) * layout.gate.w);
      consent.rotation.set(0, Math.PI * st.consent, 0);
      return busy;
    },
  };
}
