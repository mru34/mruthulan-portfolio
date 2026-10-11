// which chapter is on screen: the one whose section spans the middle of the viewport, or -1
export function currentChapter(rects, viewportH) {
  const mid = viewportH / 2;
  return rects.findIndex((r) => r.top <= mid && r.bottom > mid);
}
