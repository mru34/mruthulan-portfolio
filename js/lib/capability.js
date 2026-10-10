// Whether this visitor gets the live 3D or the stills. want3D is pure (and tested);
// readEnv gathers the facts in the browser.

export function want3D({ webgl2, reducedMotion, saveData, deviceMemory, forced }) {
  if (forced === 'stills') return false;
  if (forced === '3d') return Boolean(webgl2);
  if (!webgl2 || reducedMotion || saveData) return false;
  if (typeof deviceMemory === 'number' && deviceMemory < 4) return false;
  return true;
}

export function readEnv(win = window) {
  let webgl2 = false;
  try {
    const gl = win.document.createElement('canvas').getContext('webgl2');
    webgl2 = Boolean(gl);
    const lose = gl && gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();   // free the test context straight away
  } catch {
    webgl2 = false;
  }
  const conn = win.navigator.connection;
  return {
    webgl2,
    reducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(conn && conn.saveData),
    deviceMemory: win.navigator.deviceMemory,
    forced: new URLSearchParams(win.location.search).get('mode'),
  };
}
