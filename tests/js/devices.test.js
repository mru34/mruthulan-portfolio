import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { makePhone, makeLaptop, PHONE, LAPTOP } from '../../js/3d/devices.js';

const sizeOf = (obj) => { obj.updateMatrixWorld(true); return new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3()); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

test('the phone is a 6.1-inch phone: 71.5 x 147 x 7.8 mm', () => {
  const s = sizeOf(makePhone({ shadow: false }).group);
  assert.ok(near(s.x, PHONE.w, 0.005) && near(s.y, PHONE.h, 0.005), `${s.x} x ${s.y}`);
  assert.ok(near(s.z, PHONE.d, 0.01), `${s.z}`);
});

test('the laptop is a 14-inch laptop, and its lid opens to about 106 degrees', () => {
  const lap = makeLaptop({ shadow: false, detail: false });
  lap.setOpen(1);
  const open = sizeOf(lap.group);
  assert.ok(near(open.x, LAPTOP.w, 0.01), `width ${open.x}`);
  assert.ok(open.y > 2.0 && open.y < 2.3, `open height ${open.y}`);
  lap.setOpen(0);
  const shut = sizeOf(lap.group);
  assert.ok(shut.y < 0.3, `shut height ${shut.y}`);
  assert.ok(near(shut.z, LAPTOP.depth, 0.06), `shut depth ${shut.z}`);
});

test('the laptop screen is 16:10, like the captures', () => {
  const lap = makeLaptop({ shadow: false, detail: false });
  const geo = lap.screen.children[0].geometry;   // measured flat: the lid itself is tilted back
  geo.computeBoundingBox();
  const s = geo.boundingBox.getSize(new THREE.Vector3());
  assert.ok(near(s.x / s.y, 1.6, 0.01), `${s.x / s.y}`);
});
