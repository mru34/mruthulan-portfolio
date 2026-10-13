// Watches frame times while the visitor scrolls. If frames stay slow for a while it asks for a lower
// resolution; if they are still slow after that, for the stills. After that it stays quiet.
// It judges the typical frame (the median), not the average: a few very long frames are one-off work (a room
// being built while the page scrolls, the page coming back from a case page), not a slow device, and in the
// average they alone sent a page that scrolled straight after opening to the stills.
// A frame while a scene is being built may take `allow` times as long: building costs extra once (on a slower
// laptop, scrolling the moment the page opened kept every frame building, and sent it to the stills), but a
// device far slower than that still counts as slow.
export class FrameWatch {
  constructor({ slowMs = 40, windowMs = 2000 } = {}) {
    this.slowMs = slowMs;
    this.windowMs = windowMs;
    this.level = 0;
    this.samples = [];
  }

  // now and dt in milliseconds; returns 'ok', 'lower' or 'stills'
  push(now, dt, allow = 1) {
    if (this.level >= 2) return 'ok';
    this.samples.push([now, dt, dt / allow]);
    while (this.samples.length > 1 && now - this.samples[0][0] > this.windowMs) this.samples.shift();
    // judge once the frames cover most of the window: measured from when the oldest frame began, so frames
    // that are each longer than the window still count
    if (now - (this.samples[0][0] - this.samples[0][1]) < this.windowMs * 0.9) return 'ok';
    const sorted = this.samples.map(([, , d]) => d).sort((a, b) => a - b);
    if (sorted[Math.floor(sorted.length / 2)] <= this.slowMs) return 'ok';
    this.level += 1;
    this.samples = [];
    return this.level === 1 ? 'lower' : 'stills';
  }
}
