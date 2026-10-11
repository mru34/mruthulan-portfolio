// The camera script: where each scene stands along the path, its colour, and the keys the camera passes
// through in it. t is chapter-local time in screens (-1 entering from below, 0 pinned, 0.6 pin ends, 1.6
// gone). Every flight scene has a key at -0.4 (arriving), 0.42 (stop: the payoff), 0.6 (stop: still the
// payoff) and 0.9 (leaving), so the words' beats and the camera agree. Units are decimetres; `at` and the
// object positions in each chapter's module are relative to that chapter's origin. A key's `phone` fields
// replace its own on phone screens (the words sit along the bottom there, not in a corner).
const hex = (n) => [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];

export const COLORS = {
  hero: hex(0xc9ccd6), signalbridge: hex(0x2bc4bc), 'boss-breaker': hex(0xf06a43),
  'better-call-bhai': hex(0xe3b53a), meant: hex(0x4da3ff), knowcad: hex(0x9b87ff), page: hex(0xe8b64c),
};

export const ORIGINS = {
  hero: [0, 0, 0], signalbridge: [0, 0, -80], 'boss-breaker': [60, 0, -160],
  'better-call-bhai': [120, 0, -240], meant: [180, 0, -320], knowcad: [240, 0, -400], page: [300, 0, -480],
};

export const KEYS = {
  signalbridge: [
    { t: -0.3, at: [-1.85, 0.25, 0.95], from: [0.12, 0.06, 1], w: 1.2, h: 1.75, phone: { at: [-1.55, 0.05, 0.95], w: 1.0, h: 2.2 } },
    { t: 0.0, at: [-0.4, 0.5, -1.0], from: [0.08, 0.18, 1], w: 8, h: 5, phone: { at: [0, 0.3, -1], w: 5, h: 8 } },
    { t: 0.16, at: [-0.8, 1.05, 0.9], from: [0.0, 0.12, 1], w: 3.6, h: 2.2, phone: { at: [-0.1, 0.6, 0.9], w: 1.8, h: 3 } },
    { t: 0.42, at: [0.7, 0.3, -1.0], from: [-0.2, 0.22, 1], w: 6.0, h: 3.7, stop: true, phone: { at: [1.65, -0.3, -1.2], w: 3.2, h: 4 } },
    { t: 0.6, at: [0.7, 0.3, -1.0], from: [-0.2, 0.22, 1], w: 6.0, h: 3.7, stop: true, phone: { at: [1.65, -0.3, -1.2], w: 3.2, h: 4 } },
    { t: 0.9, at: [3.2, 0.9, -3.2], from: [0.55, 0.15, 1], w: 6, h: 4 },
  ],
  'boss-breaker': [
    { t: -0.4, at: [0, 5.0, -5.6], from: [0, 0.05, 1], w: 13, h: 7, phone: { w: 9, h: 9 } },
    { t: 0.05, at: [0.4, 3.2, -4.5], from: [0.12, 0.1, 1], w: 15, h: 9, phone: { at: [0, 3.2, -4.5], w: 10, h: 12 } },
    { t: 0.42, at: [0.9, 3.2, -3.5], from: [0.08, 0.16, 1], w: 16.5, h: 10, stop: true, phone: { at: [0, 1.6, -3.5], w: 10, h: 14 } },
    { t: 0.6, at: [0.9, 3.2, -3.5], from: [0.08, 0.16, 1], w: 16.5, h: 10, stop: true, phone: { at: [0, 1.6, -3.5], w: 10, h: 14 } },
    { t: 0.9, at: [4, 2.2, -6], from: [0.5, 0.2, 1], w: 12, h: 8 },
  ],
  'better-call-bhai': [
    { t: -0.4, at: [-2.5, 2.4, -0.6], from: [0.45, 0.05, 1], w: 3.5, h: 5, phone: { w: 3, h: 6 } },
    { t: 0.0, at: [0.2, 0.6, 0.3], from: [0, 0.08, 1], w: 9, h: 5.6, phone: { at: [0.3, 0.2, 0], w: 5, h: 8 } },
    { t: 0.42, at: [0.55, 0.55, 0.2], from: [0.05, 0.1, 1], w: 7.6, h: 4.75, stop: true, phone: { at: [0.5, -0.5, 0], w: 4.4, h: 7 } },
    { t: 0.6, at: [0.55, 0.55, 0.2], from: [0.05, 0.1, 1], w: 7.6, h: 4.75, stop: true, phone: { at: [0.5, -0.5, 0], w: 4.4, h: 7 } },
    { t: 0.9, at: [2.9, 1.2, -0.8], from: [-0.35, 0.1, 1], w: 4.5, h: 5.5 },
  ],
  meant: [
    { t: -0.4, at: [0.6, 2.0, -1], from: [0.3, 0.5, 1], w: 12, h: 7.5, phone: { w: 8, h: 11 } },
    { t: 0.0, at: [-0.3, 1.2, 0.4], from: [0.3, 0.3, 1], w: 5.2, h: 3.3, phone: { at: [-0.6, 0.6, 0.4], w: 3.4, h: 5 } },
    { t: 0.42, at: [1.75, 1.1, 0.1], from: [0.2, 0.42, 1], w: 9.2, h: 5.75, stop: true, phone: { at: [0.05, 0.1, 0.3], w: 6.2, h: 9 } },
    { t: 0.6, at: [1.75, 1.1, 0.1], from: [0.2, 0.42, 1], w: 9.2, h: 5.75, stop: true, phone: { at: [0.05, 0.1, 0.3], w: 6.2, h: 9 } },
    { t: 0.9, at: [2.4, 1.4, -1.2], from: [-0.2, 0.3, 1], w: 9, h: 6 },
  ],
  knowcad: [
    { t: -0.4, at: [0, 0, -6], from: [0, 0, 1], d: 10 },
    { t: -0.1, at: [0.5, 0.3, -18], from: [0.05, 0.03, 1], d: 8 },
    { t: 0.15, at: [0, 0, -28], from: [0, 0.02, 1], d: 9 },
    { t: 0.42, at: [0, 0, -31], from: [0, 0, 1], w: 4.4, h: 3.1, stop: true },
    { t: 0.6, at: [0, 0, -31], from: [0, 0, 1], w: 4.4, h: 3.1, stop: true },
    { t: 0.9, at: [0, -2, -34], from: [0, 0.6, 1], d: 12 },
  ],
};
