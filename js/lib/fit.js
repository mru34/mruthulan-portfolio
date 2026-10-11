// The page decides where things go; the 3D fills those boxes. Pure math, so stills and live frames line up.

// world units per CSS pixel on the z = 0 plane, for a camera `dist` away
export function worldPerPixel(fovDeg, dist, viewportH) {
  return (2 * Math.tan((fovDeg * Math.PI) / 360) * dist) / viewportH;
}

// a DOMRect-like box in CSS pixels → its centre and size in world units on z = 0
export function rectToWorld(rect, vw, vh, k) {
  return {
    x: (rect.left + rect.width / 2 - vw / 2) * k,
    y: -(rect.top + rect.height / 2 - vh / 2) * k,
    w: rect.width * k,
    h: rect.height * k,
  };
}

// the largest uniform scale at which something of natural size `nat` fits inside `box`
export function fitScale(nat, box) {
  return Math.min(box.w / nat.w, box.h / nat.h);
}
