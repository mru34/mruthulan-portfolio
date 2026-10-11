// Watches frame times while the visitor scrolls. If frames stay slow for a while it asks for a lower
// resolution; if they are still slow after that, for the stills. After that it stays quiet.
export class FrameWatch {
  constructor({ slowMs = 40, windowMs = 2000 } = {}) {
    this.slowMs = slowMs;
    this.windowMs = windowMs;
    this.level = 0;
    this.samples = [];
  }

  // now and dt in milliseconds; returns 'ok', 'lower' or 'stills'
  push(now, dt) {
    if (this.level >= 2) return 'ok';
    this.samples.push([now, dt]);
    while (this.samples.length > 1 && now - this.samples[0][0] > this.windowMs) this.samples.shift();
    // judge once the frames cover most of the window: measured from when the oldest frame began, so frames
    // that are each longer than the window still count
    if (now - (this.samples[0][0] - this.samples[0][1]) < this.windowMs * 0.9) return 'ok';
    const avg = this.samples.reduce((s, [, d]) => s + d, 0) / this.samples.length;
    if (avg <= this.slowMs) return 'ok';
    this.level += 1;
    this.samples = [];
    return this.level === 1 ? 'lower' : 'stills';
  }
}
