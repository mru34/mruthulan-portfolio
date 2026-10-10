# 3D Homepage, Part 1 (to the review gate) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild mruthulan.com's homepage around one fixed three.js stage: the 3D split-flap name board, the "Five projects." fly-through and the SignalBridge chapter, with every other section in its new form as stills. Remove Loomy from the site. Then stop for Mruthulan's review.

**Architecture:** The HTML lays out every box. One fixed WebGL canvas behind the page fits 3D objects into those boxes ("DOM-anchored 3D"), so stills rendered from the same scene line up exactly with the live frames. The scroll drives everything through pure functions of each section's progress. A render-on-demand loop draws only when something changes. Without WebGL, with reduced motion, with Save-Data or without JavaScript, each 3D box shows its still and the page flows normally.

**Tech Stack:**
- Python 3.14 generator (`design/build_site.py`) with Pillow
- three.js 0.186.1, vendored as ES modules with an import map (no bundler)
- Plain JavaScript modules
- `node:test` for the pure logic, pytest for the generator
- puppeteer-core 23.11.1 with the local Chrome for browser checks and stills
- fontTools for the name fonts

**Spec:** `docs/superpowers/specs/2026-10-11-3d-homepage-design.md`

**Scope:** this plan covers the spec's build-order steps 1 and 2, plus the Loomy removal, and ends at the review gate. Part 2 is planned after the review: chapters 02–05 in 3D, the Awards prints, the 3D ending board, the header icons on every page, and the phone, speed and accessibility passes. Until then chapters 02–05 show their current pictures as stills, and Awards stays as it is today.

**Deviation from the spec (recorded in the spec in Task 2):** no GSAP. Pinning is CSS `position: sticky`; the scrubbing, the snap and the springs are about 120 lines of tested pure functions in `js/lib/`. The behaviour is the same, with one library fewer, and native scrolling stays untouched.

## Global Constraints

- **Arrive finished:** every page arrives finished. Nothing moves on load; motion comes only from the scroll position, the pointer or a press.
- **Nothing hidden at rest:** motion never hides content at rest. At each chapter's key pose (progress 0.8) all four information items are fully visible, and focus inside an information block makes all of it visible.
- **Real images only:** no stock or generated imagery. Every screen texture is a real capture or a crop of one.
- **Generated HTML:** never edit the generated HTML. Edit `design/build_site.py` and rebuild with `python design/build_site.py`.
- **Text and taps:** no visible text smaller than 16px; touch targets at least 44px.
- **Reduced motion:** `prefers-reduced-motion: reduce` gives the stills and no snap.
- **Scrolling:** native scrolling. The wheel and touch are never blocked.
- **Commits:** credited to Mruthulan only, with no `Co-Authored-By` lines. Run `git config core.hooksPath .githooks` once; the hook strips AI co-author lines.
- **Words:** only the words in the spec's "Every word on the homepage", following its writing rules.
- **Versions and paths:** three.js 0.186.1, puppeteer-core 23.11.1. Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` (override with the `CHROME` environment variable). Dev server: `python -m http.server 8000` in the repo root.
- **Colours:**

  | Use | Colour |
  |---|---|
  | SignalBridge | `#2BC4BC` |
  | Boss Breaker | `#F06A43` |
  | Better Call Bhai | `#E3B53A` |
  | MEANT | `#4DA3FF` |
  | KnowCad | `#9B87FF` |
  | Gold | `#E8B64C` |
  | Ground | `#0C0C0D` |
- **Craft rules:**
  - one studio light: a key from the top left, a dim fill, RoomEnvironment reflections
  - the project colour only as a rim light
  - no bloom, flares, neon or glow
  - real materials and proportions
  - contact shadows
  - springs, never constant-speed motion
  - words are HTML
- **Raw captures:** they live outside the repo in `../portfolio-tools/card-shots/raw` and are never published.
- **SignalBridge cockpit capture:** never use `d-worker-cockpit.png` or `d-cockpit.png`. They show a Telegram chat ID and a Discord webhook field.

## Review Focus

1. **Landing by link:** a visitor arriving at a chapter by link (`index.html#work-sb` from a case page's "← All work", or the header's Work) must land on its key pose with everything visible, not on the empty reveal beat. Pinned in Task 6 (smoke scenario "a link lands on the payoff pose").
2. **Snap direction:** a visitor scrolling in small wheel steps with pauses must never be pulled back against their direction. Pinned in Task 2 (`snapTarget` never returns a target behind) and Task 6 (smoke scenario "the snap never pulls back").
3. **Breakpoint:** crossing the 860px breakpoint (rotating a phone, resizing a window) must rebuild the board in its other layout and keep it in its box. Pinned in Task 7 (smoke scenario "the board survives the breakpoint").
4. **Keyboard:** a keyboard visitor tabbing into a chapter before its payoff beat must see the focused link. Pinned in Task 6 (smoke scenario "focus shows the whole information block").
5. **A scene that fails:** a 3D scene module that fails to load (network error) must leave its still showing, never a blank box. Pinned in Task 8 (smoke scenario "a scene that fails to load leaves its still").

---

## File structure

| File | Responsibility |
|---|---|
| `package.json` (new) | Node dev tooling: `npm test`, `npm run smoke`, `npm run stills`, `npm run perf`; devDependencies puppeteer-core and three |
| `design/requirements-dev.txt` (new) | Python dev tools: pytest, fonttools, brotli, pillow |
| `tests/test_site.py` (new) | pytest: what the generator writes (Loomy gone, copy deck, chapters, CSS classes used, import map resolves) |
| `tests/test_assets.py` (new) | pytest: name fonts and 3D textures |
| `tests/js/*.test.js` (new) | `node --test`: pure logic in `js/lib/` and `js/3d/` |
| `tests/browser/smoke.mjs` (new) | puppeteer: the page as visitors get it (live, stills, no JS, keyboard, links, failures) |
| `tests/browser/shot.mjs` (new) | puppeteer: one screenshot at a scene and progress, for looking while building |
| `tests/browser/perf.mjs`, `tests/browser/firstpaint.mjs`, `tests/browser/review.mjs` (new) | smoothness, first paint, the review package |
| `js/lib/motion.js` (new) | clamp, lerp, ramp, eases, section progress, Spring |
| `js/lib/fit.js` (new) | page box ↔ world units |
| `js/lib/capability.js` (new) | 3D or stills |
| `js/lib/watchdog.js` (new) | slow-frame fallback |
| `js/lib/scrollnav.js` (new) | snap target, current chapter |
| `js/vendor/three/` (new) | three.js 0.186.1 module build, two addons, licence |
| `js/home.js` (new) | homepage orchestrator: mode, scenes, beats, rail, snap, pose mode |
| `js/3d/stage.js` (new) | renderer, camera, studio light, render-on-demand loop |
| `js/3d/flap.js` (new) | split-flap glyphs, turn state, board layout (pure) |
| `js/3d/board.js` (new) | the 3D split-flap board |
| `js/3d/hero.js` (new) | hero scene: board in its box, pointer, press, scroll exit |
| `js/3d/flythrough.js` (new) | the dust field |
| `js/3d/textures.js` (new) | texture loading, rounded shapes, contact shadow, keyboard texture |
| `js/3d/devices.js` (new) | phone and laptop built in code |
| `js/3d/chapters/signalbridge-timeline.js` (new) | the chapter's choreography as a function of progress (pure) |
| `js/3d/chapters/signalbridge.js` (new) | the bridge scene |
| `design/build_3d_assets.py` (new) | screen textures and crops from real captures → `assets/3d/` |
| `design/build_name_fonts.py` (new) | per-project name fonts → `assets/fonts/name-*.woff2` |
| `design/stills.mjs` (new) | renders the stills → `assets/3d/stills/` |
| `design/build_site.py` (modify) | Loomy out, project order, new homepage, import map |
| `js/script.js` (modify) | remove Loomy deck, name board, docking, spin board; keep the shared features |
| `css/styles.css` (modify) | new homepage styles; old homepage rules removed |
| `sitemap.xml`, `README.md`, `.gitignore` (modify) | Loomy out; docs; `node_modules/` |

---

### Task 1: Dev tooling, and Loomy off the site

**Files:**
- Create: `package.json`, `design/requirements-dev.txt`, `tests/test_site.py`
- Modify: `.gitignore`, `design/build_site.py`, `js/script.js`, `css/styles.css`, `sitemap.xml`, `README.md`
- Delete: `loomy.html`, `assets/deck/`, `assets/Loomy-Pitch-Deck.pdf`

**Interfaces:**
- Produces: `tests/test_site.py` helpers `pages() -> dict[str, str]` (every page the generator builds, by file name) and `text_of(markup: str) -> str` (visible text, whitespace collapsed, scripts and styles skipped). `bs.PROJECTS` order is `['sb', 'bx', 'bb', 'mt', 'kc']`.

- [ ] **Step 1: Add the dev tooling**

Create `package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"tests/js/*.test.js\"",
    "smoke": "node tests/browser/smoke.mjs",
    "stills": "node design/stills.mjs",
    "perf": "node tests/browser/perf.mjs"
  },
  "devDependencies": {
    "puppeteer-core": "23.11.1",
    "three": "0.186.1"
  }
}
```

Create `design/requirements-dev.txt`:

```
pytest==9.1.1
pillow==12.3.0
fonttools==4.60.1
brotli==1.1.0
```

Append to `.gitignore`:

```
# Node dev tools (npm install)
node_modules/
```

Run:

```bash
npm install
python -m pip install -r design/requirements-dev.txt
git config core.hooksPath .githooks
```

Expected: `npm install` adds `node_modules/` (ignored) and `package-lock.json`; pip reports the four packages installed. If pip cannot find `fonttools==4.60.1`, run `python -m pip index versions fonttools` and pin the newest 4.x it lists instead.

- [ ] **Step 2: Write the failing tests**

Create `tests/test_site.py`:

```python
"""Checks on what design/build_site.py writes. Run: python -m pytest tests -q
Tests that read the built pages need a fresh build first: python design/build_site.py"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'design'))
import build_site as bs  # noqa: E402


def pages():
    out = {'index.html': bs.build_home(), 'privacy.html': bs.build_privacy(), '404.html': bs.build_404()}
    for p in bs.PROJECTS:
        out[f"{p['slug']}.html"] = bs.build_case(p)
    return out


class _Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self._skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self._skip += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def text_of(markup):
    p = _Text()
    p.feed(markup)
    return re.sub(r'\s+', ' ', ' '.join(p.parts))


def test_loomy_is_off_the_site():
    assert 'lm' not in bs.BY_ID
    for name, markup in pages().items():
        assert 'loomy' not in markup.lower(), name
    assert 'loomy' not in (ROOT / 'sitemap.xml').read_text(encoding='utf-8').lower()
    assert not (ROOT / 'loomy.html').exists()
    assert not (ROOT / 'assets' / 'deck').exists()
    assert not (ROOT / 'assets' / 'Loomy-Pitch-Deck.pdf').exists()


def test_case_pages_cycle_through_five_in_homepage_order():
    assert [p['id'] for p in bs.PROJECTS] == ['sb', 'bx', 'bb', 'mt', 'kc']
    kc = bs.build_case(bs.BY_ID['kc'])
    assert 'href="meant.html" rel="prev"' in kc
    assert 'href="signalbridge.html" rel="next"' in kc
```

- [ ] **Step 3: Run them and see them fail**

Run: `python -m pytest tests -q`
Expected: 2 failed: `'lm' in BY_ID`, and the order is `['sb', 'mt', 'bb', 'kc', 'bx', 'lm']`.

- [ ] **Step 4: Take Loomy out of the generator, and reorder the projects**

In `design/build_site.py`:
1. Delete the whole Loomy entry in `PROJECTS` (the `dict(` that starts `id='lm', slug='loomy'` and its closing `),`).
2. Delete `LOOMY_SLIDES = [ ... ]`, the function `def deck():` and the function `def tally(count, label):`; nothing else uses them.
3. Reorder `PROJECTS` so the dicts appear in the homepage order: SignalBridge (`sb`), Boss Breaker (`bx`), Better Call Bhai (`bb`), MEANT (`mt`), KnowCad (`kc`). Move the whole dicts; change nothing inside them.
4. Delete the comment lines above `HOME_PROJECTS` that begin `# Loomy is a concept with a pitch deck`.
5. In the module docstring, change `the six case pages` to `the five case pages`.

- [ ] **Step 5: Delete Loomy's files and its traces in the site's code**

```bash
git rm -q loomy.html assets/Loomy-Pitch-Deck.pdf
git rm -q -r assets/deck
```

In `sitemap.xml`, delete the line `  <url><loc>https://mruthulan.com/loomy.html</loc></url>`.

In `js/script.js`:
- Delete the block from the line `  /* ---------------------------------------------------------- Loomy deck */` through its closing `  });` (the line after `show(0, false);`).
- In the tilt line, change `$$('a.zoom, .pcard, .gal-main, .about > .ph, .deck-stage')` to `$$('a.zoom, .pcard, .gal-main, .about > .ph')`.

In `css/styles.css`, delete the comment line `/* deck viewer */` and every rule whose selector starts with `.deck`. Then check:

Run: `grep -n "deck" js/script.js css/styles.css`
Expected: no output.

- [ ] **Step 6: Take Loomy out of the README**

Run this from the repo root (it fails loudly if any sentence has changed):

```bash
python - <<'EOF'
from pathlib import Path
p = Path('README.md'); s = p.read_text(encoding='utf-8')
pairs = [
    (', Boss Breaker orange, Loomy green.', ', Boss Breaker orange.'),
    (' Loomy, a concept with a pitch deck and no build, is left off the homepage; its case page is reached from the other case pages.', ''),
    ('a loop, research and the pitch deck)', 'a loop)'),
    ('case-page screenshots, the portrait and the Loomy deck tilt', 'case-page screenshots and the portrait tilt'),
    ("- Loomy's deck is reproduced in full, and its targets and revenue figure are labelled as projections.\n", ''),
    ('`press_article_click`, `deck_open`, ', '`press_article_click`, '),
    ('the home page, Loomy, privacy and 404 use', 'the home page, privacy and 404 use'),
    ('the six case pages', 'the five case pages'),
]
for old, new in pairs:
    assert s.count(old) == 1, old
    s = s.replace(old, new)
start = s.index('## Loomy deck')
end = s.find('\n## ', start + 1)
s = s[:start] + (s[end + 1:] if end != -1 else '')
p.write_text(s.rstrip('\n') + '\n', encoding='utf-8', newline='\n')
EOF
grep -n -i "loomy\|deck" README.md
```

Expected: the script prints nothing, and the grep prints nothing.

- [ ] **Step 7: Rebuild and run the tests and the checks**

```bash
python design/build_site.py
python -m pytest tests -q
python design/check_site.py .
```

Expected: the build writes `index.html`, five case pages, `privacy.html` and `404.html`; pytest shows `2 passed`; check_site shows `✓ ... every local link and image resolves`.

- [ ] **Step 8: Commit**

```bash
git add -A package.json package-lock.json .gitignore design/requirements-dev.txt tests/test_site.py design/build_site.py js/script.js css/styles.css sitemap.xml README.md ./*.html
git commit -m "Loomy is off the site; case pages cycle through five in homepage order"
```

---

### Task 2: The pure motion and scroll helpers

**Files:**
- Create: `js/lib/motion.js`, `js/lib/fit.js`, `js/lib/capability.js`, `js/lib/watchdog.js`, `js/lib/scrollnav.js`
- Test: `tests/js/motion.test.js`, `tests/js/fit.test.js`, `tests/js/capability.test.js`, `tests/js/watchdog.test.js`, `tests/js/scrollnav.test.js`
- Modify: `docs/superpowers/specs/2026-10-11-3d-homepage-design.md` (record the GSAP deviation)

**Interfaces:**
- Produces:
  - `motion.js`:
    - `clamp(v, lo=0, hi=1)`, `lerp(a, b, t)`, `ramp(p, a, b)`, `easeIn(t)`, `easeOut(t)`, `easeInOut(t)`
    - `sectionProgress(top, height, viewport) -> 0..1`
    - `class Spring(value=0, {stiffness=170, damping=26})` with `.value`, `.target` and `.step(dtMs) -> boolean` (true while still moving)
  - `fit.js`:
    - `worldPerPixel(fovDeg, dist, viewportH) -> number`
    - `rectToWorld(rect, vw, vh, k) -> {x, y, w, h}`
    - `fitScale(nat {w,h}, box {w,h}) -> number`
  - `capability.js`:
    - `want3D({webgl2, reducedMotion, saveData, deviceMemory, forced}) -> boolean`
    - `readEnv(win=window) -> that object`
  - `watchdog.js`: `class FrameWatch({slowMs=40, windowMs=2000})` with `.push(nowMs, dtMs) -> 'ok' | 'lower' | 'stills'`
  - `scrollnav.js`:
    - `snapTarget(y, targets, viewportH, dir, reach=0.6) -> number | null`
    - `currentChapter(rects, viewportH) -> index | -1`

- [ ] **Step 1: Write the failing tests**

`tests/js/motion.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, ramp, easeIn, easeOut, easeInOut, sectionProgress, Spring } from '../../js/lib/motion.js';

test('clamp, lerp and ramp', () => {
  assert.equal(clamp(-1), 0); assert.equal(clamp(2), 1); assert.equal(clamp(5, 0, 10), 5);
  assert.equal(lerp(10, 20, 0.25), 12.5);
  assert.equal(ramp(0.1, 0.25, 0.35), 0);
  assert.ok(Math.abs(ramp(0.3, 0.25, 0.35) - 0.5) < 1e-9);
  assert.equal(ramp(0.9, 0.25, 0.35), 1);
});

test('eases start at 0, end at 1', () => {
  for (const f of [easeIn, easeOut, easeInOut]) { assert.equal(f(0), 0); assert.equal(f(1), 1); }
  assert.equal(easeInOut(0.5), 0.5);
  assert.ok(easeIn(0.5) < 0.5 && easeOut(0.5) > 0.5);
});

test('sectionProgress runs 0 to 1 while the section is pinned', () => {
  assert.equal(sectionProgress(200, 2500, 1000), 0);
  assert.equal(sectionProgress(0, 2500, 1000), 0);
  assert.equal(sectionProgress(-750, 2500, 1000), 0.5);
  assert.equal(sectionProgress(-1500, 2500, 1000), 1);
  assert.equal(sectionProgress(-4000, 2500, 1000), 1);
  assert.equal(sectionProgress(-10, 1000, 1000), 1);
  assert.equal(sectionProgress(10, 1000, 1000), 0);
});

test('a spring settles on its target without overshooting much', () => {
  const s = new Spring(0); s.target = 1;
  let max = 0, moving = true, steps = 0;
  while (moving && steps < 500) { moving = s.step(16); max = Math.max(max, s.value); steps++; }
  assert.equal(moving, false);
  assert.equal(s.value, 1);
  assert.ok(max < 1.05, `overshoot ${max}`);
  assert.ok(steps < 150, `took ${steps} frames`);
});
```

`tests/js/fit.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { worldPerPixel, rectToWorld, fitScale } from '../../js/lib/fit.js';

test('worldPerPixel: a 90° camera one unit away sees two units across two pixels', () => {
  assert.ok(Math.abs(worldPerPixel(90, 1, 2) - 1) < 1e-9);
});

test('rectToWorld puts a centred box at the origin and a top-left box up and to the left', () => {
  const k = 0.01;
  const c = rectToWorld({ left: 400, top: 300, width: 200, height: 100 }, 1000, 700, k);
  assert.ok(Math.abs(c.x) < 1e-9 && Math.abs(c.y) < 1e-9 && Math.abs(c.w - 2) < 1e-9 && Math.abs(c.h - 1) < 1e-9);
  const tl = rectToWorld({ left: 0, top: 0, width: 100, height: 100 }, 1000, 700, k);
  assert.ok(tl.x < 0 && tl.y > 0);
});

test('fitScale is the largest scale that fits both ways', () => {
  assert.equal(fitScale({ w: 10, h: 2 }, { w: 5, h: 5 }), 0.5);
  assert.equal(fitScale({ w: 2, h: 10 }, { w: 5, h: 5 }), 0.5);
});
```

`tests/js/capability.test.js`:

```js
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
```

`tests/js/watchdog.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameWatch } from '../../js/lib/watchdog.js';

const run = (w, start, ms, dt) => { const out = []; for (let t = start; t <= start + ms; t += dt) out.push(w.push(t, dt)); return out; };

test('smooth frames never trigger anything', () => {
  const w = new FrameWatch();
  assert.ok(run(w, 0, 6000, 16).every((v) => v === 'ok'));
});

test('slow frames ask for a lower resolution, then for the stills, then nothing more', () => {
  const w = new FrameWatch();
  const first = run(w, 0, 2100, 50);
  assert.deepEqual(first.filter((v) => v !== 'ok'), ['lower']);
  const second = run(w, 2200, 2100, 50);
  assert.deepEqual(second.filter((v) => v !== 'ok'), ['stills']);
  assert.ok(run(w, 4400, 3000, 80).every((v) => v === 'ok'));
});
```

`tests/js/scrollnav.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { snapTarget, currentChapter } from '../../js/lib/scrollnav.js';

test('glides forward to a key pose that is close ahead', () => {
  assert.equal(snapTarget(1000, [1500, 4000], 1000, 1), 1500);
  assert.equal(snapTarget(1000, [1500], 1000, 1, 0.4), null);
});

test('never pulls back against the direction of the scroll', () => {
  assert.equal(snapTarget(1600, [1500, 4000], 1000, 1), null);
  assert.equal(snapTarget(1600, [1500], 1000, -1), 1500);
  assert.equal(snapTarget(1400, [1500], 1000, -1), null);
});

test('does nothing when already on the pose', () => {
  assert.equal(snapTarget(1501, [1500], 1000, 1), null);
  assert.equal(snapTarget(1500, [1500], 1000, -1), null);
});

test('the current chapter is the one across the middle of the screen', () => {
  const rects = [{ top: -900, bottom: 100 }, { top: 100, bottom: 2600 }, { top: 2600, bottom: 5100 }];
  assert.equal(currentChapter(rects, 1000), 1);
  assert.equal(currentChapter([{ top: 600, bottom: 3100 }], 1000), -1);
  assert.equal(currentChapter([{ top: -3000, bottom: 400 }], 1000), -1);
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../js/lib/motion.js'` and the same for the other four.

- [ ] **Step 3: Write the helpers**

`js/lib/motion.js`:

```js
// Small pure helpers for scroll-linked motion. No DOM, so they run under `node --test`.

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// 0 until p reaches a, 1 from b on, straight in between
export const ramp = (p, a, b) => clamp((p - a) / (b - a));
export const easeIn = (t) => t * t;
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

// How far a tall section has been scrolled through while its sticky content is pinned:
// 0 when its top reaches the top of the screen, 1 when its bottom reaches the bottom.
export function sectionProgress(top, height, viewport) {
  const run = height - viewport;
  if (run <= 0) return top <= 0 ? 1 : 0;
  return clamp(-top / run);
}

// A spring with critical damping: things ease in and settle, the way something with mass does.
export class Spring {
  constructor(value = 0, { stiffness = 170, damping = 26 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  // dt in milliseconds; returns true while still moving
  step(dt) {
    const s = Math.min(dt, 64) / 1000;
    const a = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += a * s;
    this.value += this.velocity * s;
    if (Math.abs(this.value - this.target) < 1e-4 && Math.abs(this.velocity) < 1e-4) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    return true;
  }
}
```

`js/lib/fit.js`:

```js
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
```

`js/lib/capability.js`:

```js
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
```

`js/lib/watchdog.js`:

```js
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
    while (this.samples.length && now - this.samples[0][0] > this.windowMs) this.samples.shift();
    if (now - this.samples[0][0] < this.windowMs * 0.9) return 'ok';
    const avg = this.samples.reduce((s, [, d]) => s + d, 0) / this.samples.length;
    if (avg <= this.slowMs) return 'ok';
    this.level += 1;
    this.samples = [];
    return this.level === 1 ? 'lower' : 'stills';
  }
}
```

`js/lib/scrollnav.js`:

```js
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
```

- [ ] **Step 4: Run the tests and see them pass**

Run: `npm test`
Expected: all tests pass (`# pass 15`, `# fail 0`).

- [ ] **Step 5: Record the deviation in the spec**

In `docs/superpowers/specs/2026-10-11-3d-homepage-design.md`, replace the bullet that begins `- GSAP with ScrollTrigger` with:

```
- No GSAP (changed while planning): pinning is CSS `position: sticky`, and the scrubbing, the snap and the springs are small tested functions in `js/lib/`. Same behaviour, one library fewer, native scrolling untouched.
```

Also in that file, replace `` `js/scroll.js` | ScrollTrigger pins, scrubbing, the snap and the rail `` with `` `js/home.js` and `js/lib/` | Pins (CSS sticky), scrubbing, the snap and the rail ``, and replace `the 3D libraries plus the site's own 3D code at most about 260 KB compressed` with `three.js plus the site's own 3D code at most about 260 KB compressed`.

- [ ] **Step 6: Commit**

```bash
git add js/lib tests/js docs/superpowers/specs/2026-10-11-3d-homepage-design.md
git commit -m "Pure helpers for scroll-linked motion, fitting 3D into page boxes, the snap and the fallback"
```

---

### Task 3: The new homepage, written by the generator

**Files:**
- Modify: `design/build_site.py`, `js/script.js`, `tests/test_site.py`
- Create: `assets/ICONS-LICENSE.txt`

**Interfaces:**
- Consumes: `pages()`, `text_of()` from Task 1.
- Produces:
  - **Data:**
    - `bs.CHAPTERS`: a list of dicts `{pid, num, side, result, font, still}` in homepage order
    - `bs.HERO_LINKS` and `bs.END_LINKS`: lists of `(icon, label, href, event)`
    - `bs.ABOUT_FACTS`: a list of `(term, text, cls)`
  - **Functions:**
    - `bs.still_picture(scene, alt='', eager=False) -> str | None`: the rendered still `<picture>`, or None if the files don't exist yet
    - `bs.icon(name) -> str`
    - `bs.icon_link(name, label, href, event) -> str`
  - **Page contract:**
    - each chapter is `<section class="chapter" data-scene="{slug}" data-side=…>`
    - inside it: `<span class="ch-key" id="work-{id}">`, `.pin`, `.ch-stage[data-anchor]` holding the still and the `.ch-hit` link, and `.info` (with `.ch-num`, `.ch-name#ch-{id}`, `.ch-line.beat-line`, `.ch-res.beat-pay`, `a.btn.beat-pay`)
    - chapter 1 also carries `<span class="ch-key" id="work">`
    - the hero is `<section class="hero" data-scene="hero">` with `.hero-board[data-anchor]`
    - the fly-through is `<section class="fly" data-scene="fly">`
    - the rail is `<ol class="rail">` with one `<li style="--c:…">` per chapter
    - the canvas is `<canvas class="stage">`

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_site.py`:

```python
COPY = [
    'Five projects.',
    'SignalBridge', 'After-hours chat for young people. Nothing reaches a youth worker until they say yes.',
    'Champion · Dell InnovateDash 2026',
    'Boss Breaker', 'Wellness challenges, played as a boss fight.', 'Solo build · code on GitHub',
    'Better Call Bhai', 'Online booking for a barbershop in Singapore.', 'Solo build · in a pilot with the shop',
    'MEANT', 'Helps people who can’t rely on their speech reply in time. They choose every word.',
    '2nd runner-up · Dell InnovateFest 2026',
    'KnowCad', 'An AI assistant for customer service that finds answers in long documents.',
    'Champion · Autodesk Singapore Hackathon 2026',
    'Case study',
    'Study', 'Diploma in Information Technology, Singapore Polytechnic, 2025 – 2028 (expected)',
    'Leadership', 'Secretary, Youth Harmony Chapter subcommittee · Class Chairman and SP ACER',
    'Stack', 'TypeScript · React / Next.js · Node.js / Express · Python / FastAPI · SQL',
    'Reach out', 'Gmail', 'LinkedIn', 'GitHub', 'Résumé', 'mruthulansenthilnathan@gmail.com', 'Copy',
]
GONE = ['Spin a project', 'Let’s talk', 'I build full-stack', 'Selected work', 'retrieval-based', 'AAC users',
        'Year 2 IT', 'See all projects', 'last mile', 'Now showing']
BANNED = ['innovative', 'seamless', 'cutting-edge', 'passionate', 'empower', 'leverage', 'elevate', 'journey',
          'crafted', 'unlock', 'robust', 'delve']


def test_home_says_every_word_in_the_copy_deck():
    t = text_of(bs.build_home())
    assert [s for s in COPY if s not in t] == []


def test_home_drops_what_the_redesign_removed():
    markup = bs.build_home()
    t = text_of(markup)
    assert [s for s in GONE if s in t] == []
    assert [w for w in BANNED if w in t.lower()] == []
    for marker in ('data-board', 'results-list', 'pcard', 'data-spin', 'projects-data', 'data-name'):
        assert marker not in markup, marker


def test_chapters_in_order_each_with_its_four_pieces_and_anchors():
    markup = bs.build_home()
    sections = re.findall(r'<section class="chapter".*?</section>', markup, re.S)
    assert [c['pid'] for c in bs.CHAPTERS] == ['sb', 'bx', 'bb', 'mt', 'kc']
    assert len(sections) == 5
    for c, sec in zip(bs.CHAPTERS, sections):
        p = bs.BY_ID[c['pid']]
        t = text_of(sec)
        for piece in (c['num'], p['name'], p['line'], c['result'], 'Case study'):
            assert piece in t, (p['id'], piece)
        assert f'href="{p["slug"]}.html"' in sec
        assert f'data-event="case_open" data-project="{p["id"]}"' in sec
        assert f'id="work-{p["id"]}"' in sec
        assert f'data-scene="{p["slug"]}"' in sec
        assert 'data-anchor' in sec
    assert 'id="work"' in sections[0]


def test_hero_and_ending_carry_the_links_with_their_events():
    markup = bs.build_home()
    hero = markup[markup.index('<section class="hero'):markup.index('<section class="fly')]
    end = markup[markup.index('id="contact"'):markup.index('</main>')]
    for href, event in ((bs.LINKEDIN, 'contact_open_linkedin'), (bs.GITHUB, 'contact_open_github'),
                        (bs.RESUME, 'resume_click')):
        assert f'href="{href}"' in hero and f'data-event="{event}"' in hero
    for href, event in ((bs.MAILTO, 'contact_open_mail_app'), (bs.LINKEDIN, 'contact_open_linkedin'),
                        (bs.GITHUB, 'contact_open_github')):
        assert f'href="{bs.e(href)}"' in end and f'data-event="{event}"' in end
    assert f'data-copy="{bs.EMAIL}"' in end
    assert '<h1 class="sr-only" id="name">Mruthulan Senthil Nathan</h1>' in hero
```

- [ ] **Step 2: Run them and see them fail**

Run: `python -m pytest tests -q`
Expected: the four new tests fail (`AttributeError: module 'build_site' has no attribute 'CHAPTERS'`, and copy missing).

- [ ] **Step 3: Write the new lines into the project facts**

In `design/build_site.py`, inside `PROJECTS`, change only these `line=` values (the spec's approved wording; `’` is the typographic apostrophe):

| Project | New `line=` |
|---|---|
| SignalBridge | `'After-hours chat for young people. Nothing reaches a youth worker until they say yes.'` |
| Better Call Bhai | `'Online booking for a barbershop in Singapore.'` |
| MEANT | `'Helps people who can’t rely on their speech reply in time. They choose every word.'` |
| KnowCad | `'An AI assistant for customer service that finds answers in long documents.'` |

Boss Breaker's line stays as it is.

- [ ] **Step 4: Replace the old homepage pieces with the new ones**

In `design/build_site.py`, delete everything from the line `HOME_PROJECTS = [p for p in PROJECTS if p['id'] != 'lm']` down to the end of `def build_home():` (that includes `CARDS`, `FEATURED_CARDS`, `MORE_CARDS`, `project_card`, `flaps`, `board_result`, `board_data`, `HERO_RESULTS`, `hero_results` and the old `build_home`). Keep `tiles()`, `LOGOS`, `sechead()`, `AWARDS` and `award()`, which sit above it. In their place, write:

```python
# ------------------------------------------------------------------ home

# Icons, inlined and drawn in the text colour (never in brand colours). GitHub and Gmail: Simple Icons
# 16.34.0 (CC0). LinkedIn and the résumé page: Bootstrap Icons 1.11.3 (MIT, assets/ICONS-LICENSE.txt).
ICONS = {
    'github': ('0 0 24 24', 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'),
    'gmail': ('0 0 24 24', 'M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z'),
    'linkedin': ('0 0 16 16', 'M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z'),
    'resume': ('0 0 16 16', 'M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z'),
}


def icon(name):
    box, d = ICONS[name]
    return f'<svg viewBox="{box}" aria-hidden="true" focusable="false"><path d="{d}"/></svg>'


def icon_link(name, label, href, event):
    target = ' target="_blank" rel="noopener"' if href == RESUME else ext(href)
    return f'<a class="icon-btn" href="{e(href)}"{target} data-event="{event}">{icon(name)}<span>{e(label)}</span></a>'


HERO_LINKS = [('linkedin', 'LinkedIn', LINKEDIN, 'contact_open_linkedin'),
              ('github', 'GitHub', GITHUB, 'contact_open_github'),
              ('resume', 'Résumé', RESUME, 'resume_click')]
END_LINKS = [('gmail', 'Gmail', MAILTO, 'contact_open_mail_app'),
             ('linkedin', 'LinkedIn', LINKEDIN, 'contact_open_linkedin'),
             ('github', 'GitHub', GITHUB, 'contact_open_github')]

# The homepage chapters, in order. Every word here is in the spec's "Every word on the homepage".
# side: where the information sits beside the 3D (left, right, bottom-left). font: the project name's own
# typeface (assets/fonts/name-*.woff2). still: the picture shown until a chapter has its own rendered still.
CHAPTERS = [
    dict(pid='sb', num='01', side='left', result='Champion · Dell InnovateDash 2026',
         font='Name SignalBridge', still='signalbridge-card'),
    dict(pid='bx', num='02', side='right', result='Solo build · code on GitHub',
         font='Name Boss Breaker', still='boss-breaker-card'),
    dict(pid='bb', num='03', side='bottom-left', result='Solo build · in a pilot with the shop',
         font='Name Better Call Bhai', still='better-call-bhai-card'),
    dict(pid='mt', num='04', side='right', result='2nd runner-up · Dell InnovateFest 2026',
         font='Name MEANT', still='meant-card'),
    dict(pid='kc', num='05', side='left', result='Champion · Autodesk Singapore Hackathon 2026',
         font='Name KnowCad', still='win-knowcad-champion'),
]

ABOUT_FACTS = [
    ('Study', 'Diploma in Information Technology, Singapore Polytechnic, 2025 – 2028 (expected)', ''),
    ('Leadership', 'Secretary, Youth Harmony Chapter subcommittee · Class Chairman and SP ACER', ''),
    ('Stack', 'TypeScript · React / Next.js · Node.js / Express · Python / FastAPI · SQL', 'mono'),
]


def still_picture(scene, alt='', eager=False):
    """The rendered still of a 3D scene (design/stills.mjs), desk and phone versions, or None until it is made."""
    from PIL import Image
    folder = ROOT / 'assets' / '3d' / 'stills'
    desk, phone = folder / f'{scene}-desk.webp', folder / f'{scene}-phone.webp'
    if not (desk.exists() and phone.exists()):
        return None
    with Image.open(desk) as a, Image.open(phone) as b:
        (dw, dh), (pw, ph) = a.size, b.size
    load = ' fetchpriority="high"' if eager else ' loading="lazy"'
    return (f'<picture class="still"><source media="(max-width: 860px)" srcset="assets/3d/stills/{phone.name}" '
            f'width="{pw}" height="{ph}"><img src="assets/3d/stills/{desk.name}" width="{dw}" height="{dh}" '
            f'alt="{e(alt)}" decoding="async"{load}></picture>')


def hero_board():
    """The name, as the board's rendered still; flap tiles in the page until that still exists."""
    return still_picture('hero', eager=True) or (
        '<div class="tiles flap-rows" aria-hidden="true">'
        f'<div class="row gold">{tiles("MRUTHULAN")}</div><div class="row">{tiles("SENTHIL NATHAN")}</div></div>')


def chapter(c, first=False):
    p = BY_ID[c['pid']]
    href = f"{p['slug']}.html"
    ev = f'data-event="case_open" data-project="{p["id"]}"'
    still = still_picture(p['slug'], MEDIA[c['still']]['alt']) or pic(
        c['still'], '(max-width: 860px) 100vw, 58vw', cls='still')
    work = '<span class="ch-key" id="work"></span>' if first else ''
    return f'''<section class="chapter" data-scene="{p['slug']}" data-side="{c['side']}" style="--c:{p['c']};--name-font:'{c['font']}'" aria-labelledby="ch-{p['id']}">
        {work}<span class="ch-key" id="work-{p['id']}"></span>
        <div class="pin">
          <div class="ch-stage" data-anchor>{still}<a class="ch-hit" href="{href}" tabindex="-1" aria-hidden="true" {ev}></a></div>
          <div class="info">
            <p class="ch-num">{c['num']}</p>
            <h3 class="ch-name" id="ch-{p['id']}" style="view-transition-name:t-{p['id']}">{e(p['name'])}</h3>
            <p class="ch-line beat-line">{e(p['line'])}</p>
            <p class="ch-res beat-pay">{e(c['result'])}</p>
            <a class="btn beat-pay" href="{href}" {ev}>Case study <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>'''


def build_home():
    ld = {'@context': 'https://schema.org', '@type': 'Person', 'name': 'Mruthulan Senthil Nathan',
          'alternateName': ['Mruthulan', 'Senthil Nathan Mruthulan'], 'url': f'{SITE}/',
          'jobTitle': 'Software developer and IT student',
          'affiliation': {'@type': 'CollegeOrUniversity', 'name': 'Singapore Polytechnic'},
          'address': {'@type': 'PostalAddress', 'addressCountry': 'SG'},
          'sameAs': [LINKEDIN, GITHUB]}
    chapters = '\n      '.join(chapter(c, first=(i == 0)) for i, c in enumerate(CHAPTERS))
    rail = '<ol class="rail" aria-hidden="true">' + ''.join(
        f'<li style="--c:{BY_ID[c["pid"]]["c"]}"></li>' for c in CHAPTERS) + '</ol>'
    hero_links = ''.join(f'<li>{icon_link(*link)}</li>' for link in HERO_LINKS)
    end_links = ''.join(f'<li>{icon_link(*link)}</li>' for link in END_LINKS)

    def fact(term, text, cls):
        cls = f' class="{cls}"' if cls else ''
        return f'<div><dt>{e(term)}</dt><dd{cls}>{e(text)}</dd></div>'
    facts = ''.join(fact(*f) for f in ABOUT_FACTS)
    return f"""{head('Mruthulan Senthil Nathan — Developer & Builder',
                 'Mruthulan Senthil Nathan, Year 2 IT at Singapore Polytechnic, builds full-stack products. Five projects, what I built on each, and three hackathon results.',
                 '', og_title='Mruthulan Senthil Nathan — Developer & Builder',
                 og_desc='Five projects, what I built on each, and three hackathon results.', ld=ld)}
{body_open('home')}
  <canvas class="stage" aria-hidden="true"></canvas>
  {header('')}

  <main id="main">
    <section class="hero wrap" data-scene="hero" aria-labelledby="name">
      <h1 class="sr-only" id="name">Mruthulan Senthil Nathan</h1>
      <div class="hero-board" data-anchor>{hero_board()}</div>
      <ul class="hero-links" aria-label="Links">{hero_links}</ul>
      <div data-hero-end aria-hidden="true"></div>
    </section>

    <section class="fly" data-scene="fly" aria-labelledby="work-title">
      <div class="pin"><h2 class="big" id="work-title">Five projects.</h2></div>
    </section>

    <div class="chapters" data-sec="work">
      {chapters}
    </div>
    {rail}

    <section class="sec wrap" id="awards" data-sec="awards" aria-labelledby="awards-title">
      <span id="results"></span><span id="wins"></span><span id="recognition"></span>
      {sechead('awards-title', 'Awards')}
      <div class="score" data-track aria-label="Awards">
        {''.join(award(*a) for a in AWARDS)}
      </div>
      <div class="track-nav" data-track-nav><button class="gal-arrow" type="button" data-slide="-1" aria-label="Previous award">←</button>
        <span class="track-dots" aria-hidden="true">{'<i></i>' * len(AWARDS)}</span><span class="gal-count" data-slide-now aria-live="polite">1 / {len(AWARDS)}</span>
        <button class="gal-arrow" type="button" data-slide="1" aria-label="Next award">→</button></div>
    </section>

    <section class="sec wrap" id="about" data-sec="about" aria-labelledby="about-title">
      <h2 class="big" id="about-title">About</h2>
      <div class="me">
        {pic('about-portrait', '(max-width: 860px) 100vw, 380px', cls='ph portrait')}
        <dl class="facts3" id="credentials">{facts}</dl>
      </div>
    </section>

    <section class="end wrap" id="contact" data-sec="contact" aria-labelledby="contact-title">
      <div class="tiles flap-rows end-board" aria-hidden="true"><div class="row gold">{tiles('OPEN TO A SWE INTERNSHIP')}</div><div class="row">{tiles('2027/28')}</div></div>
      <p class="sr-only">Open to a SWE internship, 2027/28</p>
      <h2 class="big" id="contact-title">Reach out</h2>
      <ul class="end-links">{end_links}</ul>
      <p class="end-mail"><span data-mail>{EMAIL}</span><button class="btn" type="button" data-copy="{EMAIL}">Copy</button></p>
      <p class="sr-only" role="status" aria-live="polite" data-copy-status></p>
    </section>
  </main>

  {footer()}
  {VIEWER}
</body>
</html>
"""
```

The Copy button carries no `data-event`, because `script.js` already tracks `contact_copy_email` in its copy handler.

Then fix the remaining references to the removed names in `build_case`. Change

```python
    back = f"index.html#work-{p['id']}" if p in HOME_PROJECTS else 'index.html#work'
```

to

```python
    back = f"index.html#work-{p['id']}"
```

Finally, search for leftovers: `grep -n "HOME_PROJECTS\|CARDS\|board_data\|hero_results" design/build_site.py`. Expected: no output.

- [ ] **Step 5: Add the icons' licence**

```bash
curl -sL https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/LICENSE -o assets/ICONS-LICENSE.txt
head -3 assets/ICONS-LICENSE.txt
```

Expected: `The MIT License (MIT)` then the Bootstrap authors' copyright line.

- [ ] **Step 6: Remove the homepage code that served the old markup**

In `js/script.js`:
1. Delete from the line `  /* ---------------------------------------------------------- home: the name board */` through the line before `  /* ---------------------------------------------------------- home: header */`. That removes the name board and the name docking.
2. Delete from the line `  /* ---------------------------------------------------------- home: departures board */` through the line before the file's final `})();`. That removes the spin board and `spin_result`.
3. In the tilt line, change `$$('a.zoom, .pcard, .gal-main, .about > .ph')` to `$$('a.zoom, .gal-main, .me > .ph')`.
4. In the copy handler, change `btn.textContent = 'Copied ✓';` to `btn.textContent = 'Copied';` and `if (status) status.textContent = 'Copied. Paste it into any email app.';` to `if (status) status.textContent = 'Email address copied';`.
5. Directly above `  const heroEnd = $('[data-hero-end]');`, replace the comment line `  /* ---------------------------------------------------------- home: header */` with:

```js
  /* ---------------------------------------------------------- home: header */
  // The gold logo stays hidden while the name board fills the screen (CSS), and the header gets its
  // line once the page has moved past the hero.
```

Run: `grep -n "spin\|data-board\|data-name\|projects-data\|dock" js/script.js`
Expected: no output.

- [ ] **Step 7: Rebuild and run the tests**

```bash
python design/build_site.py
python -m pytest tests -q
python design/check_site.py .
```

Expected: `6 passed`; check_site passes. The case pages' `index.html#work-…` links now resolve to the `.ch-key` spans.

- [ ] **Step 8: Commit**

```bash
git add design/build_site.py js/script.js tests/test_site.py assets/ICONS-LICENSE.txt ./*.html
git commit -m "Homepage rewritten: name, five chapters, three facts, the board and Reach out; old board and docking removed"
```

---

### Task 4: The homepage's styles without the 3D

**Files:**
- Modify: `css/styles.css`, `tests/test_site.py`
- Create: `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes: the page contract from Task 3.
- Produces: the base layout that every visitor gets, and that the 3D builds on:
  - `.stage` is hidden
  - chapters flow, with `.ch-stage` 16:10 and the still contained in it
  - `.hero-board` uses `aspect-ratio: 14.94/3.42`, or `10.12/5.07` at ≤860px
  - `--name-font` is set per chapter
- Produces: `tests/browser/smoke.mjs` with `open()`, `check()`, `scenario()` and `infoVisible(page, pid)`, which later tasks extend.

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_site.py`:

```python
def _used_class_tokens():
    tokens = set()
    for f in ROOT.glob('*.html'):
        for cls in re.findall(r'class="([^"]+)"', f.read_text(encoding='utf-8')):
            tokens.update(cls.split())
    for f in (ROOT / 'js').rglob('*.js'):
        if 'vendor' not in f.parts:
            tokens.update(re.findall(r'[A-Za-z][\w-]*', f.read_text(encoding='utf-8')))
    return tokens


def _css_classes(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'url\([^)]*\)', '', css)
    css = re.sub(r'"[^"]*"|\'[^\']*\'', '', css)
    return set(re.findall(r'\.([A-Za-z][\w-]*)', css))


def test_every_css_class_is_used_somewhere():
    """Needs a fresh build. A class only some script adds counts as used if the word appears in js/."""
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert sorted(_css_classes(css) - _used_class_tokens()) == []


def test_hero_board_box_matches_the_board_layout():
    """The 3D board is fitted into this box, and its still is drawn in it: the shapes must agree
    (js/3d/flap.js layoutRows gives 14.94 x 3.42 for two rows and 10.12 x 5.07 for three)."""
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert 'aspect-ratio:14.94/3.42' in css
    assert 'aspect-ratio:10.12/5.07' in css
```

Run: `python -m pytest tests -q`
Expected: `test_every_css_class_is_used_somewhere` fails with a list of dead classes (`results-list`, `pcard`, `fids`, `flaps`, `board-foot`, `talk`, `mail-big`, `tally`, `creds`, and others), and `test_hero_board_box_matches_the_board_layout` fails.

- [ ] **Step 2: Remove the old homepage rules**

In `css/styles.css`:
1. Delete the old `.hero{...}` rule, which starts `.hero{min-height:calc(100svh - var(--bar));display:flex;`.
2. Delete `.tiles .sr-only + .w{...}` and `.hero .tiles .sr-only + .w .t{...}`.
3. In `.tiles .t::after,.flaps span::after{...}`, change the selector to `.tiles .t::after`.
4. Then delete every rule (and every selector in a selector list) that uses a class the test names. Where a selector list mixes used and unused selectors, delete only the unused ones (for example `.lede,.about .lead,.case-hl,.text-page .lead{…}` becomes `.case-hl,.text-page .lead{…}`). Delete any `@media` block left empty.

Re-run `python -m pytest tests -q -k css_class` until it passes.

- [ ] **Step 3: Add the new homepage styles**

Append to `css/styles.css`:

```css
/* =============================================================== homepage
   The page lays out every box; the 3D (Task 6 on, .has-3d) fills them from one fixed canvas behind the
   page. Without it, each 3D box shows a still of itself and the page flows normally: this is that page. */
.stage{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:none}
[data-page="home"] main,[data-page="home"] footer{position:relative;z-index:1}
.big{font:700 clamp(44px,7.4vw,120px)/.95 var(--stmt);letter-spacing:-.035em;color:var(--ink);text-wrap:balance}
.still{display:block;width:100%;height:100%}
.still img{width:100%;height:100%;object-fit:contain}
[data-anchor][data-live] > :not(.ch-hit){visibility:hidden} /* the live 3D now draws this box */

/* hero: the name, then three links */
.hero{min-height:calc(100svh - var(--bar));display:grid;grid-template-rows:minmax(0,1fr) auto;justify-items:center;align-items:center;gap:clamp(24px,5vh,56px);padding-block:clamp(24px,6vh,72px)}
.hero-board{width:100%;max-width:1240px;aspect-ratio:14.94/3.42;display:grid;place-items:center}
.hero-links,.end-links{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
.icon-btn{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 20px 0 16px;border:1px solid var(--hair);border-radius:999px;font:500 16px/1 var(--body);color:var(--ink);transition:background-color .25s,color .25s,border-color .25s}
.icon-btn svg{width:20px;height:20px;flex:none;fill:currentColor}
@media (hover:hover){.icon-btn:hover{background:var(--ink);border-color:var(--ink);color:var(--bg)}}
[data-page="home"] .top:not(.scrolled) .logo{opacity:0;pointer-events:none}
.logo{transition:color .2s,opacity .3s var(--ease)}

/* flap tiles in rows (the hero until its still exists; the ending board) */
.flap-rows{display:grid;gap:clamp(8px,1vw,14px);justify-items:center;margin-top:0}
.flap-rows .row{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(8px,1vw,14px) clamp(14px,1.6vw,24px)}
.flap-rows .row.gold .t{color:var(--gold)}

/* "Five projects." */
.fly .pin{min-height:50svh;display:grid;place-items:center;padding-inline:var(--gutter);text-align:center}

/* the chapters */
.chapter{position:relative;--name-font:var(--stmt)}
.ch-key{position:absolute;top:0;left:0;width:1px;height:1px}
.chapter .pin{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);grid-template-areas:"info stage";align-items:center;gap:clamp(24px,4vw,72px);padding:calc(var(--bar) + clamp(16px,4vh,48px)) var(--gutter) clamp(40px,7vh,96px);max-width:var(--max);margin-inline:auto}
.chapter[data-side="right"] .pin{grid-template-columns:minmax(0,7fr) minmax(0,5fr);grid-template-areas:"stage info"}
.chapter[data-side="bottom-left"] .pin{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"stage" "info";align-items:end}
.ch-stage{grid-area:stage;position:relative;aspect-ratio:16/10;min-height:0;width:100%}
.ch-stage .still{border-radius:10px;overflow:hidden}
.ch-hit{position:absolute;inset:0;z-index:1}
.info{grid-area:info;display:grid;gap:14px;justify-items:start;container-type:inline-size;position:relative;z-index:2}
.ch-num{font:500 16px/1 var(--mono);letter-spacing:.1em;color:var(--c)}
.ch-name{font-family:var(--name-font),var(--stmt);font-weight:400;font-size:clamp(40px,14cqi,92px);line-height:1;letter-spacing:-.01em;color:var(--c);text-wrap:balance}
.ch-line{font-size:clamp(18px,1.5vw,22px);line-height:1.45;color:var(--soft);max-width:32ch}
.ch-res{font:500 16px/1.4 var(--mono);letter-spacing:.02em;color:var(--gold)}
.info .btn{margin-top:6px}
.rail{display:none}

/* about: the portrait and three facts */
.me{display:grid;grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:clamp(32px,5vw,80px);align-items:end;margin-top:clamp(28px,4vh,48px)}
.me .portrait{aspect-ratio:4/5;border-radius:10px;overflow:hidden}
.me .portrait img{width:100%;height:100%;object-fit:cover}
.facts3{margin:0;display:grid;gap:28px}
.facts3 dt{font-size:16px;letter-spacing:.09em;text-transform:uppercase;color:var(--gold)}
.facts3 dd{margin:8px 0 0;font-size:clamp(19px,1.6vw,24px);line-height:1.35}
.facts3 .mono{font:500 17px/1.5 var(--mono);color:var(--soft)}

/* the ending: the internship board, Reach out, the links */
.end{display:grid;justify-items:center;gap:clamp(28px,4vh,44px);padding-block:clamp(96px,16vh,200px);text-align:center}
.end-board{--tw:clamp(18px,calc((100vw - 2 * var(--gutter)) / 30),44px)}
.end-mail{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:center;font:500 clamp(17px,1.8vw,22px)/1.3 var(--mono);color:var(--soft)}

@media (max-width:860px){
  .hero-board{aspect-ratio:10.12/5.07}
  .chapter .pin,.chapter[data-side] .pin{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"stage" "info";align-items:end}
  .me{grid-template-columns:1fr}
  .me .portrait{max-width:320px}
}

/* stills of the 3D (design/stills.mjs): only the canvas shows, on a transparent page */
html[data-pose],html[data-pose] body{background:transparent!important}
html[data-pose] body > :not(.stage){visibility:hidden}
```

- [ ] **Step 4: Rebuild and run the tests**

```bash
python design/build_site.py
python -m pytest tests -q
```

Expected: `8 passed`.

- [ ] **Step 5: Write the browser smoke test**

Create `tests/browser/smoke.mjs`:

```js
// The homepage as visitors get it. Serve the site first (python -m http.server 8000), then: npm run smoke
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:8000/';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const failures = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(ok, label) { console.log(`  ${ok ? '✓' : '✗'} ${label}`); if (!ok) failures.push(label); }

async function open({ w = 1440, h = 900, js = true, reduced = false, path = '', block = null } = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (block) {
    await page.setRequestInterception(true);
    page.on('request', (r) => (r.url().includes(block) ? r.abort() : r.continue()));
  }
  await page.setJavaScriptEnabled(js);
  await page.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  return { page, errors };
}

// every piece of a chapter's information block is showing (not hidden, not transparent)
async function infoVisible(page, pid) {
  return page.$eval(`#ch-${pid}`, (h) => [...h.closest('.info').children].every((el) => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.99;
  }));
}
const PIDS = ['sb', 'bx', 'bb', 'mt', 'kc'];

const SCENARIOS = [];
const scenario = (name, fn) => SCENARIOS.push([name, fn]);

/* ------------------------------------------------------------------ scenarios (later tasks add below) */

scenario('without JavaScript, everything is there', async () => {
  const { page } = await open({ js: false });
  check(await page.$$eval('.chapter', (s) => s.length) === 5, 'five chapters');
  for (const pid of PIDS) check(await infoVisible(page, pid), `chapter ${pid}: information visible`);
  check(await page.$$eval('.hero-links a', (a) => a.length) === 3, 'three hero links');
  check(await page.$eval('canvas.stage', (c) => getComputedStyle(c).display === 'none'), 'canvas hidden');
  await page.close();
});

for (const [w, h] of [[1440, 900], [390, 844]]) {
  scenario(`at ${w}px nothing runs off the side`, async () => {
    const { page, errors } = await open({ w, h });
    check(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth), 'no sideways scroll');
    check(errors.length === 0, `no errors ${errors.join(' | ')}`);
    await page.close();
  });
}

/* ------------------------------------------------------------------ run */
for (const [name, fn] of SCENARIOS) {
  console.log(name);
  try { await fn(); } catch (err) { check(false, `${name}: ${err.message}`); }
}
await browser.close();
console.log(failures.length ? `\n${failures.length} failed` : '\nall passed');
process.exit(failures.length ? 1 : 0);
```

Later tasks add scenarios at the marked line, above `/* ---- run */`.

- [ ] **Step 6: Run the smoke test**

Start the server in a second terminal: `python -m http.server 8000 --bind 127.0.0.1`. Then run:

Run: `npm run smoke`
Expected: every line `✓`, then `all passed`.

- [ ] **Step 7: Look at it**

Take screenshots with headless Chrome (desktop and phone), view them, and confirm the layout reads: name tiles centred, three round icon buttons, "Five projects.", chapters with the picture and the information side by side (stacked on the phone), the three facts, the ending board, "Reach out" and the icons.

```bash
node -e "import('puppeteer-core').then(async ({default:p})=>{const b=await p.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});for(const [w,h] of [[1440,900],[390,844]]){const g=await b.newPage();await g.setViewport({width:w,height:h,isMobile:w<768});await g.goto('http://localhost:8000/',{waitUntil:'networkidle0'});await g.screenshot({path:'../portfolio-tools/shots3d/base-'+w+'.png',fullPage:true});}await b.close();})"
```

(Create `../portfolio-tools/shots3d/` first with `mkdir -p ../portfolio-tools/shots3d`.) Open both PNGs with the Read tool. Fix any overlap or overflow in the CSS above before committing.

- [ ] **Step 8: Commit**

```bash
git add css/styles.css tests/test_site.py tests/browser/smoke.mjs ./*.html
git commit -m "Homepage styles: the name, chapters with their pictures, three facts and the ending; old homepage rules gone"
```

---

### Task 5: Each project's name in its own typeface

**Files:**
- Create: `design/build_name_fonts.py`, `tests/test_assets.py`, `assets/fonts/name-*.woff2` (5 files), `assets/fonts/LICENSES-names.txt`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `CHAPTERS[i]['font']` names from Task 3: `Name SignalBridge`, `Name Boss Breaker`, `Name Better Call Bhai`, `Name MEANT`, `Name KnowCad`.
- Produces: `assets/fonts/name-{slug}.woff2`, and an `@font-face` with that family name for each.

- [ ] **Step 1: Write the failing test**

Create `tests/test_assets.py`:

```python
"""Checks on generated assets: python -m pytest tests -q"""
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'design'))

NAMES = {'signalbridge': 'SignalBridge', 'boss-breaker': 'Boss Breaker', 'better-call-bhai': 'Better Call Bhai',
         'meant': 'MEANT', 'knowcad': 'KnowCad'}


@pytest.mark.parametrize('slug,name', NAMES.items())
def test_each_name_font_is_small_and_has_every_letter_of_the_name(slug, name):
    from fontTools.ttLib import TTFont
    path = ROOT / 'assets' / 'fonts' / f'name-{slug}.woff2'
    assert path.exists()
    assert path.stat().st_size < 12_000, path.stat().st_size
    cmap = TTFont(path).getBestCmap()
    assert all(ord(ch) in cmap for ch in set(name)), name
    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    assert f'font-family:"Name {name}";src:url(../assets/fonts/name-{slug}.woff2)' in css
```

Run: `python -m pytest tests/test_assets.py -q`
Expected: 5 failed (files missing).

- [ ] **Step 2: Write the font builder**

Create `design/build_name_fonts.py`:

```python
"""Each project's name in its own typeface, cut down to the letters of the name (a few KB each).

    python -m pip install -r design/requirements-dev.txt
    python design/build_name_fonts.py

Downloads the OFL source fonts from the Google Fonts repository into ../portfolio-tools/fonts-src (outside
this repository), pins a variable font to one style, keeps only the glyphs of the name, and writes
assets/fonts/name-<slug>.woff2. Their licences go to assets/fonts/LICENSES-names.txt.
"""
import urllib.parse
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / 'portfolio-tools' / 'fonts-src'
BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'

# (slug, the name to keep, folder and file in google/fonts ofl/, variable axes to pin)
FACES = [
    ('signalbridge', 'SignalBridge', 'fraunces', 'Fraunces[SOFT,WONK,opsz,wght].ttf',
     {'wght': 600, 'opsz': 144, 'SOFT': 0, 'WONK': 0}),
    ('boss-breaker', 'Boss Breaker', 'bungee', 'Bungee-Regular.ttf', {}),
    ('better-call-bhai', 'Better Call Bhai', 'abrilfatface', 'AbrilFatface-Regular.ttf', {}),
    ('meant', 'MEANT', 'atkinsonhyperlegible', 'AtkinsonHyperlegible-Bold.ttf', {}),
    ('knowcad', 'KnowCad', 'michroma', 'Michroma-Regular.ttf', {}),
]


def fetch(folder, name):
    (SRC / folder).mkdir(parents=True, exist_ok=True)
    local = SRC / folder / name                 # per folder: every family has its own OFL.txt
    if not local.exists():
        url = BASE + folder + '/' + urllib.parse.quote(name)
        with urllib.request.urlopen(url) as r:
            local.write_bytes(r.read())
    return local


def main():
    licences = []
    for slug, text, folder, file, axes in FACES:
        font = TTFont(fetch(folder, file))
        if axes:
            font = instancer.instantiateVariableFont(font, axes)
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        opts.name_IDs = ['*']
        sub = subset.Subsetter(opts)
        sub.populate(text=text + ' ')
        sub.subset(font)
        out = ROOT / 'assets' / 'fonts' / f'name-{slug}.woff2'
        font.flavor = 'woff2'
        font.save(out)
        print(f'wrote {out.name:28} {out.stat().st_size:6} bytes')
        licences.append(f'== {file} (name-{slug}.woff2)\n' + fetch(folder, 'OFL.txt').read_text(encoding='utf-8'))
    (ROOT / 'assets' / 'fonts' / 'LICENSES-names.txt').write_text('\n\n'.join(licences), encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
```

- [ ] **Step 3: Build the fonts and declare them**

Run: `python design/build_name_fonts.py`
Expected: five lines `wrote name-….woff2`, each under 12000 bytes.

In `css/styles.css`, after the existing `@font-face` lines at the top, add:

```css
/* each project's name in its own typeface, cut down to the letters of the name (design/build_name_fonts.py) */
@font-face{font-family:"Name SignalBridge";src:url(../assets/fonts/name-signalbridge.woff2) format("woff2");font-display:swap}
@font-face{font-family:"Name Boss Breaker";src:url(../assets/fonts/name-boss-breaker.woff2) format("woff2");font-display:swap}
@font-face{font-family:"Name Better Call Bhai";src:url(../assets/fonts/name-better-call-bhai.woff2) format("woff2");font-display:swap}
@font-face{font-family:"Name MEANT";src:url(../assets/fonts/name-meant.woff2) format("woff2");font-display:swap}
@font-face{font-family:"Name KnowCad";src:url(../assets/fonts/name-knowcad.woff2) format("woff2");font-display:swap}
```

- [ ] **Step 4: Run the tests**

```bash
python design/stamp_assets.py
python -m pytest tests -q
```

Expected: `13 passed`.

- [ ] **Step 5: Look at the five names**

Take a full-page screenshot at 1440×900 the same way as in Task 4, Step 7. Confirm each chapter's name shows in its own face: Fraunces' soft serif, Bungee's blocky caps, Abril's fat face, Atkinson's plain bold, Michroma's wide letters. If a name falls back to the plain heading font, the family name in `--name-font` and the `@font-face` disagree: fix the CSS.

- [ ] **Step 6: Commit**

```bash
git add design/build_name_fonts.py tests/test_assets.py assets/fonts/name-*.woff2 assets/fonts/LICENSES-names.txt css/styles.css ./*.html
git commit -m "Each project's name in its own typeface, a few KB each"
```

---

### Task 6: three.js, the stage, and the scroll-driven layout

**Files:**
- Create: `js/vendor/three/` (copied from npm), `js/3d/stage.js`, `js/home.js`
- Modify: `design/build_site.py` (`head()` gets the import map), `css/styles.css` (the `.has-3d` layout), `tests/test_site.py`, `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes: `js/lib/*` from Task 2; the page contract from Task 3.
- Produces:
  - **`js/3d/stage.js`:**
    - exports `FOV = 30`, `CAM_Z = 20` and `createStage(canvas, {maxDpr}) -> stage`
    - `stage.scene`, `stage.camera` and `stage.renderer`
    - `stage.view {w, h, k}`: k is world units per CSS pixel
    - `stage.pointer {x, y, nx, ny, inside, type}`
    - `stage.add(part)` and `stage.remove(part)`, where a part is `{ update(nowMs, dtMs) -> busy: boolean }`
    - `stage.invalidate()`, `stage.renderNow()`, `stage.setDpr(n)` and `stage.stop()`
    - `stage.onFrame(fn(now, dt)) -> unsubscribe`
    - `stage.boxToWorld(el) -> {x, y, w, h}`
  - **`js/home.js`:**
    - `export const KEY = 0.8`
    - a `SCENES` map from `data-scene` to `() => import(module)`. Later tasks add entries. Each module exports `async mount(stage, section) -> part`.
    - html gets the class `has-3d` or `stills`, plus `frozen` after a fallback
    - every `[data-anchor]` of a mounted scene gets `data-live`
    - `?pose=<scene>` scrolls to the scene's pose, mounts only that scene, renders, then sets `html[data-posed=<scene>]`

- [ ] **Step 1: Vendor three.js**

```bash
mkdir -p js/vendor/three/addons/geometries js/vendor/three/addons/environments
cp node_modules/three/build/three.module.min.js node_modules/three/build/three.core.min.js js/vendor/three/
cp node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js js/vendor/three/addons/geometries/
cp node_modules/three/examples/jsm/environments/RoomEnvironment.js js/vendor/three/addons/environments/
cp node_modules/three/LICENSE js/vendor/three/LICENSE
grep -o "from\s*['\"][^'\"]*['\"]" js/vendor/three/three.module.min.js js/vendor/three/addons/*/*.js | sort -u
```

Expected: the grep lists only `'./three.core.min.js'` (from the module build) and `'three'` (from both addons).

- [ ] **Step 2: Write the failing tests**

Append to `tests/test_site.py`:

```python
import json  # noqa: E402


def test_import_map_points_every_module_at_a_stamped_file_that_exists():
    markup = bs.build_home()
    m = re.search(r'<script type="importmap">(.*?)</script>', markup, re.S)
    assert m, 'no import map'
    imports = json.loads(m.group(1))['imports']
    for spec, url in imports.items():
        path, _, stamp = url.partition('?v=')
        assert (ROOT / path.removeprefix('./')).exists(), (spec, url)
        assert re.fullmatch(r'[0-9a-f]{8}', stamp), (spec, url)
    assert imports['three'].startswith('./js/vendor/three/three.module.min.js?v=')
    assert re.search(r'<script type="module" src="\./js/home\.js\?v=[0-9a-f]{8}"></script>', markup)


def test_every_module_import_resolves():
    imports = json.loads(re.search(r'<script type="importmap">(.*?)</script>', bs.build_home(), re.S).group(1))['imports']
    own = [f for f in (ROOT / 'js').rglob('*.js') if 'vendor' not in f.parts and f.name not in ('script.js', 'analytics.js')]
    for f in own:
        for spec in re.findall(r'(?:\bfrom|\bimport)\s*\(?\s*[\'"]([^\'"]+)[\'"]', f.read_text(encoding='utf-8')):
            if spec.startswith('.'):
                assert (f.parent / spec).resolve().exists(), (f.name, spec)
            else:
                assert spec in imports, (f.name, spec)
```

Run: `python -m pytest tests -q -k "import"`
Expected: 2 failed (`no import map`).

- [ ] **Step 3: Add the import map to the homepage's head**

In `design/build_site.py`, add above `def head(`:

```python
def module_map():
    """The homepage's ES modules. Every module URL points at a copy stamped with a hash of its contents, so
    a browser never mixes modules from two releases (GitHub Pages lets them be cached for ten minutes)."""
    import hashlib
    imports = {}
    for f in sorted((ROOT / 'js').rglob('*.js')):
        rel = f.relative_to(ROOT).as_posix()
        if rel in ('js/script.js', 'js/analytics.js'):
            continue
        h = hashlib.sha1(f.read_bytes().replace(b'\r\n', b'\n')).hexdigest()[:8]
        imports[f'./{rel}'] = f'./{rel}?v={h}'
        if rel.startswith('js/vendor/three/addons/'):
            imports['three/addons/' + rel.removeprefix('js/vendor/three/addons/')] = f'./{rel}?v={h}'
    imports['three'] = imports['./js/vendor/three/three.module.min.js']
    return imports
```

Change the signature to `def head(title, desc, path, og_title=None, og_desc=None, ld=None, noindex=False, prefix='', modules=False):`. Inside, before the `return`, add:

```python
    mods = ''
    if modules:
        imap = module_map()
        mods = (f'\n  <script type="importmap">{json.dumps({"imports": imap}, separators=(",", ":"))}</script>'
                f'\n  <script type="module" src="{imap["./js/home.js"]}"></script>')
```

In the returned string, change `<script src="{prefix}js/analytics.js" defer></script>{ld_html}` to `<script src="{prefix}js/analytics.js" defer></script>{mods}{ld_html}`. In `build_home`, pass `modules=True` to `head(...)`.

- [ ] **Step 4: Write the stage**

Create `js/3d/stage.js`:

```js
// One renderer, one fixed canvas behind the page, one studio light for everything. It draws only when
// something changed (scroll, pointer, a spring still settling) and sleeps otherwise, so nothing moves
// by itself and a phone is not kept busy.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { worldPerPixel, rectToWorld } from '../lib/fit.js';

export const FOV = 30;
export const CAM_Z = 20;

export function createStage(canvas, { maxDpr = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
  // the studio: a soft key from the top left and a dim cool fill; project colour only ever comes in as rim light
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-6, 8, 10);
  const fill = new THREE.DirectionalLight(0xc8d2ff, 0.25);
  fill.position.set(6, -3, 6);
  scene.add(key, fill);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CAM_Z);

  const view = { w: 1, h: 1, k: 1 };
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false, type: '' };
  const parts = new Set();
  const hooks = new Set();
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  let raf = 0;
  let last = 0;
  let stopped = false;

  function invalidate() {
    if (!raf && !stopped) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(now - last, 100) : 16;
    last = now;
    let busy = false;
    for (const p of parts) busy = p.update(now, dt) || busy;
    renderer.render(scene, camera);
    for (const h of hooks) h(now, dt);
    if (busy) invalidate(); else last = 0;
  }
  function resize() {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(view.w, view.h, false);
    camera.aspect = view.w / view.h;
    camera.updateProjectionMatrix();
    view.k = worldPerPixel(FOV, CAM_Z, view.h);
    invalidate();
  }

  addEventListener('resize', resize);
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / view.w) * 2 - 1;
    pointer.ny = -((e.clientY / view.h) * 2 - 1);
    pointer.inside = true;
    pointer.type = e.pointerType;
    invalidate();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.inside = false; invalidate(); });
  resize();

  return {
    renderer, scene, camera, view, pointer,
    add(part) { parts.add(part); invalidate(); },
    remove(part) { parts.delete(part); invalidate(); },
    onFrame(fn) { hooks.add(fn); return () => hooks.delete(fn); },
    invalidate,
    boxToWorld: (el) => rectToWorld(el.getBoundingClientRect(), view.w, view.h, view.k),
    setDpr(n) { dpr = Math.min(window.devicePixelRatio || 1, n); resize(); },
    // draw right now, outside the loop: the first frame of a scene, and stills
    renderNow() { for (const p of parts) p.update(performance.now(), 16); renderer.render(scene, camera); },
    stop() { stopped = true; cancelAnimationFrame(raf); raf = 0; },
  };
}
```

- [ ] **Step 5: Write the homepage orchestrator**

Create `js/home.js`:

```js
/* The homepage: decides between the live 3D and the stills, mounts each 3D scene as its section comes near,
   and drives what the scroll position decides: the chapter beats, the rail and the snap. Every part of the
   page works without this file. */
import { want3D, readEnv } from './lib/capability.js';
import { sectionProgress, ramp } from './lib/motion.js';
import { snapTarget, currentChapter } from './lib/scrollnav.js';
import { FrameWatch } from './lib/watchdog.js';

export const KEY = 0.8;                                    // the payoff pose every chapter settles on
const BEATS = { line: [0.25, 0.35], pay: [0.6, 0.7] };     // the one line, then the result and the link
// data-scene → its module, loaded only when its section comes near (later tasks add entries)
const SCENES = {};

const root = document.documentElement;
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pose = new URLSearchParams(location.search).get('pose');
const chapters = $$('.chapter');
const fly = document.querySelector('.fly');
const rail = document.querySelector('.rail');
const marks = rail ? $$('li', rail) : [];
const live = want3D(readEnv());
root.classList.add(live ? 'has-3d' : 'stills');

function freeze() {
  root.classList.add('frozen');
  $$('[data-live]').forEach((a) => a.removeAttribute('data-live'));
}

// the words of each chapter arrive in beats, the title moves with the flight, the rail marks where you are
function beats() {
  const vh = innerHeight;
  if (fly) {
    const r = fly.getBoundingClientRect();
    fly.style.setProperty('--p', sectionProgress(r.top, r.height, vh).toFixed(4));
  }
  const rects = chapters.map((c) => c.getBoundingClientRect());
  rects.forEach((r, i) => {
    if (r.bottom < -vh || r.top > 2 * vh) return;
    const p = sectionProgress(r.top, r.height, vh);
    chapters[i].style.setProperty('--b1', ramp(p, ...BEATS.line).toFixed(3));
    chapters[i].style.setProperty('--b2', ramp(p, ...BEATS.pay).toFixed(3));
  });
  const now = currentChapter(rects, vh);
  if (rail) {
    rail.classList.toggle('on', now >= 0);
    marks.forEach((m, k) => m.toggleAttribute('data-on', k === now));
  }
}

// when scrolling stops near a chapter's payoff ahead, glide onto it; never back against the visitor
function snap() {
  let timer = 0;
  let lastY = scrollY;
  let dir = 1;
  let held = false;
  let gliding = false;
  const poses = () => chapters.map((c) => c.getBoundingClientRect().top + scrollY + KEY * (c.offsetHeight - innerHeight));
  addEventListener('pointerdown', () => { held = true; }, { passive: true });
  addEventListener('pointerup', () => { held = false; }, { passive: true });
  addEventListener('pointercancel', () => { held = false; }, { passive: true });
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y !== lastY) dir = y > lastY ? 1 : -1;
    lastY = y;
    clearTimeout(timer);
    if (gliding) return;
    timer = setTimeout(() => {
      if (held) return;
      const t = snapTarget(scrollY, poses(), innerHeight, dir);
      if (t === null) return;
      gliding = true;
      const end = () => { gliding = false; };
      addEventListener('scrollend', end, { once: true });
      setTimeout(end, 1500);
      scrollTo({ top: t, behavior: 'smooth' });
    }, 150);
  }, { passive: true });
}

async function start3D() {
  const { createStage } = await import('./3d/stage.js');
  const canvas = document.querySelector('canvas.stage');
  const stage = createStage(canvas, { maxDpr: matchMedia('(pointer: coarse)').matches ? 1.5 : 2 });
  addEventListener('scroll', stage.invalidate, { passive: true });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stage.stop(); freeze(); });

  const mounted = new Set();
  async function mount(section) {
    const name = section.dataset.scene;
    if (mounted.has(name) || !SCENES[name]) return;
    mounted.add(name);
    try {
      const mod = await SCENES[name]();
      const part = await mod.mount(stage, section);
      stage.add(part);
      stage.renderNow();
      if (!root.classList.contains('frozen')) $$('[data-anchor]', section).forEach((a) => a.setAttribute('data-live', ''));
    } catch (err) {
      console.warn(`3D scene "${name}" did not load; its still stays.`, err);
    }
  }

  if (pose) {
    root.dataset.pose = pose;
    const section = document.querySelector(`[data-scene="${pose}"]`);
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo({ top: pose === 'hero' ? 0 : top + KEY * (section.offsetHeight - innerHeight), behavior: 'instant' });
    await mount(section);
    stage.renderNow();
    root.dataset.posed = pose;
    return;
  }

  const near = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) mount(en.target); }),
    { rootMargin: '150% 0px 150% 0px' });
  $$('[data-scene]').forEach((s) => near.observe(s));

  const watch = new FrameWatch();
  let scrolledAt = 0;
  addEventListener('scroll', () => { scrolledAt = performance.now(); }, { passive: true });
  stage.onFrame((now, dt) => {
    if (now - scrolledAt > 200) return;
    const verdict = watch.push(now, dt);
    if (verdict === 'lower') stage.setDpr(1);
    else if (verdict === 'stills') { stage.stop(); freeze(); }
  });
}

if (live) {
  // a page opened at #work-sb (or #work) lands on that chapter's payoff pose: the tall sections exist only
  // now that .has-3d is on, so make the jump again
  if (location.hash && !pose) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; beats(); }); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  beats();
  if (!pose) snap();
  start3D().catch((err) => { console.warn('The 3D stage did not start; showing the stills.', err); freeze(); });
}
```

- [ ] **Step 6: Add the `.has-3d` layout**

Append to `css/styles.css`:

```css
/* with the live 3D (.has-3d, set by js/home.js): the canvas shows; "Five projects." and every chapter are tall
   sections whose content stays pinned while the scroll drives it; a chapter's words arrive in beats */
.has-3d .stage{display:block}
.has-3d.frozen .stage{display:none}
.has-3d .fly{height:200vh}
.has-3d .fly .pin{position:sticky;top:0;height:100vh;min-height:0}
.has-3d .fly .big{transform:translateY(calc((.5 - var(--p,.5)) * 24vh)) scale(calc(.94 + var(--p,.5) * .12))}
.has-3d .chapter{height:250vh}
.has-3d .chapter .pin{position:sticky;top:0;height:100vh}
.has-3d .ch-stage{aspect-ratio:auto;height:100%}
.has-3d .ch-stage .still{border-radius:0}
.has-3d .ch-key{top:120vh} /* the payoff pose: 0.8 of the 150vh each chapter stays pinned */
.has-3d .beat-line{opacity:var(--b1,1);translate:0 calc((1 - var(--b1,1)) * 14px)}
.has-3d .beat-pay{opacity:var(--b2,1);translate:0 calc((1 - var(--b2,1)) * 14px)}
.has-3d .info:focus-within :is(.beat-line,.beat-pay){opacity:1;translate:none}
.has-3d .rail{position:fixed;right:clamp(10px,1.6vw,24px);top:50%;z-index:5;margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;translate:0 -50%;opacity:0;transition:opacity .3s var(--ease)}
.rail.on{opacity:1}
.rail li{width:22px;height:2px;border-radius:2px;background:var(--hair);transition:width .3s var(--ease),background-color .3s}
.rail li[data-on]{width:36px;background:var(--c)}
```

- [ ] **Step 7: Run the unit tests**

```bash
python design/build_site.py
python -m pytest tests -q
npm test
```

Expected: pytest `15 passed`; npm test all pass.

- [ ] **Step 8: Add the browser scenarios for the 3D layout**

In `tests/browser/smoke.mjs`, add above the `/* ---- run */` line:

```js
scenario('?mode=stills and reduced motion both get the stills', async () => {
  for (const opts of [{ path: '?mode=stills' }, { reduced: true }]) {
    const { page, errors } = await open(opts);
    check(await page.evaluate(() => document.documentElement.classList.contains('stills')), `${JSON.stringify(opts)}: html.stills`);
    for (const pid of PIDS) check(await infoVisible(page, pid), `${JSON.stringify(opts)}: ${pid} visible`);
    check(errors.length === 0, `no errors ${errors.join(' | ')}`);
    await page.close();
  }
});

scenario('live: tall pinned chapters and a stage', async () => {
  const { page, errors } = await open();
  check(await page.evaluate(() => document.documentElement.classList.contains('has-3d')), 'html.has-3d');
  check(await page.$eval('.chapter', (c) => Math.abs(c.offsetHeight - 2.5 * innerHeight) < 2), 'a chapter is 250vh');
  check(await page.$eval('canvas.stage', (c) => getComputedStyle(c).display === 'block'), 'canvas showing');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('a link lands on the payoff pose', async () => {
  for (const hash of ['#work-bx', '#work']) {
    const { page } = await open({ path: hash });
    await sleep(600);
    const pid = hash === '#work' ? 'sb' : 'bx';
    check(await infoVisible(page, pid), `${hash}: ${pid} fully visible on arrival`);
    await page.close();
  }
});

scenario('focus shows the whole information block', async () => {
  const { page } = await open();
  await page.evaluate(() => {
    const c = document.querySelectorAll('.chapter')[2];
    scrollTo({ top: c.getBoundingClientRect().top + scrollY + 5, behavior: 'instant' });
  });
  await sleep(300);
  await page.focus('.chapter:nth-of-type(3) .info a.btn');
  await sleep(100);
  const op = await page.$eval('.chapter:nth-of-type(3) .info a.btn', (a) => parseFloat(getComputedStyle(a).opacity));
  check(op > 0.99, `focused Case study link is visible (opacity ${op})`);
  await page.close();
});

scenario('the snap never pulls back', async () => {
  const { page } = await open();
  const y0 = await page.evaluate(() => {
    const c = document.querySelectorAll('.chapter')[1];
    const key = c.getBoundingClientRect().top + scrollY + 0.8 * (c.offsetHeight - innerHeight);
    scrollTo({ top: key + 120, behavior: 'instant' });
    return key + 120;
  });
  await page.mouse.wheel({ deltaY: 100 });
  await sleep(700);
  const y1 = await page.evaluate(() => scrollY);
  check(y1 >= y0, `stayed at or past where the visitor scrolled (${y0} → ${y1})`);
  await page.close();
});
```

The `:nth-of-type(3)` selectors count `section` elements inside `.chapters`. All the children there are chapter sections, so `.chapter:nth-of-type(3)` is chapter 03.

- [ ] **Step 9: Run the smoke test**

Run: `npm run smoke` (server on :8000)
Expected: `all passed`.

- [ ] **Step 10: Commit**

```bash
git add js/vendor js/3d/stage.js js/home.js design/build_site.py css/styles.css tests/test_site.py tests/browser/smoke.mjs ./*.html
git commit -m "three.js stage behind the page; chapters pin and their words arrive in beats; the snap and the rail"
```

---

### Task 7: The 3D name board

**Files:**
- Create: `js/3d/flap.js`, `js/3d/board.js`, `js/3d/hero.js`, `tests/js/flap.test.js`, `tests/browser/shot.mjs`
- Modify: `js/home.js` (register the hero scene), `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes:
  - `Spring`, `easeIn`, `easeInOut` and `clamp` (motion.js)
  - `fitScale` (fit.js)
  - the stage API (Task 6)
- Produces:
  - **`flap.js`:**
    - `GLYPHS` (40 characters) and `glyphIndex(ch)`
    - `glyphUV(index, 'top'|'bottom', cols, rows) -> {u0, u1, v0, v1}`
    - `flickerSequence(final, steps, rand) -> string[]`
    - `tileState(seq, start, turnMs, now) -> {from, to, t, done}`
    - `layoutRows(rows, opts) -> {tiles: [{ch, x, y, color, row}], size: {w, h}}`
  - **`board.js`:** `createBoard({rows}) -> {group, size, pick(camera, ndc), hover(i), ripple(i), lean(nx, ny), update(now, dt)}`
  - **`hero.js`:** `mount(stage, section) -> part`
  - **`shot.mjs`:** CLI `--out= --size=WxH --at=scene:progress --hover=x,y --path=`

- [ ] **Step 1: Write the failing tests**

`tests/js/flap.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { GLYPHS, glyphIndex, glyphUV, flickerSequence, tileState, layoutRows } from '../../js/3d/flap.js';

test('every letter of the boards is a glyph', () => {
  for (const ch of 'MRUTHULAN SENTHIL NATHAN OPEN TO A SWE INTERNSHIP 2027/28') assert.ok(GLYPHS.includes(ch), ch);
  assert.equal(GLYPHS.length, 40);
  assert.equal(glyphIndex(' '), 0);
  assert.equal(glyphIndex('a'), glyphIndex('A'));
});

test('glyphUV splits a cell into its top and bottom halves', () => {
  const top = glyphUV(0, 'top', 8, 5), bottom = glyphUV(0, 'bottom', 8, 5);
  assert.deepEqual([top.u0, top.u1, top.v1], [0, 0.125, 1]);
  assert.ok(Math.abs(top.v0 - 0.9) < 1e-9 && Math.abs(bottom.v1 - 0.9) < 1e-9 && Math.abs(bottom.v0 - 0.8) < 1e-9);
  const last = glyphUV(39, 'bottom', 8, 5);
  assert.ok(Math.abs(last.u1 - 1) < 1e-9 && Math.abs(last.v0) < 1e-9);
});

test('a flicker runs through other letters and lands back, never repeating a letter', () => {
  let n = 0; const rand = () => [0, 0, 0.5, 0.99][n++ % 4];
  const seq = flickerSequence('A', 3, rand);
  assert.equal(seq[0], 'A'); assert.equal(seq.at(-1), 'A');
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
  assert.ok(seq.length >= 4);
});

test('tileState walks the sequence one turn at a time', () => {
  const seq = ['A', 'B', 'C'];
  assert.deepEqual(tileState(seq, 100, 90, 50), { from: 'A', to: 'A', t: 0, done: false });
  const mid = tileState(seq, 100, 90, 145);
  assert.equal(mid.from, 'A'); assert.equal(mid.to, 'B'); assert.ok(Math.abs(mid.t - 0.5) < 1e-9);
  assert.equal(tileState(seq, 100, 90, 200).to, 'C');
  assert.deepEqual(tileState(seq, 100, 90, 400), { from: 'C', to: 'C', t: 1, done: true });
});

test('layoutRows: the two boards measure what the CSS boxes expect', () => {
  const desk = layoutRows([{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL NATHAN', color: 'white' }]);
  assert.equal(desk.tiles.length, 22);
  assert.ok(Math.abs(desk.size.w - 14.94) < 1e-6 && Math.abs(desk.size.h - 3.42) < 1e-6, JSON.stringify(desk.size));
  const phone = layoutRows([{ text: 'MRUTHULAN' }, { text: 'SENTHIL' }, { text: 'NATHAN' }]);
  assert.ok(Math.abs(phone.size.w - 10.12) < 1e-6 && Math.abs(phone.size.h - 5.07) < 1e-6, JSON.stringify(phone.size));
  const xs = desk.tiles.filter((t) => t.row === 0).map((t) => t.x);
  assert.ok(Math.abs(xs[0] + xs.at(-1)) < 1e-9, 'rows are centred');
  assert.ok(desk.tiles[0].y > desk.tiles.at(-1).y, 'first row on top');
});
```

Run: `npm test`
Expected: FAIL, `Cannot find module .../js/3d/flap.js`.

- [ ] **Step 2: Write the flap logic**

`js/3d/flap.js`:

```js
// The split-flap letters: the glyphs a board can show, what a tile shows at any moment, and where the
// tiles of a board go. Pure, so it is tested; js/3d/board.js draws it.

export const GLYPHS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.·';
export const glyphIndex = (ch) => Math.max(0, GLYPHS.indexOf(String(ch).toUpperCase()));

// uv box of a glyph's top or bottom half in an atlas of cols x rows cells (v = 1 at the top of the image)
export function glyphUV(index, half, cols, rows) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const u0 = col / cols;
  const u1 = (col + 1) / cols;
  const vTop = 1 - row / rows;
  const vBot = 1 - (row + 1) / rows;
  const vMid = (vTop + vBot) / 2;
  return half === 'top' ? { u0, u1, v0: vMid, v1: vTop } : { u0, u1, v0: vBot, v1: vMid };
}

// `steps` letters picked by `rand`, none repeating the one before, then back to `final`
export function flickerSequence(final, steps, rand = Math.random) {
  const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const seq = [final];
  for (let i = 0; i < steps; i++) {
    let k = Math.floor(rand() * pool.length) % pool.length;
    if (pool[k] === seq[seq.length - 1]) k = (k + 1) % pool.length;
    seq.push(pool[k]);
  }
  if (seq[seq.length - 1] !== final) seq.push(final);
  return seq;
}

// what a tile shows at `now` while it runs through `seq`, one turn every `turnMs` from `start`:
// the letter it is leaving, the letter it is turning to, and how far through the turn it is
export function tileState(seq, start, turnMs, now) {
  const turns = seq.length - 1;
  if (turns <= 0) return { from: seq[0], to: seq[0], t: 1, done: true };
  if (now <= start) return { from: seq[0], to: seq[0], t: 0, done: false };
  const k = Math.floor((now - start) / turnMs);
  if (k >= turns) return { from: seq[turns], to: seq[turns], t: 1, done: true };
  return { from: seq[k], to: seq[k + 1], t: (now - start - k * turnMs) / turnMs, done: false };
}

// tile centres for rows of text. Tiles are 1 wide and `tileH` tall, `gap` apart; a space is a wider gap.
// Rows are centred; size includes `pad` all round.
export function layoutRows(rows, { tileH = 1.37, gap = 0.09, wordGap = 0.55, rowGap = 0.28, pad = 0.2 } = {}) {
  const placed = rows.map((r) => {
    let x = 0;
    const xs = [];
    for (const ch of r.text) {
      if (ch === ' ') { x += wordGap - gap; continue; }
      xs.push({ ch, x: x + 0.5 });
      x += 1 + gap;
    }
    return { xs, width: x - gap, color: r.color || 'white' };
  });
  const n = rows.length;
  const totalH = n * tileH + (n - 1) * rowGap;
  const tiles = [];
  placed.forEach((r, row) => {
    const y = totalH / 2 - tileH / 2 - row * (tileH + rowGap);
    for (const t of r.xs) tiles.push({ ch: t.ch, x: t.x - r.width / 2, y, color: r.color, row });
  });
  const w = Math.max(...placed.map((r) => r.width));
  return { tiles, size: { w: w + 2 * pad, h: totalH + 2 * pad } };
}
```

Run: `npm test`
Expected: all pass.

- [ ] **Step 3: Write the board**

`js/3d/board.js`:

```js
// The split-flap board in 3D: each tile is a matte housing with hinge pins and two printed half-flaps.
// A turning letter is a third flap falling about the split line, showing the old top on its face and
// the new bottom on its back, as a real departures board does.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLYPHS, glyphIndex, glyphUV, flickerSequence, tileState, layoutRows } from './flap.js';
import { Spring, easeIn } from '../lib/motion.js';

const COLS = 8, ROWS = 5, CELL_W = 128, CELL_H = 176, TILE_H = 1.37;
const INK = { gold: '#E8B64C', white: '#F2F2F2' };

// every glyph printed on a flap, with the flap's slight shading; one atlas per ink colour
async function atlas(ink) {
  await document.fonts.load('800 150px Archivo');
  const c = document.createElement('canvas');
  c.width = COLS * CELL_W;
  c.height = ROWS * CELL_H;
  const g = c.getContext('2d');
  [...GLYPHS].forEach((ch, i) => {
    const x = (i % COLS) * CELL_W;
    const y = Math.floor(i / COLS) * CELL_H;
    const face = g.createLinearGradient(0, y, 0, y + CELL_H);
    face.addColorStop(0, '#232327');
    face.addColorStop(0.5, '#1B1B1E');
    face.addColorStop(1, '#151517');
    g.fillStyle = face;
    g.fillRect(x, y, CELL_W, CELL_H);
    if (ch === ' ') return;
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '800 150px Archivo';
    if ('fontStretch' in g) g.fontStretch = 'condensed';
    g.fillText(ch, x + CELL_W / 2, y + CELL_H / 2 + 8, CELL_W * 0.86);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function setUV(geo, { u0, u1, v0, v1 }) {
  const a = geo.attributes.uv;
  a.setXY(0, u0, v1); a.setXY(1, u1, v1); a.setXY(2, u0, v0); a.setXY(3, u1, v0);
  a.needsUpdate = true;
}

function makeTile(mat) {
  const h2 = TILE_H / 2 - 0.012;                     // each half, leaving the split line
  const half = () => new THREE.PlaneGeometry(1, h2);
  const y = TILE_H / 4 + 0.006;
  const top = new THREE.Mesh(half(), mat); top.position.y = y;
  const bottom = new THREE.Mesh(half(), mat); bottom.position.y = -y;
  const hinge = new THREE.Group(); hinge.position.z = 0.004;   // the falling flap turns about the split
  const front = new THREE.Mesh(half(), mat); front.position.y = y;
  const back = new THREE.Mesh(half(), mat); back.position.y = y; back.rotation.x = Math.PI;
  hinge.add(front, back);
  hinge.visible = false;
  const group = new THREE.Group();
  group.add(top, bottom, hinge);
  return { group, top, bottom, hinge, front, back, shown: '' };
}

function show(tile, st) {
  const key = `${st.from}${st.to}${st.done ? 1 : st.t.toFixed(3)}`;
  if (key === tile.shown) return;
  tile.shown = key;
  const uv = (ch, half) => glyphUV(glyphIndex(ch), half, COLS, ROWS);
  setUV(tile.top.geometry, uv(st.to, 'top'));
  setUV(tile.bottom.geometry, uv(st.done ? st.to : st.from, 'bottom'));
  if (st.done || st.from === st.to) { tile.hinge.visible = false; return; }
  tile.hinge.visible = true;
  setUV(tile.front.geometry, uv(st.from, 'top'));
  setUV(tile.back.geometry, uv(st.to, 'bottom'));
  tile.hinge.rotation.x = Math.PI * easeIn(st.t);    // a flap falls: slow to start, fast at the end
}

export async function createBoard({ rows }) {
  const [goldMap, whiteMap] = await Promise.all([atlas(INK.gold), atlas(INK.white)]);
  const flap = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.55, metalness: 0.12 });
  const mats = { gold: flap(goldMap), white: flap(whiteMap) };
  const { tiles: spots, size } = layoutRows(rows, { tileH: TILE_H });

  const group = new THREE.Group();    // placed, scaled and turned by the scene
  const body = new THREE.Group();     // leans toward the pointer
  group.add(body);
  const housing = new THREE.InstancedMesh(
    new RoundedBoxGeometry(1.06, TILE_H + 0.06, 0.16, 2, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.85, metalness: 0.25 }), spots.length);
  const pins = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a8a90, roughness: 0.3, metalness: 1 }), spots.length * 2);
  const m = new THREE.Matrix4();
  const sideways = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
  const one = new THREE.Vector3(1, 1, 1);
  const tiles = spots.map((s, i) => {
    housing.setMatrixAt(i, m.makeTranslation(s.x, s.y, -0.09));
    pins.setMatrixAt(i * 2, m.compose(new THREE.Vector3(s.x - 0.52, s.y, -0.004), sideways, one));
    pins.setMatrixAt(i * 2 + 1, m.compose(new THREE.Vector3(s.x + 0.52, s.y, -0.004), sideways, one));
    const t = makeTile(mats[s.color]);
    t.group.position.set(s.x, s.y, 0);
    t.top.userData.tile = i;
    t.bottom.userData.tile = i;
    body.add(t.group);
    const tile = Object.assign(t, { ch: s.ch, x: s.x, y: s.y, anim: null });
    show(tile, { from: s.ch, to: s.ch, t: 1, done: true });
    return tile;
  });
  body.add(housing, pins);

  const pickables = tiles.flatMap((t) => [t.top, t.bottom]);
  const ray = new THREE.Raycaster();
  const leanX = new Spring(0, { stiffness: 120, damping: 22 });
  const leanY = new Spring(0, { stiffness: 120, damping: 22 });
  let hovered = -1;

  return {
    group,
    size,
    pick(camera, ndc) {
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      return hit ? hit.object.userData.tile : -1;
    },
    // a flap flickers under the mouse and lands back on its letter
    hover(i) {
      if (i >= 0 && i !== hovered && !tiles[i].anim) {
        tiles[i].anim = { seq: flickerSequence(tiles[i].ch, 3), start: performance.now(), turnMs: 90 };
      }
      hovered = i;
    },
    // a press ripples the whole name out from that tile
    ripple(i0) {
      const o = tiles[Math.max(0, i0)];
      const now = performance.now();
      for (const t of tiles) {
        t.anim = { seq: flickerSequence(t.ch, 2), start: now + Math.hypot(t.x - o.x, t.y - o.y) * 30, turnMs: 80 };
      }
    },
    lean(nx, ny) { leanY.target = nx * 0.07; leanX.target = -ny * 0.05; },
    update(now, dt) {
      let busy = leanX.step(dt);
      busy = leanY.step(dt) || busy;
      body.rotation.x = leanX.value;
      body.rotation.y = leanY.value;
      for (const t of tiles) {
        if (!t.anim) continue;
        const st = tileState(t.anim.seq, t.anim.start, t.anim.turnMs, now);
        show(t, st);
        if (st.done) t.anim = null; else busy = true;
      }
      return busy;
    },
  };
}
```

- [ ] **Step 4: Write the hero scene**

`js/3d/hero.js`:

```js
// The hero: the name as a 3D split-flap board, fitted into .hero-board. It leans toward the mouse with a
// warm glint following the pointer, flickers a flap under the mouse, ripples on a press, and tilts back
// and away as the visitor scrolls on. The first frame matches the still exactly (no pointer, no lean).
import * as THREE from 'three';
import { createBoard } from './board.js';
import { fitScale } from '../lib/fit.js';
import { clamp, easeInOut } from '../lib/motion.js';

const DESK = [{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL NATHAN', color: 'white' }];
const PHONE = [{ text: 'MRUTHULAN', color: 'gold' }, { text: 'SENTHIL', color: 'white' }, { text: 'NATHAN', color: 'white' }];

export async function mount(stage, section) {
  const box = section.querySelector('[data-anchor]');
  const narrow = matchMedia('(max-width: 860px)');
  let board = await createBoard({ rows: narrow.matches ? PHONE : DESK });
  stage.scene.add(board.group);
  // the layout follows the same breakpoint as the box's shape; rebuild when it is crossed
  narrow.addEventListener('change', async () => {
    const next = await createBoard({ rows: narrow.matches ? PHONE : DESK });
    stage.scene.remove(board.group);
    board = next;
    stage.scene.add(board.group);
    stage.invalidate();
  });

  const glint = new THREE.PointLight(0xfff1d6, 0, 8, 1.6);
  stage.scene.add(glint);

  const ndc = (e) => new THREE.Vector2((e.clientX / stage.view.w) * 2 - 1, -(e.clientY / stage.view.h) * 2 + 1);
  box.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { board.hover(board.pick(stage.camera, ndc(e))); stage.invalidate(); } });
  box.addEventListener('pointerleave', () => board.hover(-1));
  box.addEventListener('pointerdown', (e) => { board.ripple(board.pick(stage.camera, ndc(e))); stage.invalidate(); });

  return {
    update(now, dt) {
      const r = box.getBoundingClientRect();
      const vh = stage.view.h;
      const visible = r.bottom > -vh && r.top < vh * 1.5;
      board.group.visible = visible;
      glint.visible = visible;
      if (!visible) return false;
      const w = stage.boxToWorld(box);
      // leaving the hero: the board tilts back and rises away, tied to the scroll
      const e = easeInOut(clamp(-section.getBoundingClientRect().top / section.offsetHeight));
      board.group.scale.setScalar(fitScale(board.size, w));
      board.group.position.set(w.x, w.y + e * 1.5, -e * 6);
      board.group.rotation.x = -e * 1.05;
      const P = stage.pointer;
      const mouse = P.inside && P.type === 'mouse';
      board.lean(mouse ? P.nx : 0, mouse ? P.ny : 0);
      const halfW = (stage.view.w * stage.view.k) / 2;
      const halfH = (stage.view.h * stage.view.k) / 2;
      glint.position.set(mouse ? P.nx * halfW : 0, mouse ? P.ny * halfH : 0, 2.2);
      glint.intensity = mouse ? 9 * (1 - e) : 0;
      return board.update(now, dt);
    },
  };
}
```

In `js/home.js`, change `const SCENES = {};` to:

```js
const SCENES = {
  hero: () => import('./3d/hero.js'),
};
```

- [ ] **Step 5: Write the screenshot helper**

`tests/browser/shot.mjs`:

```js
// One screenshot of the homepage, for looking at the 3D while building it.
//   node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/hero.png [--size=1440x900]
//        [--at=signalbridge:0.4] [--hover=720,300] [--path=?mode=stills]
// The pointer is held "down" so the snap does not move the page while the picture is taken.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:8000/';
const [w, h] = arg('size', '1440x900').split('x').map(Number);
const out = arg('out', '../portfolio-tools/shots3d/shot.png');
fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('pageerror', String(e)));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.error(m.type(), m.text()); });
await page.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
await page.goto(BASE + arg('path', ''), { waitUntil: 'networkidle0' });
await page.evaluate(() => dispatchEvent(new PointerEvent('pointerdown')));
const at = arg('at', '');
if (at) {
  const [scene, p] = at.split(':');
  await page.evaluate((scene, p) => {
    const s = document.querySelector(`[data-scene="${scene}"]`);
    const top = s.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + Number(p) * Math.max(0, s.offsetHeight - innerHeight), behavior: 'instant' });
  }, scene, p);
}
const hover = arg('hover', '');
if (hover) { const [x, y] = hover.split(',').map(Number); await page.mouse.move(x, y); }
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: out });
console.log('wrote', out);
await browser.close();
```

- [ ] **Step 6: Look at the board and tune it to the craft rules**

```bash
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/hero-desk.png
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/hero-hover.png --hover=600,330
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/hero-phone.png --size=390x844
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/hero-leaving.png --at=hero:0.5
```

Open all four with the Read tool and check each against the spec's craft rules.

| Check | If it fails |
|---|---|
| The letters sit centred on their flaps | Adjust the `+ 8` baseline nudge in `atlas()` |
| The split line and the pins are visible | |
| The housings read as matte dark metal, not plastic | Raise housing roughness toward 0.9 |
| The gold matches `#E8B64C` under the studio light | Lower `scene.environmentIntensity` (stage.js) a step at a time, never below 0.35, and recheck |
| The board fills its box | |
| With the hover, a soft warm glint sits near the pointer, with no hard hot spot | Lower `glint.intensity` from 9 |
| Nothing glows | |

- [ ] **Step 7: Add the browser scenarios**

In `tests/browser/smoke.mjs`, add above the run block:

```js
scenario('the board comes alive in its box', async () => {
  const { page, errors } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  check(true, 'hero board live');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('the board survives the breakpoint', async () => {
  const { page, errors } = await open();
  await page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await page.setViewport({ width: 700, height: 900 });
  await sleep(1500);
  await page.setViewport({ width: 1200, height: 800 });
  await sleep(1500);
  check(await page.$eval('.hero-board', (b) => b.hasAttribute('data-live')), 'still live after crossing 860px twice');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});
```

Run: `npm run smoke`
Expected: `all passed`.

- [ ] **Step 8: Commit**

```bash
python design/build_site.py
git add js/3d/flap.js js/3d/board.js js/3d/hero.js js/home.js tests/js/flap.test.js tests/browser/shot.mjs tests/browser/smoke.mjs ./*.html
git commit -m "The name as a 3D split-flap board: it leans to the mouse, flickers under it, ripples on a press"
```

(The rebuild matters: the import map's stamps change whenever a module changes.)

---

### Task 8: Stills, rendered from the real scene

**Files:**
- Create: `design/stills.mjs`, `assets/3d/stills/hero-desk.webp`, `assets/3d/stills/hero-phone.webp`
- Modify: `tests/browser/smoke.mjs`, the generated `index.html` (via rebuild)

**Interfaces:**
- Consumes: pose mode in `js/home.js` (`?pose=<scene>` → `html[data-posed]`); `still_picture()` from Task 3, which switches the hero to the still automatically once both files exist.
- Produces: `assets/3d/stills/<scene>-desk.webp` (1440×900 viewport, DPR 2) and `<scene>-phone.webp` (390×844, DPR 2), transparent around the object. `npm run stills -- <scene>…` renders the named scenes (default `hero`).

- [ ] **Step 1: Write the stills script**

`design/stills.mjs`:

```js
// Stills of the 3D, rendered from the real scene: the hero's first paint, and what every visitor without the
// live 3D sees. Serve the site on :8000 first, then: npm run stills -- hero signalbridge
// Each still is the scene's [data-anchor] box, transparent around the object, at 2x.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:8000/';
const OUT = fileURLToPath(new URL('../assets/3d/stills/', import.meta.url));
const FORMS = [['desk', 1440, 900], ['phone', 390, 844]];
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : ['hero'];
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
let failed = false;
for (const scene of scenes) {
  for (const [form, w, h] of FORMS) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(`${BASE}?pose=${scene}&mode=3d`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(`html[data-posed="${scene}"]`, { timeout: 30000 });
    const clip = await page.$eval(`[data-scene="${scene}"] [data-anchor]`, (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    });
    const file = `${OUT}${scene}-${form}.webp`;
    await page.screenshot({ path: file, type: 'webp', quality: 82, omitBackground: true, clip });
    console.log(`wrote ${scene}-${form}.webp  ${fs.statSync(file).size} bytes  ${errors.join(' | ')}`);
    if (errors.length) failed = true;
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Render the hero stills and look at them**

Run: `npm run stills -- hero`
Expected: two lines `wrote hero-desk.webp …` and `wrote hero-phone.webp …`, with no errors. The desk file should be under 150000 bytes; if it is larger, lower `quality` to 76.

Open both files with the Read tool. Each must show only the board, on transparency, filling the image edge to edge. No header, no text, no page background.

- [ ] **Step 3: Rebuild: the hero now paints the still first**

```bash
python design/build_site.py
grep -o '<picture class="still">[^<]*<source[^>]*>' index.html | head -1
```

Expected: a `<picture class="still">` with `srcset="assets/3d/stills/hero-phone.webp"` inside `.hero-board`.

- [ ] **Step 4: Add the browser scenarios (no pop on the swap; a failing scene keeps its still)**

In `tests/browser/smoke.mjs`, add above the run block:

```js
// mean difference per channel (0-255) between two PNG screenshots, measured in the page
async function meanDiff(page, a, b) {
  return page.evaluate(async (a, b) => {
    const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = `data:image/png;base64,${src}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const c = new OffscreenCanvas(ia.width, ia.height);
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(ia, 0, 0);
    const da = g.getImageData(0, 0, ia.width, ia.height).data;
    g.clearRect(0, 0, ia.width, ia.height);
    g.drawImage(ib, 0, 0, ia.width, ia.height);
    const db = g.getImageData(0, 0, ia.width, ia.height).data;
    let s = 0;
    for (let i = 0; i < da.length; i += 4) s += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    return s / ((da.length / 4) * 3);
  }, a, b);
}

scenario('the live board takes over from its still without a visible change', async () => {
  const clipOf = (page) => page.$eval('.hero-board', (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  const stills = await open({ path: '?mode=stills' });
  const a = await stills.page.screenshot({ encoding: 'base64', clip: await clipOf(stills.page) });
  const live = await open();
  await live.page.waitForSelector('.hero-board[data-live]', { timeout: 20000 });
  await sleep(300);
  const b = await live.page.screenshot({ encoding: 'base64', clip: await clipOf(live.page) });
  const d = await meanDiff(live.page, a, b);
  check(d < 8, `still and first live frame differ by ${d.toFixed(2)} (under 8)`);
  await stills.page.close();
  await live.page.close();
});

scenario('a scene that fails to load leaves its still', async () => {
  const { page } = await open({ block: '/js/3d/hero.js' });
  await sleep(2500);
  check(!(await page.$eval('.hero-board', (b) => b.hasAttribute('data-live'))), 'hero not marked live');
  check(await page.$eval('.hero-board .still img', (i) => i.complete && i.naturalWidth > 0 && getComputedStyle(i).visibility !== 'hidden'), 'hero still showing');
  await page.close();
});
```

Run: `npm run smoke`
Expected: `all passed`. If the swap differs by 8 or more, the first live frame is not the still's pose. Check that nothing in `hero.js` reads the pointer before a pointer event, and that `stills.mjs` and the smoke test use the same viewport (1440×900).

- [ ] **Step 5: Commit**

```bash
git add design/stills.mjs assets/3d/stills tests/browser/smoke.mjs ./*.html
git commit -m "Stills rendered from the real scene: the hero paints the board at once, the live 3D takes over unseen"
```

---

### Task 9: The fly-through

**Files:**
- Create: `js/3d/flythrough.js`
- Modify: `js/home.js` (register the scene)

**Interfaces:**
- Consumes: the stage API; `clamp` and `ramp` (motion.js).
- Produces: `mount(stage, section) -> part`. The dust is lit only between the hero's exit and chapter 01's arrival.

- [ ] **Step 1: Write the dust field**

`js/3d/flythrough.js`:

```js
// "Five projects.": a few hundred grains of gold dust stream toward the visitor as they scroll, which is
// what makes the page feel like it is moving forward. Tied to the scroll; still the moment it stops.
// If it reads as filler at the review, this scene is removed and the title stands alone.
import * as THREE from 'three';
import { clamp, ramp } from '../lib/motion.js';

export async function mount(stage, section) {
  const N = 420;
  const DEPTH = 60;
  const pos = new Float32Array(N * 3);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);   // the same field every visit
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (rnd() - 0.5) * 28;
    pos[i * 3 + 1] = (rnd() - 0.5) * 16;
    pos[i * 3 + 2] = -rnd() * DEPTH;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const g = dot.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const mat = new THREE.PointsMaterial({
    color: 0xe8b64c, size: 0.07, map: new THREE.CanvasTexture(dot), transparent: true,
    opacity: 0, depthWrite: false, sizeAttenuation: true,
  });
  const dust = new THREE.Points(geo, mat);
  stage.scene.add(dust);

  return {
    update() {
      const r = section.getBoundingClientRect();
      const vh = stage.view.h;
      // 0 as the section's top comes up from the bottom of the screen, 1 as its bottom leaves the top
      const f = clamp((vh - r.top) / (r.height + vh));
      const o = 0.6 * Math.min(ramp(f, 0, 0.12), 1 - ramp(f, 0.85, 1));
      dust.visible = o > 0.001;
      mat.opacity = o;
      dust.position.z = f * 40;
      return false;
    },
  };
}
```

In `js/home.js`, add the entry `fly: () => import('./3d/flythrough.js'),` to `SCENES`.

- [ ] **Step 2: Look at it at three points**

```bash
python design/build_site.py
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/fly-20.png --at=fly:0.2
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/fly-50.png --at=fly:0.5
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/fly-90.png --at=fly:0.9
```

Open the three files with the Read tool. Check against the craft rules:
- The dust is sparse, fine and soft.
- The dust is gold, not yellow-white.
- The dust never covers "Five projects.".
- There are no visible square sprites.
- The title is larger at 0.9 than at 0.2.

If it looks like a screensaver, halve `N` and lower the opacity factor to 0.4. Note what you saw for the review.

- [ ] **Step 3: Run the tests**

```bash
python -m pytest tests -q
npm run smoke
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add js/3d/flythrough.js js/home.js ./*.html
git commit -m "Five projects: gold dust streams past as the page carries you forward"
```

---

### Task 10: The devices, and SignalBridge's textures from the real screens

**Files:**
- Create: `js/3d/textures.js`, `js/3d/devices.js`, `tests/js/devices.test.js`, `design/build_3d_assets.py`, `assets/3d/sb-*.webp` (7 files)
- Modify: `tests/test_assets.py`

**Interfaces:**
- Consumes: three (node devDependency for the tests; vendored in the browser).
- Produces:
  - **`textures.js`:**
    - `loadTexture(url) -> Promise<Texture>`
    - `roundedRect(w, h, r) -> Shape`
    - `screenGeometry(w, h, r) -> ShapeGeometry` (UVs 0..1)
    - `contactShadow(w, d, opacity=0.5) -> Mesh` (a horizontal plane)
    - `keyboardTexture() -> CanvasTexture`
  - **`devices.js`:**
    - `PHONE {w: 0.715, h: 1.47, d: 0.078, r: 0.11}` and `LAPTOP {w: 3.12, depth: 2.21, base: 0.155, lidH: 2.06, lid: 0.06}`
    - `makePhone({screen, after, shadow=true}) -> {group, screen, screenSize: {w, h}, mix(t), size}`
    - `makeLaptop({screen, after, shadow=true, detail=true}) -> {group, screen, mix(t), setOpen(t), size}`
  - **`assets/3d/`:**
    - `sb-phone-consent.webp` and `sb-phone-notified.webp` (fit within 768×1662)
    - `sb-laptop-handoffs.webp` and `sb-laptop-brief.webp` (fit within 1600×1000)
    - `sb-message.webp` (837×270, rounded alpha)
    - `sb-consent-ask.webp` (1074×213, rounded alpha)
    - `sb-consent-given.webp` (1074×213, rounded alpha)
  - **`design/build_3d_assets.py`:** constants `MESSAGE_BOX = (285, 240, 1122, 510)`, `ASK_BOX = (48, 2013, 1122, 2226)` and `PILL_BOX = (675, 51, 1014, 123)`, in pixels of the 1170×2532 phone captures.

- [ ] **Step 1: Write the failing tests**

`tests/js/devices.test.js`:

```js
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
```

Append to `tests/test_assets.py`:

```python
import re  # noqa: E402

RAW = ROOT.parent / 'portfolio-tools' / 'card-shots' / 'raw'
SB = {'sb-phone-consent': (768, 1662), 'sb-phone-notified': (768, 1662), 'sb-laptop-handoffs': (1600, 1000),
      'sb-laptop-brief': (1600, 1000), 'sb-message': (837, 270), 'sb-consent-ask': (1074, 213),
      'sb-consent-given': (1074, 213)}


@pytest.mark.parametrize('name,limit', SB.items())
def test_signalbridge_textures_exist_within_their_sizes(name, limit):
    from PIL import Image
    path = ROOT / 'assets' / '3d' / f'{name}.webp'
    assert path.exists(), path
    with Image.open(path) as im:
        assert im.width <= limit[0] and im.height <= limit[1], im.size
        if name in ('sb-message', 'sb-consent-ask', 'sb-consent-given'):
            assert im.mode == 'RGBA'
            assert im.getpixel((0, 0))[3] == 0, 'rounded corner is transparent'
            assert im.getpixel((im.width // 2, im.height // 2))[3] == 255


def test_signalbridge_textures_fit_the_chapter_budget():
    total = sum((ROOT / 'assets' / '3d' / f'{n}.webp').stat().st_size for n in SB)
    assert total <= 400_000, total


@pytest.mark.skipif(not (ROOT / 'js' / '3d' / 'chapters' / 'signalbridge.js').exists(), reason='the scene comes in Task 11')
def test_the_scene_and_the_builder_agree_on_the_message_crop():
    import build_3d_assets as b
    js = (ROOT / 'js' / '3d' / 'chapters' / 'signalbridge.js').read_text(encoding='utf-8')
    m = re.search(r'MESSAGE_BOX = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.MESSAGE_BOX
```

The last test reads `js/3d/chapters/signalbridge.js`, which Task 11 creates; until then it is skipped.

Run: `npm test; python -m pytest tests/test_assets.py -q`
Expected: the devices tests fail (`Cannot find module .../js/3d/devices.js`) and the 7 texture tests fail (files missing).

- [ ] **Step 2: Write the asset builder and make the textures**

`design/build_3d_assets.py`:

```python
"""Textures for the 3D homepage, made from the real captures.

    python design/build_3d_assets.py

Reads the raw captures in ../portfolio-tools/card-shots/raw (outside this repository; raw files are never
published) and the site's own media, and writes WebP files to assets/3d/. Crops are cut from the real screens
with rounded corners, so each piece is exactly what the app showed. Nothing is drawn or invented here: the
one composite (sb-consent-given) is the app's own "Worker notified" pill, centred on a plate of the consent
card's own background colour, the same size as the card.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT.parent / 'portfolio-tools' / 'card-shots' / 'raw'
OUT = ROOT / 'assets' / '3d'

# boxes in pixels of the 1170 x 2532 phone captures (left, top, right, bottom)
MESSAGE_BOX = (285, 240, 1122, 510)   # the youth's first message, m-consent.png
ASK_BOX = (48, 2013, 1122, 2226)      # "Let your worker see a brief note from tonight?", m-consent.png
PILL_BOX = (675, 51, 1014, 123)       # "Worker notified", m-youth-chat.png


def fit(src, size):
    with Image.open(src) as im:
        im = im.convert('RGB')
        im.thumbnail(size, Image.LANCZOS)
        return im.copy()


def crop(src, box, radius):
    with Image.open(src) as im:
        piece = im.convert('RGBA').crop(box)
    mask = Image.new('L', piece.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, piece.width - 1, piece.height - 1), radius=radius, fill=255)
    piece.putalpha(mask)
    return piece


def plate(piece, like, scale=1.6):
    """`piece`, scaled, centred on a plate the size of `like`, in `like`'s own background colour."""
    colour = like.getpixel((20, like.height // 2))
    out = Image.new('RGBA', like.size, colour)
    p = piece.resize((round(piece.width * scale), round(piece.height * scale)), Image.LANCZOS)
    out.alpha_composite(p, ((like.width - p.width) // 2, (like.height - p.height) // 2))
    out.putalpha(like.getchannel('A'))
    return out


def save(im, name):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{name}.webp'
    im.save(path, 'WEBP', quality=84, method=6)
    print(f'wrote {path.name:26} {im.size[0]:5} x {im.size[1]:<5} {path.stat().st_size:7} bytes')


def main():
    sb = RAW / 'sb'
    save(fit(sb / 'm-consent.png', (768, 1662)), 'sb-phone-consent')
    save(fit(sb / 'm-youth-chat.png', (768, 1662)), 'sb-phone-notified')
    save(fit(sb / 'd-worker-handoffs.png', (1600, 1000)), 'sb-laptop-handoffs')
    save(fit(ROOT / 'assets' / 'media' / 'signalbridge-shot-2.webp', (1600, 1000)), 'sb-laptop-brief')
    save(crop(sb / 'm-consent.png', MESSAGE_BOX, 54), 'sb-message')
    ask = crop(sb / 'm-consent.png', ASK_BOX, 36)
    save(ask, 'sb-consent-ask')
    save(plate(crop(sb / 'm-youth-chat.png', PILL_BOX, 36), ask), 'sb-consent-given')


if __name__ == '__main__':
    main()
```

Run: `python design/build_3d_assets.py`
Expected: seven `wrote` lines. If `test_signalbridge_textures_fit_the_chapter_budget` later reports more than 400000 bytes, lower `quality=84` in `save()` to 78 and rerun.

Then open `assets/3d/sb-message.webp`, `sb-consent-ask.webp` and `sb-consent-given.webp` with the Read tool:
- The bubble's and the card's own borders must sit just inside the image edge, with the rounded corners on the border and no clipped text.
- If a border is clipped or a strip of background shows, move that box's edges by 6–12 px and rerun.
- The pill must be centred and legible on the plate.

- [ ] **Step 3: Write the textures helper and the devices**

`js/3d/textures.js`:

```js
// Shared pieces for the 3D: loading real captures, rounded shapes, soft contact shadows, a keyboard deck.
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function loadTexture(url) {
  return new Promise((resolve, reject) => loader.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    resolve(t);
  }, undefined, reject));
}

// a rounded rectangle, centred on the origin
export function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// a flat rounded rectangle whose texture covers it exactly (ShapeGeometry's own UVs are in shape units)
export function screenGeometry(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 12);
  const uv = g.attributes.uv;
  const pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
}

// a soft shadow on the surface under an object: a horizontal plane, drawn once
export function contactShadow(w, d, opacity = 0.5) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// a laptop keyboard: rows of dark keys on a darker deck
export function keyboardTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#121214';
  g.fillRect(0, 0, c.width, c.height);
  const rows = [14, 14, 13, 12, 11];
  const key = 64, gap = 8;
  rows.forEach((n, r) => {
    const y = 24 + r * (key + gap);
    const w = (c.width - 48 - (n - 1) * gap) / n;
    for (let i = 0; i < n; i++) {
      const x = 24 + i * (w + gap);
      g.fillStyle = '#1d1d21';
      g.beginPath(); g.roundRect(x, y, w, key, 8); g.fill();
      g.fillStyle = 'rgba(255,255,255,.05)';
      g.fillRect(x + 6, y + 3, w - 12, 2);
    }
  });
  g.fillStyle = '#1d1d21';
  g.beginPath(); g.roundRect(24 + 3 * 80, 24 + 5 * (key + gap), c.width - 48 - 6 * 80, key - 10, 8); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
```

`js/3d/devices.js`:

```js
// A phone and a laptop, built in code at real-world proportions (units: decimetres), generic rather than any
// brand's product. Screens show real captures; mix(t) crossfades to a second capture.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { roundedRect, screenGeometry, contactShadow, keyboardTexture } from './textures.js';

export const PHONE = { w: 0.715, h: 1.47, d: 0.078, r: 0.11 };
export const LAPTOP = { w: 3.12, depth: 2.21, base: 0.155, lidH: 2.06, lid: 0.06 };

function screens(w, h, r, a, b) {
  const geo = screenGeometry(w, h, r);
  const lit = (map, extra) => new THREE.MeshBasicMaterial({ map: map || null, color: map ? 0xffffff : 0x050506, toneMapped: false, ...extra });
  const front = new THREE.Mesh(geo, lit(a));
  const next = new THREE.Mesh(geo, lit(b, { transparent: true, opacity: 0, depthWrite: false }));
  next.position.z = 0.0005;
  next.visible = false;
  const glass = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false }));
  glass.position.z = 0.001;
  const group = new THREE.Group();
  group.add(front, next, glass);
  return { group, mix(t) { next.material.opacity = t; next.visible = t > 0.001 && Boolean(b); } };
}

export function makePhone({ screen, after, shadow = true } = {}) {
  const { w, h, d, r } = PHONE;
  const bevel = 0.012;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, r - bevel), {
    depth: d - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 16,
  });
  bodyGeo.center();
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x2a2b2f, metalness: 1, roughness: 0.3 }));
  const screenSize = { w: w - 0.05, h: h - 0.05 };
  const s = screens(screenSize.w, screenSize.h, r - 0.025, screen, after);
  s.group.position.z = d / 2 + 0.001;
  const group = new THREE.Group();
  group.add(body, s.group);
  if (shadow) {
    const sh = contactShadow(w * 1.6, d * 6);
    sh.position.y = -h / 2 - 0.004;
    group.add(sh);
  }
  return { group, screen: s.group, screenSize, mix: s.mix, size: { w, h } };
}

export function makeLaptop({ screen, after, shadow = true, detail = true } = {}) {
  const L = LAPTOP;
  const alu = new THREE.MeshStandardMaterial({ color: 0x4a4c52, metalness: 0.9, roughness: 0.36 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(L.w, L.base, L.depth, 4, 0.04), alu);
  const group = new THREE.Group();
  group.add(base);
  if (detail) {
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(L.w * 0.86, L.depth * 0.42),
      new THREE.MeshStandardMaterial({ map: keyboardTexture(), roughness: 0.7, metalness: 0.2 }));
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(0, L.base / 2 + 0.002, -L.depth * 0.17);
    const pad = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(1.15, 0.72, 0.06), 8),
      new THREE.MeshStandardMaterial({ color: 0x55575d, metalness: 0.6, roughness: 0.5 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, L.base / 2 + 0.002, L.depth * 0.27);
    group.add(deck, pad);
  }
  // the lid turns about the back edge of the base: open 0 = shut flat on the keys, 1 = open at about 106°
  const hinge = new THREE.Group();
  hinge.position.set(0, L.base / 2, -L.depth / 2 + 0.03);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(L.w, L.lidH, L.lid, 4, 0.025), alu);
  lid.position.set(0, L.lidH / 2, -L.lid / 2);
  const bezel = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(L.w - 0.04, L.lidH - 0.04, 0.05), 8),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.4 }));
  bezel.position.set(0, L.lidH / 2, 0.0005);
  const sw = L.w - 0.22;
  const s = screens(sw, sw / 1.6, 0.02, screen, after);
  s.group.position.set(0, L.lidH / 2 + 0.03, 0.001);
  hinge.add(lid, bezel, s.group);
  group.add(hinge);
  if (shadow) {
    const sh = contactShadow(L.w * 1.25, L.depth * 1.3);
    sh.position.y = -L.base / 2 - 0.004;
    group.add(sh);
  }
  const setOpen = (t) => { hinge.rotation.x = Math.PI / 2 + (-0.28 - Math.PI / 2) * t; };
  setOpen(1);
  return { group, screen: s.group, mix: s.mix, setOpen, size: { w: L.w, h: 2.2 } };
}
```

- [ ] **Step 4: Run the tests**

```bash
npm test
python -m pytest tests -q
```

Expected: all pass (the crop-agreement test is skipped until Task 11).

- [ ] **Step 5: Commit**

```bash
git add js/3d/textures.js js/3d/devices.js tests/js/devices.test.js design/build_3d_assets.py assets/3d/sb-*.webp tests/test_assets.py
git commit -m "A phone and a laptop built in code at real sizes; SignalBridge's screens and crops from the running app"
```

---

### Task 11: The SignalBridge chapter, the bridge

**Files:**
- Create: `js/3d/chapters/signalbridge-timeline.js`, `js/3d/chapters/signalbridge.js`, `tests/js/signalbridge-timeline.test.js`, `assets/3d/stills/signalbridge-desk.webp`, `assets/3d/stills/signalbridge-phone.webp`
- Modify: `js/home.js` (register the scene), `tests/test_assets.py` (remove the skip), `tests/browser/smoke.mjs`, `design/build_site.py` (alt text for the rendered still)

**Interfaces:**
- Consumes:
  - `makePhone`, `makeLaptop` and `PHONE` (devices.js)
  - `loadTexture`, `roundedRect` and `screenGeometry` (textures.js)
  - `fitScale`; `sectionProgress`, `clamp`, `lerp` and `Spring`
  - `KEY = 0.8` (home.js, used by pose mode and the smoke test)
- Produces:
  - **`signalbridge-timeline.js`:** `sbState(p) -> {arrive, lid, beam, lift, toGate, cardIn, consent, toLaptop, cardOut, brief, phoneAfter}`. Every field is in 0..1, and every one is 1 at p = 0.8.
  - **`signalbridge.js`:** `export const MESSAGE_BOX = [285, 240, 1122, 510]` and `mount(stage, section) -> part`

- [ ] **Step 1: Write the failing timeline test**

`tests/js/signalbridge-timeline.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { sbState } from '../../js/3d/chapters/signalbridge-timeline.js';

test('nothing has happened at the start of the chapter', () => {
  for (const [k, v] of Object.entries(sbState(0))) assert.equal(v, 0, k);
});

test('everything has happened by the payoff pose (0.8), so the still and a resting visitor see it all', () => {
  for (const [k, v] of Object.entries(sbState(0.8))) assert.equal(v, 1, k);
});

test('every part only moves forward as the visitor scrolls on', () => {
  let prev = sbState(0);
  for (let i = 1; i <= 100; i++) {
    const s = sbState(i / 100);
    for (const k of Object.keys(s)) assert.ok(s[k] >= prev[k] - 1e-12, `${k} at ${i / 100}`);
    prev = s;
  }
});

test('the message reaches the consent card before it turns, and the laptop after', () => {
  const at = (p) => sbState(p);
  assert.equal(at(0.47).toGate, 1);
  assert.equal(at(0.47).consent, 0);
  assert.equal(at(0.55).consent, 1);
  assert.equal(at(0.55).toLaptop, 0);
  assert.equal(at(0.66).toLaptop, 1);
});
```

Run: `npm test`
Expected: FAIL, `Cannot find module .../signalbridge-timeline.js`.

- [ ] **Step 2: Write the timeline**

`js/3d/chapters/signalbridge-timeline.js`:

```js
// The SignalBridge chapter's choreography, as a function of how far through it the visitor has scrolled
// (0..1). The beats of the words are in js/home.js: the line from 0.25, the result and link from 0.6.
import { ramp, easeOut, easeInOut } from '../../lib/motion.js';

export function sbState(p) {
  return {
    arrive: easeOut(ramp(p, 0, 0.22)),        // the phone and the laptop come in
    lid: easeInOut(ramp(p, 0.05, 0.25)),      // the laptop opens
    beam: easeInOut(ramp(p, 0.22, 0.48)),     // the line of light draws from the phone toward the laptop
    lift: easeInOut(ramp(p, 0.25, 0.33)),     // the youth's message lifts off the phone
    toGate: easeInOut(ramp(p, 0.33, 0.47)),   // and travels to the consent card
    cardIn: easeOut(ramp(p, 0.38, 0.46)),     // the consent card appears
    consent: easeInOut(ramp(p, 0.48, 0.55)),  // it turns: consent given
    toLaptop: easeInOut(ramp(p, 0.55, 0.66)), // the message goes on to the laptop
    cardOut: easeInOut(ramp(p, 0.58, 0.66)),  // the card folds away
    brief: ramp(p, 0.64, 0.7),                // the laptop shows the handoff brief
    phoneAfter: ramp(p, 0.53, 0.57),          // the phone shows "Worker notified"
  };
}
```

Run: `npm test`
Expected: all pass.

- [ ] **Step 3: Write the scene**

`js/3d/chapters/signalbridge.js`:

```js
// 01 · SignalBridge: the bridge. The youth's phone and the worker's laptop stand apart. The scroll lifts the
// youth's real message off the phone, stops it at the real consent card, which turns to "Worker notified",
// and lands it on the laptop as the handoff brief. Every picture is a crop of the running app's screens.
import * as THREE from 'three';
import { makePhone, makeLaptop } from '../devices.js';
import { loadTexture, roundedRect, screenGeometry } from '../textures.js';
import { fitScale } from '../../lib/fit.js';
import { sectionProgress, clamp, lerp, Spring } from '../../lib/motion.js';
import { sbState } from './signalbridge-timeline.js';

export const MESSAGE_BOX = [285, 240, 1122, 510];   // must match design/build_3d_assets.py (tested)
const CAPTURE = { w: 1170, h: 2532 };
const TEAL = 0x2bc4bc;
// where things stand inside the chapter's box, in the set's own units
const SETS = {
  desk: { size: { w: 9.2, h: 4.8 }, phone: { x: -3.2, y: -0.1, s: 1.55, turn: 0.24 }, laptop: { x: 1.5, y: -0.35, s: 1.3, turn: -0.26 }, gate: { y: 1.25, z: 0.9 } },
  narrow: { size: { w: 4.6, h: 5.4 }, phone: { x: -1.25, y: -1.25, s: 1.05, turn: 0.2 }, laptop: { x: 0.45, y: 0.95, s: 0.95, turn: -0.2 }, gate: { y: 0.15, z: 0.9 } },
};

// a physical card: a thin dark slab with the crop printed on its face (and another on its back)
function card(w, h, front, back) {
  const r = Math.min(w, h) * 0.18;
  const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth: 0.02, bevelEnabled: false, curveSegments: 10 }),
    new THREE.MeshStandardMaterial({ color: 0x101a19, roughness: 0.6, metalness: 0.1 }));
  slab.position.z = -0.01;
  const face = (map, z, turned) => {
    const m = new THREE.Mesh(screenGeometry(w, h, r), new THREE.MeshStandardMaterial({ map, roughness: 0.45, metalness: 0, transparent: true }));
    m.position.z = z;
    if (turned) m.rotation.y = Math.PI;
    return m;
  };
  const g = new THREE.Group();
  g.add(slab, face(front, 0.011, false));
  if (back) g.add(face(back, -0.011, true));
  return g;
}

const bez = (a, c, b, t) => new THREE.Vector3()
  .addScaledVector(a, (1 - t) ** 2).addScaledVector(c, 2 * (1 - t) * t).addScaledVector(b, t * t);

export async function mount(stage, section) {
  const box = section.querySelector('[data-anchor]');
  const names = ['sb-phone-consent', 'sb-phone-notified', 'sb-laptop-handoffs', 'sb-laptop-brief', 'sb-message', 'sb-consent-ask', 'sb-consent-given'];
  const [consentScreen, notified, handoffs, brief, messageTex, ask, given] = await Promise.all(names.map((n) => loadTexture(`assets/3d/${n}.webp`)));

  const phone = makePhone({ screen: consentScreen, after: notified });
  const laptop = makeLaptop({ screen: handoffs, after: brief });
  const set = new THREE.Group();
  set.add(phone.group, laptop.group);
  stage.scene.add(set);
  const rim = new THREE.DirectionalLight(TEAL, 1.1);   // the project colour, as light on the edges only
  rim.position.set(8, 4, -6);
  stage.scene.add(rim);

  // the message: as wide on the phone's screen as the bubble is in the capture
  const msgW = phone.screenSize.w * ((MESSAGE_BOX[2] - MESSAGE_BOX[0]) / CAPTURE.w);
  const msgH = msgW * ((MESSAGE_BOX[3] - MESSAGE_BOX[1]) / (MESSAGE_BOX[2] - MESSAGE_BOX[0]));
  const message = card(msgW, msgH, messageTex);
  const bubbleLocal = new THREE.Vector3(
    ((MESSAGE_BOX[0] + MESSAGE_BOX[2]) / 2 / CAPTURE.w - 0.5) * phone.screenSize.w,
    (0.5 - (MESSAGE_BOX[1] + MESSAGE_BOX[3]) / 2 / CAPTURE.h) * phone.screenSize.h, 0.01);
  const consent = card(1.9, 1.9 * (213 / 1074), ask, given);
  set.add(message, consent);

  const narrow = matchMedia('(max-width: 860px)');
  let layout = SETS[narrow.matches ? 'narrow' : 'desk'];
  let beam = null;
  const leanX = new Spring(0, { stiffness: 90, damping: 19 });
  const leanY = new Spring(0, { stiffness: 90, damping: 19 });

  function place(st) {
    const L = layout;
    const a = 1 - st.arrive;
    phone.group.position.set(L.phone.x - 3.5 * a, L.phone.y, -1.5 * a);
    phone.group.scale.setScalar(L.phone.s);
    phone.group.rotation.set(0.12, lerp(0.9, L.phone.turn, st.arrive), 0);
    laptop.group.position.set(L.laptop.x + 4 * a, L.laptop.y, -1.5 * a);
    laptop.group.scale.setScalar(L.laptop.s);
    laptop.group.rotation.set(0.3, lerp(-0.8, L.laptop.turn, st.arrive), 0);
    laptop.setOpen(st.lid);
    set.updateMatrixWorld(true);
  }
  // the three points of the journey, in the set's own space
  function points() {
    const S = set.worldToLocal(phone.screen.localToWorld(bubbleLocal.clone()));
    const E = set.worldToLocal(laptop.screen.localToWorld(new THREE.Vector3(0, 0, 0.02)));
    const G = S.clone().add(E).multiplyScalar(0.5).add(new THREE.Vector3(0, layout.gate.y, layout.gate.z));
    return { S, S1: S.clone().add(new THREE.Vector3(0, 0, 0.45)), G, E };
  }
  // the line of light, built once the devices stand in their final places
  function buildBeam() {
    if (beam) { set.remove(beam); beam.geometry.dispose(); }
    place(sbState(1));
    const { S1, G, E } = points();
    const curve = new THREE.CatmullRomCurve3([S1, G, E]);
    beam = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.012, 6, false),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.45, depthWrite: false }));
    set.add(beam);
  }
  buildBeam();
  narrow.addEventListener('change', () => { layout = SETS[narrow.matches ? 'narrow' : 'desk']; buildBeam(); stage.invalidate(); });

  return {
    update(now, dt) {
      const r = section.getBoundingClientRect();
      const vh = stage.view.h;
      const visible = r.bottom > -0.2 * vh && r.top < 1.2 * vh;
      set.visible = visible;
      rim.visible = visible;
      if (!visible) return false;

      const st = sbState(sectionProgress(r.top, r.height, vh));
      const w = stage.boxToWorld(box);
      set.scale.setScalar(fitScale(layout.size, w));
      set.position.set(w.x, w.y, 0);
      const P = stage.pointer;
      const mouse = P.inside && P.type === 'mouse';
      leanY.target = mouse ? P.nx * 0.05 : 0;
      leanX.target = mouse ? -P.ny * 0.04 : 0;
      let busy = leanX.step(dt);
      busy = leanY.step(dt) || busy;
      const away = clamp((vh - r.bottom) / (0.6 * vh));       // after the pin: the devices turn away
      set.rotation.set(leanX.value, leanY.value + away * 0.5, 0);

      place(st);
      phone.mix(st.phoneAfter);
      laptop.mix(st.brief);
      const ix = beam.geometry.index.count;
      beam.geometry.setDrawRange(0, Math.floor((ix * st.beam) / 3) * 3);
      beam.visible = st.beam > 0;

      const { S, S1, G, E } = points();
      message.visible = st.lift > 0 && st.toLaptop < 1;
      if (message.visible) {
        const pos = st.toGate < 1
          ? bez(S.clone().lerp(S1, st.lift), S1.clone().lerp(G, 0.5).add(new THREE.Vector3(0, 0.5, 0.3)), G, st.toGate)
          : bez(G, G.clone().lerp(E, 0.5).add(new THREE.Vector3(0, 0.4, 0.5)), E, st.toLaptop);
        message.position.copy(pos);
        message.scale.setScalar(layout.phone.s * lerp(lerp(1, 1.25, st.lift), 0.55, st.toLaptop));
        message.rotation.set(0, lerp(lerp(layout.phone.turn, 0, st.lift), layout.laptop.turn, st.toLaptop), 0);
      }
      const cs = st.cardIn * (1 - st.cardOut);
      consent.visible = cs > 0.001;
      consent.position.copy(G);
      consent.scale.setScalar(Math.max(cs, 0.001));
      consent.rotation.set(0, Math.PI * st.consent, 0);
      return busy;
    },
  };
}
```

In `js/home.js`, add `signalbridge: () => import('./3d/chapters/signalbridge.js'),` to `SCENES`. In `tests/test_assets.py`, delete the `skipif` you added to `test_the_scene_and_the_builder_agree_on_the_message_crop`.

- [ ] **Step 4: Look at the chapter at each beat, and tune it to the craft rules**

```bash
python design/build_site.py
for p in 0.05 0.2 0.3 0.42 0.52 0.62 0.8; do node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/sb-$p.png --at=signalbridge:$p; done
node tests/browser/shot.mjs --out=../portfolio-tools/shots3d/sb-phone-0.8.png --at=signalbridge:0.8 --size=390x844
```

Open every PNG with the Read tool and check each beat:

| Progress | What should show |
|---|---|
| 0.05 | Both devices are arriving from the sides, and the laptop lid is mostly shut |
| 0.2 | The lid is open, and the screens are readable as real app screens |
| 0.3 | The message card has lifted off the phone exactly where the bubble is on the screen |
| 0.42 | The message is travelling up along the thin teal line, and the consent card is appearing |
| 0.52 | The card is mid-turn: "Let your worker see…" turning to "Worker notified" |
| 0.62 | The message is shrinking into the laptop's screen |
| 0.8 | The phone shows "Worker notified", the laptop shows the handoff brief, the line is complete, and the information block is fully visible |

Then check the craft rules on every frame: the line is thin, not a glowing tube; teal shows only on edges; the devices have soft contact shadows; the aluminium reads as metal; nothing floats without a shadow.

If the message does not start over the bubble, the screen's UV orientation is flipped: check `screenGeometry` and that `bubbleLocal.y` is positive (near the top of the phone). If the phone layout at 390 px overlaps the information, adjust `SETS.narrow` positions. If anything glows, lower that material's opacity or intensity.

- [ ] **Step 5: Render the SignalBridge stills and give them their words**

```bash
npm run stills -- signalbridge
```

Expected: `wrote signalbridge-desk.webp` and `signalbridge-phone.webp` with no errors. Open both with the Read tool: the key pose (phone notified, laptop brief, line complete), transparent around the devices.

In `design/build_site.py`, the chapter's still alt currently comes from `MEDIA[c['still']]['alt']`, which describes the old card picture. Add `alt=` to the SignalBridge entry in `CHAPTERS`:

```python
    dict(pid='sb', num='01', side='left', result='Champion · Dell InnovateDash 2026',
         font='Name SignalBridge', still='signalbridge-card',
         alt='SignalBridge on a phone and a laptop: the youth’s SafeNight chat showing Worker notified, '
             'and the worker’s handoff brief for Mira Tan, a fictional youth.'),
```

In `chapter()`, change `still_picture(p['slug'], MEDIA[c['still']]['alt'])` to `still_picture(p['slug'], c.get('alt') or MEDIA[c['still']]['alt'])`. Then rebuild: `python design/build_site.py`.

- [ ] **Step 6: Add the browser scenario**

In `tests/browser/smoke.mjs`, add above the run block:

```js
scenario('SignalBridge comes alive, and its payoff shows everything', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => {
    const s = document.querySelector('[data-scene="signalbridge"]');
    scrollTo({ top: s.getBoundingClientRect().top + scrollY + 0.8 * (s.offsetHeight - innerHeight), behavior: 'instant' });
  });
  await page.waitForSelector('[data-scene="signalbridge"] [data-anchor][data-live]', { timeout: 30000 });
  await sleep(500);
  check(await infoVisible(page, 'sb'), 'SignalBridge information fully visible at the payoff');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});
```

- [ ] **Step 7: Run everything**

```bash
npm test
python -m pytest tests -q
python design/check_site.py .
npm run smoke
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add js/3d/chapters js/home.js tests/js/signalbridge-timeline.test.js tests/test_assets.py tests/browser/smoke.mjs assets/3d/stills design/build_site.py ./*.html
git commit -m "SignalBridge: the youth's message crosses to the worker, stopping for consent on the way"
```

---

### Task 12: Speed, fallbacks, docs, and the review package

**Files:**
- Create: `tests/browser/perf.mjs`, `tests/browser/firstpaint.mjs`, `tests/browser/review.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: measured numbers for the review, the README describing the new homepage (part 1), and screenshots plus a scroll recording in `../portfolio-tools/review-gate/` (outside the repo).

- [ ] **Step 1: Write the smoothness check**

`tests/browser/perf.mjs`:

```js
// Smoothness: scrolls the homepage top to bottom with the CPU slowed 4x and counts slow frames (over 33 ms).
// Uses the real GPU, so a Chrome window opens. Serve the site on :8000, then: npm run perf -- desk|phone
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:8000/';
const form = process.argv[2] || 'desk';
const [w, h, dpr, mobile] = form === 'phone' ? [390, 844, 3, true] : [1440, 900, 1, false];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, defaultViewport: null, args: [`--window-size=${w + 40},${h + 160}`] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle0' });
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluate(() => {
  window.__dt = [];
  let last = performance.now();
  const tick = (t) => { window.__dt.push(t - last); last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let y = 0; y < total; y += 100) {
  await page.evaluate(() => scrollBy(0, 100));
  await new Promise((r) => setTimeout(r, 40));
}
const dts = await page.evaluate(() => window.__dt.slice(10));
const slow = dts.filter((d) => d > 33).length;
const frozen = await page.evaluate(() => document.documentElement.classList.contains('frozen'));
const pct = (100 * slow) / dts.length;
console.log(`${form}: ${dts.length} frames, ${slow} slow (${pct.toFixed(1)}%)${frozen ? ', and it switched to stills' : ''}`);
await browser.close();
process.exit(pct < 5 || frozen ? 0 : 1);
```

Run: `npm run perf -- desk` then `npm run perf -- phone`
Expected: each prints a line and exits 0, either under 5% slow frames or `switched to stills`. Write both lines down for the review. If the desk run fails, profile the slowest scene in Chrome's Performance panel (shot.mjs at that scene), reduce its cost (fewer segments, a smaller texture, a lower `maxDpr`), and rerun.

- [ ] **Step 2: Compare the first paint with today's site**

`tests/browser/firstpaint.mjs`:

```js
// First paint (largest contentful paint) of this branch (:8000) and of main (:8001), each five times cold,
// with a 4x slower CPU and a slow 4G connection. Serve main from a worktree on :8001 first (see the plan).
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function lcp(url) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.evaluateOnNewDocument(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto(url, { waitUntil: 'networkidle0' });
  const v = await page.evaluate(() => window.__lcp);
  await ctx.close();
  return v;
}
const median = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
const runs = async (url) => { const out = []; for (let i = 0; i < 5; i++) out.push(await lcp(url)); return median(out); };
const branch = await runs('http://localhost:8000/');
const main = await runs('http://localhost:8001/');
console.log(`first paint (LCP, median of 5): this branch ${branch.toFixed(0)} ms, main ${main.toFixed(0)} ms`);
await browser.close();
process.exit(branch <= main + 50 ? 0 : 1);
```

```bash
git worktree add ../portfolio-main main
```

In a third terminal: `python -m http.server 8001 --bind 127.0.0.1 --directory ../portfolio-main`.

```bash
node tests/browser/firstpaint.mjs
```

Expected: exit 0, with this branch's first paint no later than main's plus 50 ms. Write the line down for the review. If it is later, check the hero still's size (`assets/3d/stills/hero-*.webp`) and that it is `fetchpriority="high"`. Then remove the worktree: `git worktree remove ../portfolio-main`.

- [ ] **Step 3: Update the README**

In `README.md`, replace the paragraph that begins `The homepage is short and leads with the work:` and the bullets for **Header**, **Results**, **The spin board** and **Projects** with:

```markdown
The homepage reads like a product page: the name, then five projects one by one, then Awards, About and the ending board. It has very few words; every one of them is listed in `docs/superpowers/specs/2026-10-11-3d-homepage-design.md`.

- **Header** is sticky on every page, with Work, Awards and About. On the homepage the gold MRUTHULAN logo is hidden while the name fills the screen and appears once you scroll past it.
- **Hero**: the name as a 3D split-flap board (MRUTHULAN in gold, SENTHIL NATHAN in white; three rows on phones), then LinkedIn, GitHub and Résumé. The board leans toward the mouse with a warm glint under the pointer, a flap flickers under the mouse and lands back, a press ripples the whole name, and scrolling on tilts it back and away. The page paints a still of the board rendered from the same scene (`assets/3d/stills/`), and the live board takes over from it unseen.
- **Five projects.**: the title moves with the scroll while gold dust streams past, as if the page carries you forward.
- **Chapters** (`#work`, `#work-<id>`): SignalBridge, Boss Breaker, Better Call Bhai, MEANT, KnowCad. Each holds the screen for about one and a half screens of scrolling: the name arrives first (in the project's own typeface, `assets/fonts/name-*.woff2`), then the one line, then the result and Case study. When scrolling stops near a chapter's payoff ahead, the page glides onto it (never back). A rail on the side marks the chapter you are in. SignalBridge is the bridge: the youth's real message lifts off the phone, stops at the real consent card, which turns to "Worker notified", and lands on the laptop as the handoff brief. The other four show their pictures until their own 3D is built.
```

Replace the **About** and **Let's talk** bullets with:

```markdown
- **About**: the portrait and three facts: Study, Leadership, Stack.
- **Ending** (`#contact`): a flap board, OPEN TO A SWE INTERNSHIP / 2027/28, then "Reach out" with Gmail, LinkedIn and GitHub, and the address with a Copy button.
```

In the **Motion** section, add this paragraph at its start:

```markdown
The 3D is one fixed three.js canvas behind the page (`js/3d/stage.js`): the page lays out every box, and the 3D fills them, so the stills line up with the live frames. It draws only when something changes. It runs only with WebGL 2, without reduced motion or Save-Data, and on devices with at least 4 GB of memory; otherwise, without JavaScript, or if frames stay slow while scrolling, every 3D box shows its still. `?mode=stills` and `?mode=3d` force either.
```

In **Editing and rebuilding**, add after the `python design/build_site.py` paragraph:

````markdown
The 3D's pieces are made by scripts:

```
python design/build_3d_assets.py     # screen textures and crops from the real captures → assets/3d/
python design/build_name_fonts.py    # each project's name font → assets/fonts/name-*.woff2
npm run stills -- hero signalbridge  # stills rendered from the live scenes (serve the site on :8000 first)
```

Tests: `npm install` and `python -m pip install -r design/requirements-dev.txt` once, then `npm test` (pure logic), `python -m pytest tests -q` (what the generator writes; build first), and `npm run smoke` (the page in a browser; serve on :8000). `npm run perf -- desk|phone` checks smoothness.
````

Then check: `grep -n "spin\|Spin" README.md`
Expected: no matches outside the Analytics list; delete `` `spin_result` (the project it landed on, when the visitor spins), `` from that list.

- [ ] **Step 4: Make the review package**

`tests/browser/review.mjs`:

```js
// The review package: screenshots of each moment and a scroll recording, desk and phone, saved outside the
// repository in ../portfolio-tools/review-gate/. Serve the site on :8000 first.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = '../portfolio-tools/review-gate/';
fs.mkdirSync(`${OUT}frames`, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] });
const MOMENTS = [['hero', 0], ['fly', 0.5], ['signalbridge', 0.05], ['signalbridge', 0.3], ['signalbridge', 0.45], ['signalbridge', 0.53], ['signalbridge', 0.8]];
const goTo = (page, scene, p) => page.evaluate((scene, p) => {
  const s = document.querySelector(`[data-scene="${scene}"]`);
  scrollTo({ top: s.getBoundingClientRect().top + scrollY + p * Math.max(0, s.offsetHeight - innerHeight), behavior: 'instant' });
}, scene, p);
for (const [form, w, h] of [['desk', 1440, 900], ['phone', 390, 844]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('mruthulan-analytics-choice', 'deny'); } catch {} });
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => dispatchEvent(new PointerEvent('pointerdown')));   // hold off the snap
  for (const [scene, p] of MOMENTS) {
    await goTo(page, scene, p);
    await new Promise((r) => setTimeout(r, 1800));
    await page.screenshot({ path: `${OUT}${form}-${scene}-${p}.png` });
  }
  // the scroll recording: 48 frames from the top to SignalBridge's payoff
  const end = await page.evaluate(() => { const s = document.querySelector('[data-scene="signalbridge"]'); return s.getBoundingClientRect().top + scrollY + 0.8 * (s.offsetHeight - innerHeight); });
  for (let i = 0; i < 48; i++) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), (end * i) / 47);
    await new Promise((r) => setTimeout(r, 350));
    await page.screenshot({ path: `${OUT}frames/${form}-${String(i).padStart(2, '0')}.png` });
  }
  await page.close();
}
await browser.close();
console.log('wrote', OUT);
```

```bash
node tests/browser/review.mjs
python - <<'EOF'
from pathlib import Path
from PIL import Image
out = Path('../portfolio-tools/review-gate')
for form in ('desk', 'phone'):
    frames = [Image.open(p).convert('RGB') for p in sorted((out / 'frames').glob(f'{form}-*.png'))]
    if form == 'desk':
        frames = [f.resize((960, 600), Image.LANCZOS) for f in frames]
    frames[0].save(out / f'scroll-{form}.webp', save_all=True, append_images=frames[1:], duration=90, loop=0, quality=80)
    print('wrote', out / f'scroll-{form}.webp')
EOF
```

Expected: 14 PNGs and two animated WebPs in `../portfolio-tools/review-gate/`. Open the desk PNGs with the Read tool to confirm they captured what they name.

- [ ] **Step 5: Check the code budget, run every check, then commit**

Append to `tests/test_site.py` (the spec's budget: three.js plus the site's own 3D code at most about 260 KB compressed; GitHub Pages serves gzip):

```python
def test_3d_code_fits_the_budget():
    import gzip
    files = [f for f in (ROOT / 'js').rglob('*.js') if f.name not in ('script.js', 'analytics.js')]
    total = sum(len(gzip.compress(f.read_bytes(), 9)) for f in files)
    assert total <= 260_000, total
```

```bash
npm test
python design/build_site.py
python -m pytest tests -q
python design/check_site.py --unchanged
python design/check_site.py .
npm run smoke
git add tests/browser/perf.mjs tests/browser/firstpaint.mjs tests/browser/review.mjs tests/test_site.py README.md ./*.html
git commit -m "Speed and first-paint checks, the review package, and the README for the new homepage"
```

Note: `check_site.py --unchanged` compares against `HEAD`, so run it after the commit too. It must report that the committed pages match the generator.

- [ ] **Step 6: Stop at the review gate**

Do not start Part 2. Send Mruthulan the review package with SendUserFile:
- `scroll-desk.webp`
- `scroll-phone.webp`
- `desk-hero-0.png`
- `desk-signalbridge-0.45.png`
- `desk-signalbridge-0.8.png`
- `phone-signalbridge-0.8.png`

With the files, include:
- the perf and first-paint numbers from Steps 1 and 2
- what you noticed about the dust in Task 9
- the reference sites again ([Apple AirPods Pro](https://www.apple.com/airpods-pro/), [landonorris.com](https://landonorris.com), [lusion.co](https://lusion.co), [linear.app](https://linear.app))

Then ask three things:
1. Does it look like it belongs with those sites, or like slop?
2. Should the gold dust stay?
3. Are you ready for chapters 02–05, or do we fix something first, or start fresh?

Do not push or open a pull request until Mruthulan asks.
````

