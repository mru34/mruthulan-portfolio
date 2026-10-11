// A tap: the main button (or a finger) pressed and let go within 8 px of where it went down. A drag, a swipe
// that turns into a scroll (pointercancel), or a right-click is not a tap. Returns a function that stops it.
export function onTap(el, fn) {
  let down = null;
  const start = (e) => { down = e.button === 0 ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null; };
  const end = (e) => {
    const d = down;
    down = null;
    if (d && e.pointerId === d.id && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) fn(e);
  };
  const cancel = () => { down = null; };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', cancel);
  return () => {
    el.removeEventListener('pointerdown', start);
    el.removeEventListener('pointerup', end);
    el.removeEventListener('pointercancel', cancel);
  };
}
