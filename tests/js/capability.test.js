import test from 'node:test';
import assert from 'node:assert/strict';
import { want3D } from '../../js/lib/capability.js';

const ok = { webgl2: true, reducedMotion: false, saveData: false, deviceMemory: 8, forced: null };

test('the 3D runs only when everything allows it', () => {
  assert.equal(want3D(ok), true);
  assert.equal(want3D({ ...ok, webgl2: false }), false);
  assert.equal(want3D({ ...ok, reducedMotion: true }), false);
  assert.equal(want3D({ ...ok, saveData: true }), false);
  assert.equal(want3D({ ...ok, deviceMemory: 2 }), false);
  assert.equal(want3D({ ...ok, deviceMemory: undefined }), true);
});

test('?mode= forces it either way, but never without WebGL 2', () => {
  assert.equal(want3D({ ...ok, forced: 'stills' }), false);
  assert.equal(want3D({ ...ok, reducedMotion: true, forced: '3d' }), true);
  assert.equal(want3D({ ...ok, webgl2: false, forced: '3d' }), false);
});
