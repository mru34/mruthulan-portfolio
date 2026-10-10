// Where the page glides when scrolling stops: the nearest key pose ahead in the direction the visitor
// was going, if it is close. Never back against them, so small scrolls are never undone.
export function snapTarget(y, targets, viewportH, dir, reach = 0.6) {
  let best = null;
  for (const t of targets) {
    const ahead = dir > 0 ? t - y : y - t;
    if (ahead < 0) continue;
    if (best === null || Math.abs(t - y) < Math.abs(best - y)) best = t;
  }
  if (best === null) return null;
  const d = Math.abs(best - y);
  return d > 2 && d <= reach * viewportH ? best : null;
}

// which chapter is on screen: the one whose section spans the middle of the viewport, or -1
export function currentChapter(rects, viewportH) {
  const mid = viewportH / 2;
  return rects.findIndex((r) => r.top <= mid && r.bottom > mid);
}
