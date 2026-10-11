# Homepage v3 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry out Mruthulan's second review of the v2 homepage:
- clean, crisp rooms with no screenshot edges
- KnowCad's real story (a support rep's desk)
- a gallery wall for Awards with a smooth photo slide
- sharper images throughout
- new About words

**Architecture:**
- Same one-world three.js homepage as v2. Scene modules keep the `mount(ctx) → { group, update, dispose, debug, warm }` contract.
- `design/build_3d_assets.py` draws every crisp element with Pillow, from the apps' real words, using the site's own fonts and MEANT's Inter. Pure, tested helpers carry the new motion:
  - `glidePose`
  - `handPose`
  - `slidePose`
  - the new `kcState`
- The press glide is a small camera override in `world.js`. The site's existing cross-document view transition (since August, `css/styles.css:382`) carries the fade into the article.

**Tech Stack:**
- three.js 0.186.1 (vendored, import map) and Lenis 1.3.26
- Python 3 with Pillow and fontTools for assets
- node:test, pytest, puppeteer-core smoke in SwiftShader, headful perf

**Spec:** `docs/superpowers/specs/2026-10-11-homepage-v3-polish-design.md` (builds on `docs/superpowers/specs/2026-10-11-3d-homepage-v2-design.md`)

## Global Constraints

- **Credit:** commits are credited to Mruthulan only. No `Co-Authored-By` lines and no Claude authorship.
- **No entrance animations:** nothing moves on page load. Motion comes only from scroll, pointer or press.
- **Banned captures:** never use `d-worker-cockpit.png` or `d-cockpit.png` (they show a Telegram chat ID and a Discord webhook field).
- **Phone number:** never published.
- **Raw captures:** the files in `../portfolio-tools/card-shots/raw` are never published. Only derived WebP in `assets/3d/`.
- **Generated HTML:** never edit it. Edit `design/build_site.py` and run `python design/build_site.py`.
- **Writing:**
  - captions must not sound AI-written
  - banned words: innovative, seamless, cutting-edge, passionate, empower, leverage, elevate, journey, crafted, unlock, robust, delve
  - KnowCad on the homepage: no "private" label and no claim about who built what
- **Lighting:** the fixed rig stays. Never add or remove a light; glows are additive planes.
- **Texture budget:** at most 600 KB per chapter prefix (`sb`, `bx`, `bb`, `mt`, `kc`). Awards (`aw`), a page section, gets 1,000 KB (see the plan rulings below).
- **Perf limits:**
  - slow frames under 5%
  - longest frame at most 100 ms
  - wheel jerk p99 at most 41 px (desk)
  - 0 frames out of sync
- **No push or PR** until Mruthulan asks.
- **People:** refer to Mruthulan by name or as they/them.
- **The press:** the newspaper glide is about 0.6 s. With reduced motion, or a new-tab click, the browser follows the link at once.

## Plan rulings (deviations from the spec, decided here)

- **The site already fades between pages.** The spec says only the press navigation fades. In fact `css/styles.css:381` has had `@view-transition{navigation:auto}` site-wide (under `prefers-reduced-motion: no-preference`) since August, with project titles morphing into case pages. This plan keeps it; changing it would remove an existing feature. The press glide simply ends in that crossfade. So no `pageswap` skipping and no "no other link fades" test.
- **The dragon portrait stays at its source size.** The spec asks for twice its current size, but `DRAGON_BOX` is 184×244 at the capture's 2× already, and nothing larger exists.
- **The Awards budget is 1,000 KB.** The spec says full resolution. Seven photos at up to 1400 px and quality 80 come to about 800–900 KB, so the 600 KB chapter budget can't hold them.
- **Drawn text fonts:**
  - MEANT's replies use MEANT's own Inter 600.
  - Better Call Bhai uses Geist 600. The app's DM Sans isn't available locally, and Geist is the site's own sans.
  - Boss Breaker and KnowCad use Geist, with JetBrains Mono for KnowCad's source tags.
- **Better Call Bhai's capture still matters.** `bb-slots` (the screenshot crop) is deleted, but `SLOT_GRID` and `PILL` still place each pill where its slot sits on the phone capture, so the lift-off starts in the right place.

## Review Focus

These five failure modes are the most likely to bite a visitor, and the tasks' main tests don't reach them. Each has its own test in the owning task.

1. **Back after the newspaper glide** (back/forward cache): the camera must be back on the scroll's pose, not stuck at the paper. *Test: Task 3, "after coming back from the article".*
2. **Ctrl-, ⌘- or shift-click on *Featured in Tamil Murasu*:** the browser opens the link its own way and no glide starts. *Test: Task 3.*
3. **Next photo pressed several times quickly:** the 3D front photo ends on the gallery's own `data-on` photo. *Test: Task 6.*
4. **A swipe that starts on a KnowCad source page** doesn't toggle it. Taps only. *Test: Task 5.*
5. **At 390 px:** every changed chapter goes live without errors. *Test: Task 8.*

---

### Task 1: The sharpness pass and SignalBridge's screen swap

**Files:**
- Modify: `design/build_3d_assets.py`
  - the imports, `save()`, a new `sharpen()`, the constants, and `main()`'s SignalBridge, Boss Breaker and Awards parts
- Modify: `js/3d/chapters/signalbridge.js:27`
- Modify: `js/3d/chapters/boss-breaker.js:14-47` (the display), `:130-132` (debug)
- Modify: `js/3d/paths.js:28-34` (the Boss Breaker keys)
- Delete: `assets/3d/sb-wall-preview.webp`
- Test: `tests/test_assets.py`, `tests/browser/smoke.mjs`

**Interfaces:**
- Produces:
  - `build_3d_assets.sharpen(im) -> Image`
  - `save(im, name, quality=84)`
  - `DISPLAY_CROP = (100, 0, 2780, 1120)`, also exported from `boss-breaker.js` as `export const DISPLAY_CROP = [100, 0, 2780, 1120]`
  - `AWARD_WIDTH = 1400`
  - Boss Breaker `debug.anchors.screenLeft` and `debug.anchors.screenRight` (Vector3, world)
  - texture `sb-wall-handoffs`

- [ ] **Step 1: Write the failing asset tests**

In `tests/test_assets.py`, replace the `SB_WALL` dict and the budget test, and add new tests after `test_signalbridge_crops_leave_out_the_teammates_name_and_the_dev_badge`:

```python
SB_WALL = {'sb-wall-radar': (1280, 800), 'sb-wall-cases': (1280, 800), 'sb-wall-chat': (1280, 800),
           'sb-wall-supervisor': (1280, 800), 'sb-wall-handoffs': (1280, 800), 'sb-phone-preview': (768, 1662)}
```

```python
def test_no_signalbridge_wall_screen_is_light():
    """The youth app's preview is white cards; in a dark control room it glares. Every wall screen is dark."""
    from PIL import Image, ImageStat
    walls = sorted((ROOT / 'assets' / '3d').glob('sb-wall-*.webp'))
    assert [p.name for p in walls] == ['sb-wall-cases.webp', 'sb-wall-chat.webp', 'sb-wall-handoffs.webp',
                                       'sb-wall-radar.webp', 'sb-wall-supervisor.webp']
    for p in walls:
        with Image.open(p) as im:
            assert ImageStat.Stat(im.convert('L')).mean[0] < 70, p.name


MIN_WIDTH = {'bx-display': 2048, 'bx-leaderboard': 1271, 'bx-phone': 1024}


@pytest.mark.parametrize('name,width', MIN_WIDTH.items())
def test_sharp_textures_are_wide_enough(name, width):
    from PIL import Image
    with Image.open(ROOT / 'assets' / '3d' / f'{name}.webp') as im:
        assert im.width >= width, im.size


def test_award_photos_are_at_their_full_resolution():
    from PIL import Image
    import build_3d_assets as b
    for key in b.AWARD_PHOTOS:
        with Image.open(ROOT / 'assets' / 'media' / f'{key}.webp') as src, \
             Image.open(ROOT / 'assets' / '3d' / f'aw-{key}.webp') as out:
            assert out.width == min(src.width, b.AWARD_WIDTH), (key, out.size, src.size)


def test_the_boss_breaker_scene_and_the_builder_agree_on_the_display_crop():
    import build_3d_assets as b
    js = (ROOT / 'js' / '3d' / 'chapters' / 'boss-breaker.js').read_text(encoding='utf-8')
    m = re.search(r'DISPLAY_CROP = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.DISPLAY_CROP
    left, top, right, bottom = b.DISPLAY_CROP
    assert 0 <= left < right <= 2880 and 0 <= top < bottom <= 1800
```

Replace `test_each_chapter_fits_its_texture_budget` with:

```python
BUDGET = {'sb': 600_000, 'bx': 600_000, 'bb': 600_000, 'mt': 600_000, 'kc': 600_000, 'aw': 1_000_000}


@pytest.mark.parametrize('prefix,limit', BUDGET.items())
def test_each_chapter_fits_its_texture_budget(prefix, limit):
    assert chapter_bytes(prefix) <= limit, chapter_bytes(prefix)
```

- [ ] **Step 2: Run them and watch them fail**

Run: `python -m pytest tests/test_assets.py -q`

Expected: FAIL in these:
- `test_signalbridge_wall_textures_exist_within_their_sizes[sb-wall-handoffs]`
- `test_no_signalbridge_wall_screen_is_light`
- `test_sharp_textures_are_wide_enough` (all three)
- `test_award_photos_are_at_their_full_resolution`
- `test_the_boss_breaker_scene_and_the_builder_agree_on_the_display_crop` (`AttributeError: DISPLAY_CROP`)

- [ ] **Step 3: Write the failing smoke test**

In `tests/browser/smoke.mjs`, add this before the `/* ---- run */` block:

```js
scenario('Boss Breaker: the words never cover the big screen at the payoff', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  await sleep(600);
  const r = await page.evaluate(() => {
    const w = window.__world;
    const l = w.debugProject('boss-breaker', 'screenLeft'), rr = w.debugProject('boss-breaker', 'screenRight');
    const info = document.querySelector('[data-scene="boss-breaker"] .info').getBoundingClientRect();
    return l && rr ? { l: l.x, r: rr.x, info: info.left } : null;
  });
  check(r !== null, 'the big screen has anchors');
  if (r) {
    check(r.r <= r.info - 16, `the screen ends left of the words (${Math.round(r.r)} px, words at ${Math.round(r.info)} px)`);
    check(r.r - r.l >= 0.45 * 1440, `the screen is at least 45% of the width (${Math.round(r.r - r.l)} px)`);
    check(r.l >= -40, `the screen's left edge is on screen (${Math.round(r.l)} px)`);
  }
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});
```

Run: `ONLY="never cover the big screen" npm run smoke`

Expected: FAIL with `✗ the big screen has anchors`. The preview server "site" on :8000 must be running (`.claude/launch.json`).

- [ ] **Step 4: Change the asset builder**

In `design/build_3d_assets.py`:
- Change the Pillow import to `from PIL import Image, ImageDraw, ImageFilter`.
- Replace the Boss Breaker comment's last line and add `DISPLAY_CROP` right after `LEADER_BOX`:

```python
DISPLAY_CROP = (100, 0, 2780, 1120)   # the Boss Raid page's content (header, raid card, leaderboard), without the empty lower half
```

- Below `AWARD_PHOTOS`, add:

```python
AWARD_WIDTH = 1400                    # the photos at their source's full width (at most this), lightly sharpened
```

- Replace `save()` and add `sharpen()` above it:

```python
def sharpen(im):
    """A light unsharp mask: textures are drawn smaller than they are, and minifying softens edges."""
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))


def save(im, name, quality=84):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{name}.webp'
    im.save(path, 'WEBP', quality=quality, method=6)
    print(f'wrote {path.name:26} {im.size[0]:5} x {im.size[1]:<5} {path.stat().st_size:7} bytes')
```

- In `main()`, replace the control-room tuple list's preview entry: `('d-youth-preview', 'sb-wall-preview', DESK_CROP)` becomes `('d-worker-handoffs', 'sb-wall-handoffs', DESK_CROP)`.
- Replace the four `bx` lines for the display, phone, dragon and leaderboard with:

```python
    save(sharpen(fit_crop(bx / 'd-boss.png', DISPLAY_CROP, (2048, 2048))), 'bx-display')
    save(fit(bx / 'm-boss.png', (1024, 2216)), 'bx-phone')
    save(sized(crop(bx / 'd-boss.png', DRAGON_BOX, 22), 320), 'bx-dragon')   # already its source size (184 x 244)
    save(crop(bx / 'd-boss.png', LEADER_BOX, 26), 'bx-leaderboard')          # its source size, 1271 x 518
```

- Replace the award loop with:

```python
    for key in AWARD_PHOTOS:
        with Image.open(media / f'{key}.webp') as src:
            width = min(src.width, AWARD_WIDTH)
        save(sharpen(fit(media / f'{key}.webp', (width, width * 2))), f'aw-{key}', quality=80)
```

- Update the module docstring's control-room paragraph:
  - replace "Left out: d-worker-cockpit and d-cockpit (a Telegram chat ID and a Discord webhook field), d-worker-youths (a 404 page)." with "Left out: d-worker-cockpit and d-cockpit (a Telegram chat ID and a Discord webhook field), d-worker-youths (a 404 page), and d-youth-preview on the wall (the youth app's white cards glare in a dark room; the handoffs list stands there instead)."

- [ ] **Step 5: Point SignalBridge at the new screen, and give Boss Breaker its wider display**

`js/3d/chapters/signalbridge.js:27`: change `'sb-wall-preview'` to `'sb-wall-handoffs'`.

`js/3d/chapters/boss-breaker.js`: after `const DAMAGE = …;` add:

```js
// the big screen's crop of d-boss.png (the page's content, not its empty lower half): must match
// design/build_3d_assets.py (tested)
export const DISPLAY_CROP = [100, 0, 2780, 1120];
const DISPLAY = { w: 11, y: 3.5, z: -7 };
const DISPLAY_H = (DISPLAY.w * (DISPLAY_CROP[3] - DISPLAY_CROP[1])) / (DISPLAY_CROP[2] - DISPLAY_CROP[0]);
```

Replace the big-screen block (from `// the big screen on two posts` to `group.add(display.group, post(-3.6), post(3.6), displayShadow);`) with:

```js
  // the big screen on two posts
  const display = panel(tex['bx-display'], DISPLAY.w, DISPLAY_H);
  display.group.position.set(0, DISPLAY.y, DISPLAY.z);
  const postH = DISPLAY.y - DISPLAY_H / 2 - FLOOR;
  const post = (x) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, postH, 0.12), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.7 }));
    p.position.set(x, FLOOR + postH / 2, DISPLAY.z - 0.1);
    return p;
  };
  const displayShadow = contactShadow(DISPLAY.w + 0.4, 2.2, 0.6);
  displayShadow.position.set(0, FLOOR + 0.004, DISPLAY.z);
  group.add(display.group, post(-4.2), post(4.2), displayShadow);
```

Move the leaderboard and its bars toward the middle so they stay in frame when the camera moves right. In the `if (desk)` block, change:
- `makeMonitor(tex['bx-leaderboard'], 3.2, 960 / 391, -5.9, 1.9, -3.4, FLOOR)` to `makeMonitor(tex['bx-leaderboard'], 3.2, 1271 / 518, -3.9, 1.9, -3.4, FLOOR)`
- the bars' `m.position.set(-7.3 + i * 0.7, FLOOR, -2.0)` to `m.position.set(-5.2 + i * 0.7, FLOOR, -2.0)`

Replace the returned `debug: { fill: () => fill.scale.x },` with:

```js
    debug: {
      fill: () => fill.scale.x,
      anchors: {
        screenLeft: new THREE.Vector3(-DISPLAY.w / 2, DISPLAY.y, DISPLAY.z).add(origin),
        screenRight: new THREE.Vector3(DISPLAY.w / 2, DISPLAY.y, DISPLAY.z).add(origin),
      },
    },
```

- [ ] **Step 6: Move the payoff camera so the screen sits clear of the words**

`js/3d/paths.js`: replace the two Boss Breaker payoff keys (`t: 0.42` and `t: 0.6`) with this starting point:

```js
    { t: 0.42, at: [2.9, 3.0, -3.5], from: [0.1, 0.16, 1], w: 17.5, h: 10.8, stop: true, phone: { at: [0, 1.6, -3.5], w: 10, h: 14 } },
    { t: 0.6, at: [2.9, 3.0, -3.5], from: [0.1, 0.16, 1], w: 17.5, h: 10.8, stop: true, phone: { at: [0, 1.6, -3.5], w: 10, h: 14 } },
```

- [ ] **Step 7: Rebuild assets and pages, and run the asset tests**

Run:
```bash
python design/build_3d_assets.py
rm assets/3d/sb-wall-preview.webp
python design/build_site.py
python -m pytest tests/test_assets.py -q
```

Expected: PASS. If `test_no_signalbridge_wall_screen_is_light` fails on `sb-wall-handoffs`, print its mean (`python -I -c "from PIL import Image, ImageStat; print(ImageStat.Stat(Image.open('assets/3d/sb-wall-handoffs.webp').convert('L')).mean)"`). If it's 70 or more, use `d-supervisor` cropped to `(0, 900, 2880, 1500)` instead and ledger the change.

- [ ] **Step 8: Run the smoke test and tune the camera until it passes**

Run: `ONLY="never cover the big screen" npm run smoke`

Expected: PASS. If it fails:
- If the screen's right edge is too far right, raise the payoff `at[0]` in steps of 0.3.
- If the screen is under 45% of the width, lower `w` and `h` together in the ratio 17.5:10.8.

Re-run until it passes. Then take a look:

```bash
node tests/browser/shot.mjs --at=boss-breaker:0.5 --out=../portfolio-tools/shots3d/bx-payoff.png
```

Read the PNG. The health bar must be fully on screen, the leaderboard monitor at least half on screen, and the hand of cards visible. Adjust the leaderboard's x and the camera if not.

- [ ] **Step 9: Run the SignalBridge and Boss Breaker scenarios and the unit tests**

Run:
```bash
ONLY="SignalBridge" npm run smoke
ONLY="Boss Breaker" npm run smoke
npm test
```

Expected: all pass. `tests/js/paths.test.js` still holds: the payoff is held from 0.42 to 0.6, and the keys are in order.

- [ ] **Step 10: Commit**

```bash
git add -A design/build_3d_assets.py assets/3d js/3d/chapters/signalbridge.js js/3d/chapters/boss-breaker.js js/3d/paths.js tests/test_assets.py tests/browser/smoke.mjs *.html
git commit -m "Sharper screens and photos; SignalBridge's white preview screen swapped for the handoffs list; Boss Breaker's big screen clear of the words"
```

---

### Task 2: Better Call Bhai's time slots as 3D pills

**Files:**
- Modify: `design/build_3d_assets.py` (new constants, a `font()` helper, `slot_atlas()`, `main()`'s Better Call Bhai part)
- Modify: `js/3d/chapters/better-call-bhai.js:6-21` (imports and constants), `:59-62` (textures), `:115-134` (slots), `:179-205` (update), `:207-218` (dispose)
- Delete: `assets/3d/bb-slots.webp`
- Test: `tests/test_assets.py`, `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes: `save(im, name, quality=84)` (Task 1)
- Produces:
  - `build_3d_assets.font(name, size, weight=None) -> ImageFont`, where `name` is one of `'geist'`, `'mono'`, `'knowcad'` or `'inter-600'`
  - `build_3d_assets.wrap(text, ft, width) -> list[str]`
  - `SLOT_TIMES` (20 strings), `SLOT_TAKEN = (1, 4, 5, 9, 14)`, `SLOT_CHOSEN = 10`
  - texture `bb-times` (1280×640 RGBA, 4×5 cells of 320×128)
  - JS `export const TAKEN = [1, 4, 5, 9, 14];`
  - debug `lift(i)` and `anchors.slot0`

- [ ] **Step 1: Write the failing asset tests**

In `tests/test_assets.py`, replace `test_better_call_bhai_textures_exist_and_the_scene_agrees_on_the_slot_grid` with:

```python
def test_better_call_bhai_textures_exist_and_the_scene_agrees_on_the_slots():
    import build_3d_assets as b
    names = [f'bb-phone-{i}' for i in range(1, 5)] + ['bb-laptop', 'bb-times']
    assert [n for n in names if not (ROOT / 'assets' / '3d' / f'{n}.webp').exists()] == []
    assert not (ROOT / 'assets' / '3d' / 'bb-slots.webp').exists(), 'the screenshot crop is gone'
    left, top, right, bottom = b.SLOT_GRID
    assert 0 <= left < right <= 1170 and 0 <= top < bottom <= 2532
    js = (ROOT / 'js' / '3d' / 'chapters' / 'better-call-bhai.js').read_text(encoding='utf-8')
    m = re.search(r'SLOT_GRID = \[(\d+), (\d+), (\d+), (\d+)\]', js)
    assert m and tuple(map(int, m.groups())) == b.SLOT_GRID
    m = re.search(r'TAKEN = \[([\d, ]+)\]', js)
    assert m and tuple(int(x) for x in m.group(1).split(',')) == b.SLOT_TAKEN


def test_the_time_atlas_is_crisp_text_on_clear_ground():
    from PIL import Image
    import build_3d_assets as b
    with Image.open(ROOT / 'assets' / '3d' / 'bb-times.webp') as im:
        assert im.size == (1280, 640) and im.mode == 'RGBA'
        assert im.getpixel((2, 2))[3] == 0, 'the ground is clear'
        cell = im.crop((0, 0, 320, 128))          # 10:00, free: white text
        assert max(p[3] for p in cell.getdata()) == 255
    assert len(b.SLOT_TIMES) == 20 and b.SLOT_TIMES[b.SLOT_CHOSEN] == '15:00'
    assert [b.SLOT_TIMES[i] for i in b.SLOT_TAKEN] == ['10:30', '12:00', '12:30', '14:30', '17:00']
```

Run: `python -m pytest tests/test_assets.py -q -k "better_call_bhai or time_atlas"`

Expected: FAIL (`bb-times` is missing; `SLOT_TAKEN` isn't defined).

- [ ] **Step 2: Write the failing smoke test**

Add to `tests/browser/smoke.mjs`, before the run block:

```js
scenario('Better Call Bhai: a time slot lifts under the mouse and settles when it leaves', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="better-call-bhai"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="better-call-bhai"][data-live]', { timeout: 30000 });
  await sleep(600);
  const p = await page.evaluate(() => window.__world.debugProject('better-call-bhai', 'slot0'));
  check(p !== null, 'the 10:00 pill has an anchor');
  if (p) {
    const lift = () => page.evaluate(() => window.__world.mounted.get('better-call-bhai').debug.lift(0));
    await page.mouse.move(p.x, p.y);
    await page.waitForFunction(() => window.__world.mounted.get('better-call-bhai').debug.lift(0) > 0.5, { timeout: 5000 }).catch(() => {});
    check(await lift() > 0.5, `the 10:00 pill lifted (${(await lift()).toFixed(2)})`);
    await page.mouse.move(5, 890);
    await page.waitForFunction(() => window.__world.mounted.get('better-call-bhai').debug.lift(0) < 0.02, { timeout: 5000 }).catch(() => {});
    check(await lift() < 0.02, 'and settled back when the mouse left');
  }
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});
```

Run: `ONLY="time slot lifts" npm run smoke`

Expected: FAIL (`✗ the 10:00 pill has an anchor`).

- [ ] **Step 3: Add the font helper and draw the time atlas**

In `design/build_3d_assets.py`, add after `FONT_CACHE`:

```python
# Better Call Bhai's day, as in m3-slots.png: 20 slots, 3 across; taken ones struck through, 15:00 chosen
SLOT_TIMES = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
              '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
SLOT_TAKEN = (1, 4, 5, 9, 14)         # 10:30 12:00 12:30 14:30 17:00
SLOT_CHOSEN = 10                      # 15:00
SLOT_CELL = (320, 128)                # one pill's face in the atlas: twice its size on screen at the payoff
# fonts for drawn text: the site's own (variable) faces, and MEANT's Inter
FONT_FILES = {
    'geist': ROOT / 'assets' / 'fonts' / 'geist-latin.woff2',
    'mono': ROOT / 'assets' / 'fonts' / 'jetbrains-mono-400-500-latin.woff2',
    'knowcad': ROOT / 'assets' / 'fonts' / 'name-knowcad.woff2',
    'inter-600': MEANT_FONT.with_name('inter-latin-600-normal.woff2'),
}
```

Add after `inter()`:

```python
def font(name, size, weight=None):
    """One of FONT_FILES at `size` px (and `weight`, for the variable ones), converted once to TrueType."""
    from PIL import ImageFont
    src = FONT_FILES[name]
    ttf = FONT_CACHE.parent / f'{src.stem}.ttf'
    if not ttf.exists():
        from fontTools.ttLib import TTFont
        ttf.parent.mkdir(parents=True, exist_ok=True)
        f = TTFont(src)
        f.flavor = None
        f.save(ttf)
    ft = ImageFont.truetype(str(ttf), size)
    if weight is not None:
        ft.set_variation_by_axes([weight])
    return ft


def wrap(text, ft, width):
    """`text` broken into lines no wider than `width` px in `ft`."""
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if ft.getlength(trial) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def slot_atlas():
    """The day's times, crisp, in a 4 x 5 atlas for the 3D pills: white on the free ones, dimmed and struck
    through on the taken ones, dark on the chosen yellow 15:00."""
    W, H = SLOT_CELL
    im = Image.new('RGBA', (4 * W, 5 * H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ft = font('geist', 64, 600)
    for i, t in enumerate(SLOT_TIMES):
        cx, cy = (i % 4) * W + W / 2, (i // 4) * H + H / 2
        ink = (21, 21, 21, 255) if i == SLOT_CHOSEN else (255, 255, 255, 110) if i in SLOT_TAKEN else (255, 255, 255, 255)
        d.text((cx, cy), t, font=ft, fill=ink, anchor='mm')
        if i in SLOT_TAKEN:
            half = ft.getlength(t) / 2 + 8
            d.line((cx - half, cy + 2, cx + half, cy + 2), fill=(255, 255, 255, 140), width=5)
    return im
```

In `main()`, replace `save(fit_crop(bb / 'bcb-shots' / 'm3-slots.png', SLOT_GRID, (938, 1066)), 'bb-slots')` with `save(slot_atlas(), 'bb-times', quality=90)`.

- [ ] **Step 4: Build the pills in the scene**

In `js/3d/chapters/better-call-bhai.js`:
- change the textures import to `import { loadTexture, bez, glow, screenGeometry, cropUV, roundedRect, disposeTree, nextFrame } from '../textures.js';`
- change the motion import to `import { lerp, Spring } from '../../lib/motion.js';`
- after `const PILL = …;` add:

```js
export const TAKEN = [1, 4, 5, 9, 14];   // 10:30 12:00 12:30 14:30 17:00: must match design/build_3d_assets.py (tested)
const PILL3 = { w: 1, h: 0.4, d: 0.08 };   // a 3D pill, one unit wide (the time atlas's cells are 320 x 128)
const timeCell = (i) => [(i % 4) / 4, 1 - (Math.floor(i / 4) + 1) / 5, (i % 4 + 1) / 4, 1 - Math.floor(i / 4) / 5];
```

Change the top comment's sentence "the day's real time slots lift off the phone onto a wall behind it, the taken ones struck through and the chosen 15:00 lit, as in the app." to "the day's real time slots lift off the phone onto a wall behind it as rounded pills, the taken ones dimmed and struck through and the chosen 15:00 in the shop's yellow, as in the app; a pill lifts under the mouse."

In `mount`, change `'bb-slots'` in `names` to `'bb-times'`. Replace the whole slots block (from `// the time slots: each a crop of its pill…` to `group.add(chosen);`) with:

```js
  // the time slots: rounded pills, each starting where its slot sits on the phone's screen, its time drawn crisp
  const pillGeo = new THREE.ExtrudeGeometry(roundedRect(PILL3.w, PILL3.h, PILL3.h / 2 - 0.001),
    { depth: PILL3.d, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 16 });
  const mats = {
    free: new THREE.MeshStandardMaterial({ color: 0x24221d, roughness: 0.3, metalness: 0.25 }),
    taken: new THREE.MeshStandardMaterial({ color: 0x141310, roughness: 0.7, metalness: 0.1 }),
    chosen: new THREE.MeshStandardMaterial({ color: YELLOW, emissive: YELLOW, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.1 }),
  };
  const taken = new Set(TAKEN);
  const slots = [];
  for (let i = 0; i < PILL.n; i++) {
    const c = i % PILL.cols, r = Math.floor(i / PILL.cols);
    const left = PILL.x0 + c * PILL.px, topPx = PILL.y0 + r * PILL.py;
    const w = (PILL.w / CAPTURE.w) * sw, h = (PILL.h / CAPTURE.h) * sh;
    const pill = new THREE.Group();
    const body = new THREE.Mesh(pillGeo, i === PILL.chosen ? mats.chosen : taken.has(i) ? mats.taken : mats.free);
    body.position.z = -PILL3.d;   // the face at z = 0, the bevel just in front of it
    const face = new THREE.Mesh(cropUV(new THREE.PlaneGeometry(PILL3.w, PILL3.h), timeCell(i)),
      new THREE.MeshBasicMaterial({ map: tex['bb-times'], transparent: true, toneMapped: false, depthWrite: false }));
    face.position.z = 0.017;
    pill.add(body, face);
    pill.traverse((o) => { o.userData.slot = i; });
    const onPhone = new THREE.Vector3(((SLOT_GRID[0] + left + PILL.w / 2) / CAPTURE.w - 0.5) * sw, (0.5 - (SLOT_GRID[1] + topPx + PILL.h / 2) / CAPTURE.h) * sh, 0.01);
    const from = group.worldToLocal(toWorld(onPhone));
    const to = new THREE.Vector3(WALL.x + (c - 1) * w * WALL.scale * 1.12, WALL.y + (3 - r) * h * WALL.scale * 1.25, WALL.z);
    group.add(pill);
    slots.push({ m: pill, from, to, w, lift: new Spring(0, { stiffness: 170, damping: 18 }) });
  }
  const chosen = glow(YELLOW, 1.6, 0.8, 0.45);
  chosen.position.copy(slots[PILL.chosen].to).add(new THREE.Vector3(0, 0, -0.05));
  group.add(chosen);
```

After the pole listeners (`pin.addEventListener('pointercancel', onUp);`) add the hover:

```js
  // a pill lifts under the mouse (decorative)
  let hovered = -1;
  const pills = slots.map((s) => s.m);
  const onHover = (e) => {
    if (e.pointerType !== 'mouse' || drag) return;
    const hit = world.ray(e.clientX, e.clientY).intersectObjects(pills, true)[0];
    const i = hit ? hit.object.userData.slot : -1;
    if (i !== hovered) { hovered = i; stage.invalidate(); }
  };
  const onLeave = () => { if (hovered !== -1) { hovered = -1; stage.invalidate(); } };
  pin.addEventListener('pointermove', onHover);
  pin.addEventListener('pointerleave', onLeave);
```

Replace the debug lines with:

```js
  const debug = { anchors: { pole0: new THREE.Vector3(POLES[0][0], 1.2, POLES[0][1]).add(origin), slot0: slots[0].to.clone().add(origin) },
    lift: (i) => slots[i].lift.value };
  Object.defineProperty(debug, 'spin', { get: () => ({ ...spins[0] }) });
```

In `update`, replace the `slots.forEach(…)` block with:

```js
      slots.forEach((s, i) => {
        s.lift.target = i === hovered ? 1 : 0;
        busy = s.lift.step(f.dt) || busy;
        const k = bbSlots(t, i, PILL.n);
        s.m.visible = k > 0.001;
        if (!s.m.visible) return;
        s.m.position.copy(bez(s.from, s.from.clone().lerp(s.to, 0.5).add(new THREE.Vector3(0, 0.6, 0.8)), s.to, k));
        s.m.position.z += s.lift.value * 0.14;
        s.m.scale.setScalar((s.w / PILL3.w) * lerp(1, WALL.scale, k) * (1 + s.lift.value * 0.06));
        s.m.rotation.y = lerp(0.12, 0, k);
      });
```

In `dispose`, add `pin.removeEventListener('pointermove', onHover); pin.removeEventListener('pointerleave', onLeave);` after the `pointercancel` removal, and `pillGeo.dispose();` after `slideGeo.dispose();`.

- [ ] **Step 5: Build, delete the old crop, and run the tests**

Run:
```bash
python design/build_3d_assets.py
rm assets/3d/bb-slots.webp
python design/build_site.py
python -m pytest tests/test_assets.py -q
npm test
ONLY="Better Call Bhai" npm run smoke
```

Expected: all PASS, including the new hover scenario and the existing pole spin.

- [ ] **Step 6: Look at it**

Run: `node tests/browser/shot.mjs --at=better-call-bhai:0.5 --out=../portfolio-tools/shots3d/bb-payoff.png`, then read the image.

Expected:
- crisp white times on dark pills
- 10:30, 12:00, 12:30, 14:30 and 17:00 dimmed and struck through
- 15:00 yellow with dark text
- no screenshot edges

If the text sits off-centre on the pills, check that `timeCell` matches the atlas's 4 columns.

- [ ] **Step 7: Commit**

```bash
git add -A design/build_3d_assets.py assets/3d js/3d/chapters/better-call-bhai.js tests/test_assets.py tests/browser/smoke.mjs *.html
git commit -m "Better Call Bhai: the time slots as 3D pills with crisp times, lifting under the mouse"
```

---

### Task 3: MEANT's reply cards, the folded newspaper, and the press glide

**Files:**
- Create: `js/lib/glide.js`, `tests/js/glide.test.js`
- Modify: `design/build_3d_assets.py` (`reply_card()`, `main()`'s MEANT part)
- Modify: `js/3d/world.js` (glide state and API, `pageshow`)
- Modify: `js/3d/chapters/meant.js` (the newspaper and the press handler)
- Test: `tests/test_assets.py`, `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes: `font('inter-600', size)` and `sharpen(im)` (Tasks 1–2)
- Produces:
  - `glidePose(pos, at, to, t, near) -> { pos: [x,y,z], at: [x,y,z] }` (arrays)
  - `world.glideTo(point: THREE.Vector3, ms = 600) -> Promise<boolean>`
  - `world.endGlide()`
  - `world.debugGlide() -> number | null`
  - MEANT `debug.anchors.paper` (unchanged name)

- [ ] **Step 1: Write the failing unit test for the glide**

Create `tests/js/glide.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { glidePose } from '../../js/lib/glide.js';

const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test('the glide starts where the camera is and ends near the point, looking at it', () => {
  const pos = [0, 0, 10], at = [0, 0, 0], to = [2, 0, 0];
  const a = glidePose(pos, at, to, 0, 2);
  assert.ok(close(a.pos, pos) && close(a.at, at));
  const b = glidePose(pos, at, to, 1, 2);
  assert.ok(close(b.at, to));
  const d = Math.hypot(b.pos[0] - to[0], b.pos[1] - to[1], b.pos[2] - to[2]);
  assert.ok(Math.abs(d - 2) < 1e-9, `ends 2 away (${d})`);
});

test('it eases: a quarter of the time covers less than a quarter of the way', () => {
  const pos = [0, 0, 10], to = [0, 0, 0];
  const q = glidePose(pos, [0, 0, 0], to, 0.25, 2);
  assert.ok(q.pos[2] > 10 - 0.25 * 8);
});
```

Run: `node --test tests/js/glide.test.js`

Expected: FAIL (`Cannot find module …/js/lib/glide.js`).

- [ ] **Step 2: Write the glide helper**

Create `js/lib/glide.js`:

```js
// A short camera move toward a point (MEANT's newspaper, before its article opens): the camera moves along its
// line to `to`, stopping `near` away, while its aim turns onto `to`, eased in and out. Plain arrays, no DOM.
export function glidePose(pos, at, to, t, near) {
  const e = t * t * (3 - 2 * t);
  const d = [pos[0] - to[0], pos[1] - to[1], pos[2] - to[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const end = d.map((v, i) => to[i] + (v / len) * near);
  return { pos: pos.map((v, i) => v + (end[i] - v) * e), at: at.map((v, i) => v + (to[i] - v) * e) };
}
```

Run: `node --test tests/js/glide.test.js`

Expected: PASS (2 tests).

- [ ] **Step 3: Write the failing asset test and smoke tests**

In `tests/test_assets.py`, add:

```python
def test_meant_reply_cards_are_drawn_white_cards_and_the_paper_is_sharper():
    from PIL import Image, ImageStat
    for i in range(1, 5):
        with Image.open(ROOT / 'assets' / '3d' / f'mt-reply-{i}.webp') as im:
            assert im.size == (640, 296), im.size
            assert min(im.getpixel((8, 8))[:3]) >= 250, 'the card is white to its edge (the 3D card rounds it)'
            assert ImageStat.Stat(im.convert('L')).mean[0] > 200
    with Image.open(ROOT / 'assets' / '3d' / 'mt-paper.webp') as im:
        assert im.width >= 1400, im.size
```

Add to `tests/browser/smoke.mjs` before the run block:

```js
scenario('MEANT: pressing the newspaper glides into it, then opens the article', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(600);
  const p = await page.evaluate(() => window.__world.debugProject('meant', 'paper'));
  check(p !== null, 'the newspaper is on screen');
  const t0 = Date.now();
  await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.mouse.click(p.x, p.y)]);
  const ms = Date.now() - t0;
  check(page.url().endsWith('meant.html#press'), `it opened the article (${page.url()})`);
  check(ms >= 500, `after the camera glided in (${ms} ms)`);
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('MEANT: after coming back from the article, the camera is on the scroll again', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(400);
  await page.evaluate(() => { window.__world.glideTo(window.__world.mounted.get('meant').debug.anchors.paper.clone()); });
  await page.waitForFunction(() => window.__world.debugGlide() === 1, { timeout: 8000 }).catch(() => {});
  check(await page.evaluate(() => window.__world.debugGlide()) === 1, 'the camera glided to the paper');
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await sleep(300);
  check(await page.evaluate(() => window.__world.debugGlide()) === null, 'coming back ends the glide');
  check(await page.evaluate(() => window.__world.debugCamera().ok), 'the camera is on the scroll’s pose');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('MEANT: a ctrl-click on Featured in Tamil Murasu is left to the browser', async () => {
  const { page } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="meant"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="meant"][data-live]', { timeout: 30000 });
  await sleep(400);
  const prevented = await page.$eval('a.mt-press', (a) => {
    let seen = null;
    addEventListener('click', (e) => { seen = e.defaultPrevented; e.preventDefault(); }, { once: true });   // stay on the page
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 }));
    return seen;
  });
  check(prevented === false, 'the page did not take over the click');
  check(await page.evaluate(() => window.__world.debugGlide()) === null, 'no glide started');
  await page.close();
});
```

Run:
```bash
python -m pytest tests/test_assets.py -q -k meant_reply_cards
ONLY="MEANT:" npm run smoke
```

Expected: the pytest test FAILs (466×216 crops); the glide scenarios FAIL (`glideTo is not a function` / `debugGlide`).

- [ ] **Step 4: Draw the reply cards and the sharper paper**

In `design/build_3d_assets.py`, add after `partner_reply`:

```python
def reply_card(text):
    """One of the tablet's four replies as a clean card: white (the 3D card rounds its corners), a small dish icon,
    the reply in MEANT's own Inter 600."""
    W, H = 640, 296
    im = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(im)
    ink = (74, 79, 87)
    d.chord((268, 70, 372, 150), 0, 180, outline=ink, width=7)          # the bowl
    d.line((256, 110, 384, 110), fill=ink, width=7)                      # its rim
    for x in (296, 320, 344):                                            # steam
        d.line((x, 96, x - 6, 82, x, 68, x - 6, 54), fill=ink, width=5, joint='curve')
    d.text((W / 2, 214), text, font=font('inter-600', 50), fill=(31, 35, 40), anchor='mm')
    return im
```

In `main()`'s MEANT part:
- replace the reply loop `for i, box in enumerate(REPLY_BOXES, 1): save(crop(media / 'meant-shot-1.webp', box, 26), f'mt-reply-{i}')` with:

```python
    for i, text in enumerate(REPLIES, 1):
        save(reply_card(text), f'mt-reply-{i}')
```

- replace the `mt-paper` line with `save(sharpen(fit(media / 'press' / 'tamil-murasu-2026-09-28-p8.webp', (1400, 1117))), 'mt-paper', quality=80)`
- in the docstring, after "Nothing is drawn or invented here:", add: "(except the crisp parts drawn from the apps' real words: Better Call Bhai's times, MEANT's reply cards, Boss Breaker's challenge cards, and KnowCad's example console and pages)"

Keep `REPLY_BOXES`: the scene still starts each card where its tile sits on the tablet.

- [ ] **Step 5: Add the glide to the world**

In `js/3d/world.js`:
- add `import { glidePose } from '../lib/glide.js';` after the motion import
- after `const BG = 0x0c0c0d;` add `const GLIDE_NEAR = 2.2;   // how close the press glide stops to the paper (decimetres)`
- after `const camPos = new THREE.Vector3(), camAt = new THREE.Vector3();` add:

```js
  let glide = null;   // a short camera move toward a point (MEANT's newspaper), held until the page leaves or scrolls
```

In `api`, after `shake(a) {…},` add:

```js
    // the camera glides toward `point` over `ms` and holds there; the scroll (or coming back to the page) takes it back
    glideTo(point, ms = 600) {
      if (glide) glide.resolve(false);
      return new Promise((resolve) => { glide = { to: point.toArray(), t: 0, ms, y: scrollY, resolve, done: false }; stage.invalidate(); });
    },
    endGlide() { if (glide) { glide.resolve(false); glide = null; stage.invalidate(); } },
    debugGlide: () => (glide ? glide.t : null),
```

In `update`, right after `busy = shakeS.step(dt) || busy;` add:

```js
      if (glide) {
        if (Math.abs(y - glide.y) > 2) api.endGlide();
        else {
          glide.t = Math.min(1, glide.t + (dt || 16) / glide.ms);
          const g = glidePose(camPos.toArray(), camAt.toArray(), glide.to, glide.t, GLIDE_NEAR);
          camPos.fromArray(g.pos);
          camAt.fromArray(g.at);
          if (glide.t < 1) busy = true;
          else if (!glide.done) { glide.done = true; glide.resolve(true); }
        }
      }
```

After the `addEventListener('resize', …)` block add:

```js
  // back to the page from the browser's cache (after the newspaper's glide opened the article): the scroll's pose
  addEventListener('pageshow', (e) => { if (e.persisted) api.endGlide(); });
```

In `debugCamera`, use the glide-free pose. It already recomputes from the keys and compares with `camPos`, so after `endGlide` and one frame it is `ok`. No change needed.

- [ ] **Step 6: Fold the newspaper and wire the press**

In `js/3d/chapters/meant.js`:
- change the header comment's last clause "the Tamil Murasu page that featured MEANT lies on the table and opens the article." to "the Tamil Murasu page that featured MEANT lies on the table as a folded newspaper; press it and the camera glides into it before the article opens."
- add this function above `export async function mount`:

```js
// the Tamil Murasu page as a folded broadsheet lying open: the top sheet bends a little along its centre fold and
// curls up at one corner, and three sheets under it show their edges
function newspaper(tex) {
  const W = 2.2, H = 2.2 * (1416 / 1776);
  const shape = (curlBy) => {
    const geo = new THREE.PlaneGeometry(W, H, 32, 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const curl = Math.max(0, x / W + 0.5 + y / H + 0.5 - 1.55) / 0.45;
      p.setZ(i, Math.abs(x) * 0.05 + curlBy * curl * curl * 0.28);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const group = new THREE.Group();
  const under = new THREE.MeshStandardMaterial({ color: 0xe6e1d4, roughness: 0.95, side: THREE.DoubleSide });
  for (let k = 1; k <= 3; k++) {
    const s = new THREE.Mesh(shape(0.3), under);
    s.position.set(k * 0.012, -k * 0.008, -k * 0.006);
    group.add(s);
  }
  const top = new THREE.Mesh(shape(1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, side: THREE.DoubleSide }));
  group.add(top);
  group.traverse((o) => { o.userData.paper = true; });
  return { group, top };
}
```

Replace the newspaper block in `mount` (from `// the newspaper page, lying on the table…` to `group.add(paper);`) with:

```js
  // the newspaper, folded open on the table
  const news = newspaper(tex['mt-paper']);
  news.group.position.set(0.55, 0.068, 1.7);
  news.group.rotation.set(-Math.PI / 2, 0, 0.32);
  group.add(news.group);
```

Replace the `onTap` handler body's paper line, `if (hit.object === paper) pressLink.click();`, with `if (hit.object.userData.paper) pressLink.click();`, and in it change `ndcHit(e, [...tileMeshes, paper])` to `ndcHit(e, [...tileMeshes, news.group])`.

After `const pressLink = section.querySelector('a.mt-press');` add:

```js
  // pressing the paper (or its link) glides the camera into it, then opens the article; a new-tab click, or
  // reduced motion, is left to the browser
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let leaving = false;
  const onPress = async (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduced.matches) return;
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    await world.glideTo(news.top.getWorldPosition(new THREE.Vector3()), 600);
    leaving = false;
    location.href = pressLink.href;
  };
  pressLink.addEventListener('click', onPress);
```

Change `const debug = { anchors: { paper: paper.position.clone().add(origin) } };` to `const debug = { anchors: { paper: news.group.position.clone().add(origin) } };`.

In `dispose`, add `pressLink.removeEventListener('click', onPress);` after `offTap();`.

- [ ] **Step 7: Build and run the tests**

Run:
```bash
python design/build_3d_assets.py
python design/build_site.py
python -m pytest tests/test_assets.py -q
npm test
ONLY="MEANT" npm run smoke
ONLY="a swipe is not a tap" npm run smoke
```

Expected: all PASS, including:
- the keyboard pick
- the swipe that starts on the newspaper (still not a tap)
- the three new MEANT scenarios

- [ ] **Step 8: Look at it**

Run: `node tests/browser/shot.mjs --at=meant:0.5 --out=../portfolio-tools/shots3d/mt-payoff.png`, then read the image.

Expected:
- four clean white reply cards with crisp names
- the newspaper with visible sheet edges, a slight fold and a curled corner
- the article readable

- [ ] **Step 9: Commit**

```bash
git add -A js/lib/glide.js tests/js/glide.test.js design/build_3d_assets.py assets/3d js/3d/world.js js/3d/chapters/meant.js tests/test_assets.py tests/browser/smoke.mjs *.html
git commit -m "MEANT: clean reply cards, a folded newspaper, and a camera glide into it before the article opens"
```

---

### Task 4: Boss Breaker's six challenges as a hand of cards

**Files:**
- Modify: `design/build_3d_assets.py` (`CHALLENGES`, `challenge_icon()`, `challenge_card()`, `main()`; remove `CARD_BOXES`)
- Modify: `js/3d/chapters/boss-timeline.js` (add `handPose`)
- Modify: `js/3d/chapters/boss-breaker.js` (the hand, `hit()`, `update`, debug)
- Test: `tests/js/boss-timeline.test.js`, `tests/test_assets.py`, `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes: `font('geist', size, weight)` and `wrap(text, ft, width)` (Task 2); `DISPLAY` and `anchors` (Task 1)
- Produces:
  - `handPose(i, n, front, open) -> { j, a, lift, z }`
  - textures `bx-card-1` to `bx-card-6` (512×720)
  - debug `front()`

- [ ] **Step 1: Write the failing unit test**

Append to `tests/js/boss-timeline.test.js` (and add `handPose` to its import):

```js
test('the hand: the next card to play is in front, the others fanned behind it in turn', () => {
  const n = 6;
  assert.equal(handPose(0, n, 0, 1).j, 0);
  assert.equal(handPose(2, n, 2, 1).j, 0);
  assert.equal(handPose(1, n, 2, 1).j, 5);
  assert.ok(handPose(0, n, 0, 1).z > handPose(1, n, 0, 1).z, 'the front card is on top');
  const angles = Array.from({ length: n }, (_, i) => handPose(i, n, 0, 1).a);
  assert.equal(new Set(angles.map((a) => a.toFixed(4))).size, n, 'each card at its own angle');
});

test('closed (before the scroll opens it) the hand is one stack', () => {
  for (let i = 0; i < 6; i++) assert.ok(Math.abs(handPose(i, 6, 0, 0).a) < 1e-9 && handPose(i, 6, 0, 0).lift === 0);
});
```

Run: `node --test tests/js/boss-timeline.test.js`

Expected: FAIL (`handPose` isn't exported).

- [ ] **Step 2: Write `handPose`**

Append to `js/3d/chapters/boss-timeline.js`:

```js
// The hand of challenge cards: card i's place when card `front` is the next to play. j is its place in the hand
// (0 in front, on top), a its angle about the hand's pivot, lift its height; each card has its own small tilt and
// height so the hand looks held, not stamped. `open` (0..1) is how far the scroll has fanned it.
export function handPose(i, n, front, open) {
  const j = (i - front + n) % n;
  const tilt = (((i * 37) % 7) - 3) * 0.012;
  return {
    j,
    a: open * (0.3 - j * (0.6 / Math.max(1, n - 1)) + tilt),
    lift: open * (((i * 53) % 5) - 2) * 0.03,
    z: -j * 0.03,
  };
}
```

Run: `node --test tests/js/boss-timeline.test.js`

Expected: PASS.

- [ ] **Step 3: Write the failing asset test and smoke test**

In `tests/test_assets.py`:
- change `test_boss_breaker_crop_boxes_sit_inside_their_captures` to loop over `[b.DRAGON_BOX, b.LEADER_BOX, b.DISPLAY_CROP]`
- add:

```python
def test_the_six_challenge_cards_are_drawn_and_each_is_different():
    from PIL import Image, ImageChops, ImageStat
    import build_3d_assets as b
    assert [c[0] for c in b.CHALLENGES] == [
        'Drink 2L of water before 6pm', 'Walk 8,000 steps', 'Screen off 30 minutes before bed',
        'Ten minutes of stretching after class', 'Cook one meal instead of ordering in',
        'Eight hours of sleep, two nights running']
    ims = [Image.open(ROOT / 'assets' / '3d' / f'bx-card-{i}.webp').convert('RGB') for i in range(1, 7)]
    assert all(im.size == (512, 720) for im in ims)
    for i in range(6):
        for j in range(i + 1, 6):
            diff = ImageStat.Stat(ImageChops.difference(ims[i], ims[j])).mean
            assert sum(diff) / 3 > 6, (i + 1, j + 1, diff)
```

Add to `tests/browser/smoke.mjs`:

```js
scenario('Boss Breaker: Attack plays the front card, and six attacks go round the hand', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="boss-breaker"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="boss-breaker"][data-live]', { timeout: 30000 });
  await sleep(500);
  const front = () => page.evaluate(() => window.__world.mounted.get('boss-breaker').debug.front());
  check(await front() === 0, 'challenge #1 is in front');
  await page.click('[data-attack]');
  await sleep(200);
  check(await front() === 1, `after one attack, #2 is in front (${await front()})`);
  for (let i = 0; i < 5; i++) { await page.click('[data-attack]'); await sleep(150); }
  check(await front() === 0, `six attacks went round the hand (${await front()})`);
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});
```

Run:
```bash
python -m pytest tests/test_assets.py -q -k "challenge or crop_boxes"
ONLY="go round the hand" npm run smoke
```

Expected: FAIL (`CHALLENGES` isn't defined; `debug.front` isn't a function).

- [ ] **Step 4: Draw the cards**

In `design/build_3d_assets.py`, replace `CARD_BOXES = …` (both lines) with:

```python
# Boss Breaker's six challenges, #1 to #6, as d-challenges.png shows them: the words, points, creator; each card
# gets its own icon and an accent from the game's orange family
CHALLENGES = [
    ('Drink 2L of water before 6pm', 15, 'mruthulan', 'drop', (240, 106, 67)),
    ('Walk 8,000 steps', 25, 'aisha.k', 'steps', (245, 158, 11)),
    ('Screen off 30 minutes before bed', 20, 'mruthulan', 'moon', (251, 113, 133)),
    ('Ten minutes of stretching after class', 10, 'jun_wei', 'stretch', (249, 115, 22)),
    ('Cook one meal instead of ordering in', 30, 'priya.r', 'pan', (234, 179, 8)),
    ('Eight hours of sleep, two nights running', 35, 'mruthulan', 'bed', (226, 93, 78)),
]
```

Add after `reply_card`:

```python
def challenge_icon(d, kind, cx, cy, s, ink, bg):
    """A plain line icon, s px across, centred on (cx, cy)."""
    w = max(6, s // 14)
    if kind == 'drop':
        import math
        pts = [(cx, cy - s * 0.5)] + [(cx + s * 0.3 * math.cos(a), cy + s * 0.15 + s * 0.3 * math.sin(a))
                                      for a in [math.radians(-30 + k * 8) for k in range(31)]]
        d.line(pts + [pts[0]], fill=ink, width=w, joint='curve')
    elif kind == 'steps':
        d.ellipse((cx - s * 0.42, cy - s * 0.05, cx - s * 0.1, cy + s * 0.5), outline=ink, width=w)
        d.ellipse((cx + s * 0.1, cy - s * 0.5, cx + s * 0.42, cy + s * 0.05), outline=ink, width=w)
    elif kind == 'moon':
        r = s * 0.4
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ink)
        d.ellipse((cx - r * 0.45, cy - r * 1.25, cx + r * 1.25, cy + r * 0.45), fill=bg)
    elif kind == 'stretch':
        d.ellipse((cx - s * 0.09, cy - s * 0.48, cx + s * 0.09, cy - s * 0.3), outline=ink, width=w)
        d.line((cx, cy - s * 0.28, cx, cy + s * 0.12), fill=ink, width=w)
        d.line((cx - s * 0.3, cy - s * 0.5, cx, cy - s * 0.2, cx + s * 0.3, cy - s * 0.5), fill=ink, width=w, joint='curve')
        d.line((cx - s * 0.22, cy + s * 0.5, cx, cy + s * 0.12, cx + s * 0.22, cy + s * 0.5), fill=ink, width=w, joint='curve')
    elif kind == 'pan':
        d.ellipse((cx - s * 0.45, cy - s * 0.28, cx + s * 0.11, cy + s * 0.28), outline=ink, width=w)
        d.line((cx + s * 0.11, cy, cx + s * 0.5, cy), fill=ink, width=w + 2)
    elif kind == 'bed':
        d.line((cx - s * 0.45, cy - s * 0.35, cx - s * 0.45, cy + s * 0.35), fill=ink, width=w)
        d.rectangle((cx - s * 0.45, cy, cx + s * 0.45, cy + s * 0.18), outline=ink, width=w)
        d.rounded_rectangle((cx - s * 0.36, cy - s * 0.16, cx - s * 0.12, cy), radius=s * 0.05, outline=ink, width=w)
        d.line((cx + s * 0.45, cy + s * 0.18, cx + s * 0.45, cy + s * 0.35), fill=ink, width=w)


def challenge_card(n, text, pts, by, kind, accent):
    """Challenge #n as a game card: an accent band with its icon, the challenge, its points and who set it."""
    W, H = 512, 720
    im = Image.new('RGB', (W, H), (18, 22, 34))
    d = ImageDraw.Draw(im)
    for y in range(H):                                                   # a dark navy gradient, like the app
        k = y / H
        d.line((0, y, W, y), fill=(round(26 - 8 * k), round(31 - 9 * k), round(46 - 12 * k)))
    band = tuple(round(c * 0.82) for c in accent)
    d.rectangle((0, 0, W, 250), fill=band)
    challenge_icon(d, kind, W / 2, 125, 150, (255, 255, 255), band)
    d.text((40, 290), f'Challenge #{n}', font=font('geist', 30, 600), fill=(143, 152, 171))
    ft = font('geist', 44, 700)
    for k, line in enumerate(wrap(text, ft, W - 80)[:4]):
        d.text((40, 336 + k * 54), line, font=ft, fill=(255, 255, 255))
    chip = f'+{pts} pts'
    cw = font('geist', 30, 700).getlength(chip) + 36
    d.rounded_rectangle((40, 624, 40 + cw, 674), radius=25, fill=tuple(round(c * 0.25 + 20) for c in accent))
    d.text((40 + cw / 2, 649), chip, font=font('geist', 30, 700), fill=accent, anchor='mm')
    d.text((W - 40, 649), f'by {by}', font=font('geist', 26, 500), fill=(143, 152, 171), anchor='rm')
    return im
```

In `main()`, replace the card loop `for i, box in enumerate(CARD_BOXES, 1): save(…)` with:

```python
    for i, (text, pts, by, kind, accent) in enumerate(CHALLENGES, 1):
        save(challenge_card(i, text, pts, by, kind, accent), f'bx-card-{i}')
```

- [ ] **Step 5: Hold the cards as a hand and play the front one**

In `js/3d/chapters/boss-breaker.js`:
- change the timeline import to `import { bossHp, hpText, bxState, handPose, START_HP } from './boss-timeline.js';`
- change the header comment's "a hand of the real challenge cards" to "a hand of the six real challenges as cards" and "a click anywhere (or Attack) hits it for 350: a card flies into the bar" to "a click anywhere (or Attack) plays the front card at it for 350: the card flies into the bar and the next comes to the front".

Replace the hand block (from `// the hand of challenge cards, fanned about a point below them` to the end of `fanPose`) with:

```js
  // the hand: the six challenges as cards, held in a loose arc low in front, the next to play on top
  const CARD = { w: 1.05, h: 1.05 * (720 / 512) };
  const pivot = new THREE.Vector3(desk ? 0.9 : 0.4, FLOOR - 0.9, 2.6);
  let front = 0;
  const cards = Array.from({ length: nCards }, (_, i) => {
    const c = card(CARD.w, CARD.h, tex[`bx-card-${i + 1}`], null, { color: 0x121622 });
    group.add(c);
    return { c, pos: new THREE.Vector3(), rz: 0, ready: false };
  });
  const handAt = (i, open) => {
    const h = handPose(i, nCards, front, open);
    const r = 2.2;
    return { pos: new THREE.Vector3(pivot.x - Math.sin(h.a) * r, pivot.y + Math.cos(h.a) * r + h.lift, pivot.z + h.z), rz: h.a };
  };
```

Change `let hits = 0, local = -1, shownHp = -1, throwN = 0, throwT = 1, hitTimer = 0, wasVisible = false;` to `let hits = 0, local = -1, shownHp = -1, throwN = 0, throwT = 1, hitTimer = 0, wasVisible = false, throwFrom = new THREE.Vector3();`.

In `hit()`, replace `throwN = (throwN + 1) % nCards;` with:

```js
    throwN = front;
    throwFrom = cards[front].pos.clone();   // where it left the hand
    front = (front + 1) % nCards;           // the next comes to the front while it flies
```

In `update`, replace the block from `// the hand opens with the scroll; the thrown card flies…` to the end of `cards.forEach(…);` with:

```js
      // the hand opens with the scroll; the played card flies to the end of the bar and back to the back of the hand,
      // and the others slide to their new places
      if (throwT < 1) { throwT = Math.min(1, throwT + f.dt / 620); busy = true; }
      const ease = 1 - Math.exp(-f.dt / 90);
      cards.forEach((cd, i) => {
        const want = handAt(i, st.cards);
        if (!cd.ready) { cd.pos.copy(want.pos); cd.rz = want.rz; cd.ready = true; }
        if (cd.pos.distanceToSquared(want.pos) > 1e-7 || Math.abs(cd.rz - want.rz) > 1e-4) {
          cd.pos.lerp(want.pos, ease);
          cd.rz += (want.rz - cd.rz) * ease;
          busy = true;
        }
        cd.c.position.copy(cd.pos);
        cd.c.rotation.set(-0.3, 0, cd.rz);
        cd.c.visible = st.cards > 0.02 || i === front;
        if (i === throwN && throwT < 1) {
          const end = fillEnd();
          if (throwT < 0.5) {
            const k = easeInOut(throwT * 2);
            cd.c.position.copy(bez(throwFrom, throwFrom.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 2.5, 1.5)), end, k));
            cd.c.rotation.set(-0.3 + k * 0.4, k * 3, cd.rz * (1 - k));
          } else {
            const k = easeInOut((throwT - 0.5) * 2);
            cd.c.position.copy(bez(end, end.clone().lerp(want.pos, 0.5).add(new THREE.Vector3(0, 1.5, 1)), want.pos, k));
            cd.c.rotation.set(-0.3 + (1 - k) * 0.4, (1 - k) * 3, cd.rz * k);
          }
          cd.pos.copy(cd.c.position);   // the hand takes it back from where it is
          cd.c.visible = true;
        }
      });
```

In the reset line `if (t < -0.6 && hits) { hits = 0; hud.live.textContent = ''; }`, add `front = 0;` inside the braces. Add `front: () => front,` to `debug`.

- [ ] **Step 6: Build and run the tests**

Run:
```bash
python design/build_3d_assets.py
python design/build_site.py
python -m pytest tests/test_assets.py -q
npm test
ONLY="Boss Breaker" npm run smoke
```

Expected: all PASS, including attack-to-defeat-and-reset, the screen-clear-of-words check (Task 1) and the new hand scenario.

- [ ] **Step 7: Look at it**

Run: `node tests/browser/shot.mjs --at=boss-breaker:0.5 --out=../portfolio-tools/shots3d/bx-payoff.png`, then read the image.

Expected:
- six distinct cards held in an arc in the lower middle, each with its own colour band and icon
- the front card's words readable
- nothing covering the big screen

If the hand covers the phone, move `pivot.x` right in steps of 0.3.

- [ ] **Step 8: Commit**

```bash
git add -A design/build_3d_assets.py assets/3d js/3d/chapters/boss-timeline.js js/3d/chapters/boss-breaker.js tests/js/boss-timeline.test.js tests/test_assets.py tests/browser/smoke.mjs *.html
git commit -m "Boss Breaker: the six real challenges as distinct cards held in a hand; Attack plays the front one"
```

---

### Task 5: KnowCad, the support rep's desk

**Files:**
- Modify: `js/3d/chapters/knowcad-timeline.js` (rewrite)
- Modify: `js/3d/chapters/knowcad.js` (rewrite)
- Modify: `js/3d/paths.js` (the KnowCad keys)
- Modify: `design/build_3d_assets.py`:
  - add the `KC_*` constants and `kc_console()`, `kc_spines()`, `kc_source()`
  - in `main()`, replace the `kc-champion` line
- Modify: `design/build_site.py`:
  - add `KC_QUERY`
  - in `CHAPTERS`' KnowCad entry, change `alt` and `extra`
- Delete: `assets/3d/kc-champion.webp`
- Test: `tests/js/knowcad-timeline.test.js`, `tests/test_assets.py`, `tests/test_site.py`, `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes:
  - `font('geist'|'mono'|'knowcad', size, weight)` and `wrap` (Task 2)
  - `panel`, `glow`, `screenGeometry`, `cropUV` and `bez` from `js/3d/textures.js`
  - `Spring` from `js/lib/motion.js`
  - `onTap` from `js/3d/tap.js`
- Produces:
  - `QUESTION` (the rep's query)
  - `SOURCES` (3 strings)
  - `kcState(local) -> { ticket, typed, search, light, pull, answer }`
  - textures `kc-console-0` to `kc-console-3` (1600×1000), `kc-spines` (800×800), `kc-source-1` to `kc-source-3` (600×780)
  - debug:
    - `parted()`, `state()`, `forward(i)` and `pulled()`
    - `anchors.source0`, `anchors.source1` and `anchors.source2` (live getters)
    - `anchors.manual`

- [ ] **Step 1: Write the failing timeline test**

Replace `tests/js/knowcad-timeline.test.js` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { kcState, QUESTION, SOURCES } from '../../js/3d/chapters/knowcad-timeline.js';

test('the ticket lands, then the rep’s question types, then KnowCad searches, pulls the pages and answers', () => {
  assert.deepEqual(kcState(-0.4), { ticket: 0, typed: 0, search: 0, light: 0, pull: 0, answer: 0 });
  assert.equal(kcState(0.05).ticket, 1);
  assert.ok(kcState(0.08).typed > 0 && kcState(0.08).typed < QUESTION.length);
  assert.equal(kcState(0.16).typed, QUESTION.length);
  assert.ok(kcState(0.21).light > kcState(0.21).pull);
  assert.equal(kcState(0.3).answer, 0);
  const z = kcState(0.42);
  assert.deepEqual([z.ticket, z.typed, z.search, z.light, z.pull, z.answer], [1, QUESTION.length, 1, 1, 1, 1]);
});

test('the words of the example', () => {
  assert.equal(QUESTION, 'Licence “in use on another device” after moving to new laptops');
  assert.deepEqual(SOURCES, ['Licensing · p. 42', 'Admin Handbook · p. 118', 'Troubleshooting · p. 7']);
});
```

Run: `node --test tests/js/knowcad-timeline.test.js`

Expected: FAIL (`SOURCES` isn't exported; the old QUESTION).

- [ ] **Step 2: Rewrite the timeline**

Replace `js/3d/chapters/knowcad-timeline.js` with:

```js
// KnowCad's chapter as numbers: a customer's ticket lands on the rep's screen, the rep's question to KnowCad types
// out, KnowCad searches the manuals, three of them light up and a page slides out of each to the desk, and the
// suggested answer appears with its sources. The question and the answer are an example.
import { ramp, easeInOut } from '../../lib/motion.js';

export const QUESTION = 'Licence “in use on another device” after moving to new laptops';
export const SOURCES = ['Licensing · p. 42', 'Admin Handbook · p. 118', 'Troubleshooting · p. 7'];
export const kcState = (local) => ({
  ticket: easeInOut(ramp(local, -0.05, 0.05)),
  typed: Math.round(QUESTION.length * ramp(local, 0.0, 0.16)),
  search: easeInOut(ramp(local, 0.16, 0.2)),
  light: easeInOut(ramp(local, 0.18, 0.24)),
  pull: easeInOut(ramp(local, 0.22, 0.36)),
  answer: easeInOut(ramp(local, 0.34, 0.42)),
});
```

Run: `node --test tests/js/knowcad-timeline.test.js`

Expected: PASS.

- [ ] **Step 3: Write the failing asset and page tests**

In `tests/test_assets.py`, replace `test_the_knowcad_champion_photo_is_ready` with:

```python
KC = ['kc-console-0', 'kc-console-1', 'kc-console-2', 'kc-console-3', 'kc-spines', 'kc-source-1', 'kc-source-2', 'kc-source-3']


def test_knowcad_textures_are_drawn_and_the_champion_photo_is_gone():
    from PIL import Image, ImageChops, ImageStat
    sizes = {n: Image.open(ROOT / 'assets' / '3d' / f'{n}.webp').size for n in KC}
    assert all(sizes[f'kc-console-{i}'] == (1600, 1000) for i in range(4))
    assert sizes['kc-spines'] == (800, 800)
    assert all(sizes[f'kc-source-{i}'] == (600, 780) for i in range(1, 4))
    assert not (ROOT / 'assets' / '3d' / 'kc-champion.webp').exists()
    states = [Image.open(ROOT / 'assets' / '3d' / f'kc-console-{i}.webp').convert('RGB') for i in range(4)]
    for a, b in zip(states, states[1:]):
        assert sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3 > 1, 'each state adds something'


def test_the_knowcad_example_agrees_everywhere():
    import build_3d_assets as b
    import build_site as bs
    js = (ROOT / 'js' / '3d' / 'chapters' / 'knowcad-timeline.js').read_text(encoding='utf-8')
    q = re.search(r"QUESTION = '([^']+)'", js).group(1)
    assert q == b.KC_QUERY == bs.KC_QUERY
    assert re.search(r'SOURCES = \[([^\]]+)\]', js).group(1) == ', '.join(f"'{s}'" for s in b.KC_SOURCES)
```

In `tests/test_site.py`:
- in `COPY`, replace `'Who won the Autodesk Singapore Hackathon 2026?'` with `'Licence “in use on another device” after moving to new laptops'`
- add `'Who won the Autodesk Singapore Hackathon 2026?'` to `GONE`
- replace `test_knowcad_asks_its_question_in_full_without_the_3d` with:

```python
def test_knowcad_asks_its_question_in_full_without_the_3d():
    markup = bs.build_home()
    sec = re.search(r'<section class="chapter" data-scene="knowcad".*?</section>', markup, re.S).group(0)
    q = 'Licence “in use on another device” after moving to new laptops'
    assert f'<span data-typed>{q}</span>' in sec
    assert f'<p class="sr-only">{q}</p>' in sec
    assert 'An example question' in sec and 'private' not in sec.lower()
```

Run: `python -m pytest tests -q -k "knowcad"`

Expected: FAIL (textures missing; `KC_QUERY` isn't defined).

- [ ] **Step 4: Draw KnowCad's console, spines and source pages**

In `design/build_3d_assets.py`:
- add `import random` to the imports
- after `CHALLENGES` add:

```python
# KnowCad, drawn (the product is private): a support rep's console and three manual pages, an example in KnowCad's
# colours. No product is named and no real manual is quoted.
KC_TICKET = 'We moved to new laptops and the app says our licence is in use on another device. How do we fix it?'
KC_QUERY = 'Licence “in use on another device” after moving to new laptops'
KC_ANSWER = ('Sign out on the old laptop to free the licence. If that laptop is gone, an admin can release it '
             'from the account portal. Then sign in on the new one.')
KC_SOURCES = ['Licensing · p. 42', 'Admin Handbook · p. 118', 'Troubleshooting · p. 7']
KC_PASSAGES = ['Signing out of the app on a device frees its licence for use on another device.',
               'An admin can release a licence from a device in the account portal when that device is no longer available.',
               '“In use on another device”: sign out on the old device, then sign in on the new one.']
KC_TITLES = ['Installation Guide', 'Licensing', 'Admin Handbook', 'Release Notes', 'Troubleshooting']
KC_COVERS = [(42, 35, 70), (51, 42, 87), (61, 50, 102), (40, 32, 64), (70, 58, 117)]
KC_INK = {'bg': (18, 17, 26), 'side': (23, 21, 33), 'panel': (28, 26, 40), 'line': (52, 48, 72),
          'ink': (236, 233, 248), 'soft': (154, 148, 180), 'violet': (155, 135, 255), 'deep': (61, 50, 102)}
```

- after `challenge_card` add:

```python
def kc_console(state):
    """The rep's console: 0 no ticket, 1 the customer's ticket, 2 the rep's question and the search, 3 KnowCad's
    suggested answer with its three sources."""
    C = KC_INK
    W, H = 1600, 1000
    im = Image.new('RGB', (W, H), C['bg'])
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 300, H), fill=C['side'])
    d.text((40, 52), 'KnowCad', font=font('knowcad', 34), fill=C['violet'])
    for k, item in enumerate(['Tickets', 'Knowledge', 'Settings']):
        y = 150 + k * 64
        if k == 0:
            d.rounded_rectangle((24, y - 10, 276, y + 42), radius=12, fill=C['deep'])
        d.text((48, y), item, font=font('geist', 26, 500), fill=C['ink'] if k == 0 else C['soft'])
    d.text((340, 52), 'Ticket #4821 · Licence', font=font('geist', 30, 600), fill=C['ink'])
    d.rounded_rectangle((340, 120, 900, 940), radius=22, fill=C['panel'])
    if state >= 1:
        d.text((372, 150), 'Customer', font=font('geist', 22, 600), fill=C['soft'])
        ft = font('geist', 30, 500)
        for k, line in enumerate(wrap(KC_TICKET, ft, 490)):
            d.text((372, 192 + k * 42), line, font=ft, fill=C['ink'])
    else:
        d.text((620, 520), 'No new tickets', font=font('geist', 26, 500), fill=C['soft'], anchor='mm')
    d.rounded_rectangle((930, 120, 1560, 940), radius=22, fill=C['panel'])
    d.text((962, 150), 'Ask KnowCad', font=font('geist', 22, 600), fill=C['violet'])
    if state >= 2:
        ft = font('geist', 26, 500)
        lines = wrap(KC_QUERY, ft, 500)
        h = 28 + 36 * len(lines)
        d.rounded_rectangle((990, 196, 1528, 196 + h), radius=18, fill=C['deep'])
        for k, line in enumerate(lines):
            d.text((1010, 210 + k * 36), line, font=ft, fill=C['ink'])
        top = 196 + h + 30
        if state == 2:
            d.text((962, top), 'Searching 5 manuals…', font=font('geist', 24, 500), fill=C['soft'])
            for k in range(3):
                d.rounded_rectangle((962, top + 50 + k * 40, 1400 - k * 90, top + 70 + k * 40), radius=10, fill=C['line'])
        else:
            d.text((962, top), 'Suggested answer', font=font('geist', 22, 600), fill=C['violet'])
            ft = font('geist', 27, 500)
            y = top + 40
            for line in wrap(KC_ANSWER, ft, 560):
                d.text((962, y), line, font=ft, fill=C['ink'])
                y += 38
            y += 18
            x, mono = 962, font('mono', 19, 500)
            for s in KC_SOURCES:
                w = mono.getlength(s) + 28
                if x + w > 1530:
                    x, y = 962, y + 48
                d.rounded_rectangle((x, y, x + w, y + 38), radius=19, outline=C['violet'], width=2)
                d.text((x + 14, y + 19), s, font=mono, fill=C['violet'], anchor='lm')
                x += w + 12
            d.rounded_rectangle((962, 860, 1200, 912), radius=14, fill=C['violet'])
            d.text((1081, 886), 'Send to customer', font=font('geist', 22, 600), fill=(20, 16, 34), anchor='mm')
    return im


def kc_spines():
    """The five manuals' spines, side by side (160 x 800 each), titled top to bottom."""
    W, H = 160, 800
    im = Image.new('RGB', (W * 5, H), (0, 0, 0))
    for i, (title, cover) in enumerate(zip(KC_TITLES, KC_COVERS)):
        sp = Image.new('RGB', (H, W), cover)
        d = ImageDraw.Draw(sp)
        light = tuple(min(255, c + 30) for c in cover)
        d.rectangle((0, 0, 44, W), fill=light)
        d.rectangle((H - 60, 0, H, W), fill=light)
        d.text((H / 2 - 8, W / 2), title, font=font('geist', 46, 700), fill=(217, 210, 255), anchor='mm')
        im.paste(sp.rotate(-90, expand=True), (i * W, 0))
    return im


def kc_source(i):
    """Source page i: the manual's name and page, lines of text as grey bars, and the passage that answers the
    ticket, highlighted in violet."""
    W, H = 600, 780
    im = Image.new('RGB', (W, H), (238, 236, 244))
    d = ImageDraw.Draw(im)
    title, page = KC_SOURCES[i].split(' · ')
    d.text((44, 40), title.upper(), font=font('geist', 22, 700), fill=(98, 84, 170))
    d.text((W - 44, 40), page, font=font('mono', 20, 500), fill=(120, 114, 140), anchor='ra')
    d.line((44, 84, W - 44, 84), fill=(200, 196, 214), width=2)
    rng = random.Random(i + 7)
    ft = font('geist', 26, 500)
    lines = wrap(KC_PASSAGES[i], ft, W - 110)
    y = 116
    for k in range(13):
        if k == 3 + i:
            h = 18 + 36 * len(lines)
            d.rounded_rectangle((34, y - 10, W - 34, y - 10 + h), radius=10, fill=(214, 205, 255))
            for line in lines:
                d.text((50, y), line, font=ft, fill=(30, 24, 52))
                y += 36
            y += 24
        else:
            d.rounded_rectangle((44, y + 6, 44 + rng.randint(300, W - 100), y + 18), radius=6, fill=(205, 202, 216))
            y += 34
    return im
```

- in `main()`, replace `save(fit(media / 'win-knowcad-champion.webp', (1179, 705)), 'kc-champion')` with:

```python
    for state in range(4):
        save(kc_console(state), f'kc-console-{state}')
    save(kc_spines(), 'kc-spines')
    for i in range(3):
        save(kc_source(i), f'kc-source-{i + 1}')
```

- [ ] **Step 5: Update the homepage's KnowCad words**

In `design/build_site.py`, before `CHAPTERS = [`, add:

```python
# KnowCad's example (the chapter's 3D draws the same words; tests/test_assets.py checks they agree)
KC_QUERY = 'Licence “in use on another device” after moving to new laptops'
```

In the KnowCad entry of `CHAPTERS`, replace `alt=…` and `extra=…` with:

```python
         alt='KnowCad at a support rep’s desk: a customer asks why their licence shows as in use on another '
             'device, and KnowCad’s suggested answer cites three manuals pulled from the shelves around the desk, '
             'Licensing p. 42, Admin Handbook p. 118 and Troubleshooting p. 7. An example question.',
         extra=f'<p class="kc-q" aria-hidden="true"><span data-typed>{e(KC_QUERY)}</span>'
               f'<i class="kc-caret"></i></p><p class="sr-only">{e(KC_QUERY)}</p>'),
```

The `still='win-knowcad-champion'` stays: it is only the fallback picture before a rendered still exists.

- [ ] **Step 6: Rewrite the scene**

Replace `js/3d/chapters/knowcad.js` with:

```js
// 05 · KnowCad: the support rep's desk. The camera flies down an aisle of manuals (shelves of standing manuals,
// stacks lying flat, their spines titled, loose pages drifting between them) to a support rep's desk. As the
// visitor scrolls, a customer's ticket lands on the rep's screen, the rep's question to KnowCad types out by the
// name, three manuals light up violet and a page slides out of each to the desk with the passage that answers it
// highlighted, and KnowCad's suggested answer appears on the screen with its three sources. The screen and pages
// are drawn in KnowCad's style (the product is private): the ticket, the manuals and the answer are an example.
// Move the cursor through the loose pages and they drift aside; tap a source page to bring it forward (tap again
// to put it back), tap a manual to pull it out a little.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { glow, panel, screenGeometry, cropUV, loadTexture, bez, disposeTree, nextFrame } from '../textures.js';
import { scatter, mulberry32 } from '../../lib/scatter.js';
import { Spring } from '../../lib/motion.js';
import { onTap } from '../tap.js';
import { kcState, QUESTION } from './knowcad-timeline.js';

const VIOLET = 0xb3a4ff;
const TITLES = 5;   // Installation Guide, Licensing, Admin Handbook, Release Notes, Troubleshooting (the spine atlas)
const COVERS = [0x2a2346, 0x332a57, 0x3d3266, 0x282040, 0x463a75];
const FLOOR = -2.4;
const DESK = { x: 1.4, y: -1.0, z: -33 };
const SCREEN = { w: 4.4, h: 2.75, x: 1.4, y: 0.55, z: -33.6 };
const PAGE = { w: 1.25, h: 1.25 * (780 / 600) };
const LOOSE = { w: 1.1, h: 1.42 };
const PART_R = 2.0;
// where the three source pages come to rest: two standing beside the screen, one lying on the desk
const REST = [
  { p: [4.0, 0.95, -32.9], r: [0, -0.35, 0.05] },
  { p: [4.35, -0.2, -32.6], r: [0, -0.3, -0.04] },
  { p: [3.2, DESK.y + 0.02, -31.8], r: [-Math.PI / 2 + 0.25, 0, 0.3] },
];

// four loose pages of generic text (bars, no words) in one atlas
function pagesAtlas() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1324;
  const g = c.getContext('2d');
  const r = mulberry32(41);
  for (let v = 0; v < 4; v++) {
    const x0 = (v % 2) * 512, y0 = Math.floor(v / 2) * 662;
    g.fillStyle = '#e6e4ee';
    g.fillRect(x0, y0, 512, 662);
    g.fillStyle = '#4a4266';
    g.fillRect(x0 + 40, y0 + 44, 180 + v * 30, 18);
    g.fillStyle = '#c9c6d6';
    for (let y = y0 + 96; y < y0 + 620; y += 26) g.fillRect(x0 + 40, y, 160 + r() * 270, 9);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// a book as a unit box whose +z face shows spine `i` of the atlas
function spineGeo(i) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const uv = g.attributes.uv;
  for (let v = 16; v < 20; v++) uv.setX(v, (i + uv.getX(v)) / TITLES);
  return g;
}

export async function mount({ world, stage, section, origin, form }) {
  const desk = form === 'desk';
  const names = ['kc-console-0', 'kc-console-1', 'kc-console-2', 'kc-console-3', 'kc-spines', 'kc-source-1', 'kc-source-2', 'kc-source-3'];
  const tex = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await loadTexture(`assets/3d/${n}.webp`)])));
  const group = new THREE.Group();
  group.position.copy(origin);
  const rand = mulberry32(31);
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: 0x0f0e15, roughness: 0.9, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR, -18);
  const behind = glow(VIOLET, 16, 10, 0.25);
  behind.position.set(1.4, 0.6, -38);
  group.add(floor, behind);

  // the aisle: shelf units on both sides, each three shelves of standing manuals, spines toward the aisle
  const books = [], boards = [];
  const units = desk ? 8 : 4;
  for (let u = 0; u < units; u++) {
    for (const side of [-1, 1]) {
      const x = side * 5.2, z0 = -3 - u * 3.4;
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0));
      const out = new THREE.Vector3(-side, 0, 0);
      for (let level = 0; level < 3; level++) {
        const y = FLOOR + 0.12 + level * 1.9;
        boards.push([[x, y - 0.06, z0 - 1.5], [1.2, 0.08, 3.1]]);
        let z = z0 - 0.05, n = 0;
        while (true) {
          const th = 0.16 + rand() * 0.2, h = 1.1 + rand() * 0.5;
          if (z - th < z0 - 2.95) break;
          books.push({ title: Math.floor(rand() * TITLES), pos: new THREE.Vector3(x + side * (0.05 + rand() * 0.08), y + h / 2, z - th / 2), quat, scale: new THREE.Vector3(th, h, 1.0), out, u, side, level, n: n++ });
          z -= th + 0.012;
        }
      }
      boards.push([[x, FLOOR + 3 * 1.9, z0 - 1.5], [1.2, 0.08, 3.1]]);
      boards.push([[x, FLOOR + 2.85, z0 - 0.02], [1.2, 5.7, 0.08]]);
      boards.push([[x, FLOOR + 2.85, z0 - 2.98], [1.2, 5.7, 0.08]]);
    }
  }
  // stacks lying flat, spines toward the camera: three on the floor near the desk, one on the desk
  const stacks = [[-2.9, FLOOR, -30.4, 7], [-3.8, FLOOR, -32.4, 5], [6.0, FLOOR, -30.8, 6], [-1.5, DESK.y, -32.2, 3]].filter((_, k) => desk || k !== 2);
  for (const [sx, sy, sz, count] of stacks) {
    let y = sy;
    for (let k = 0; k < count; k++) {
      const th = 0.12 + rand() * 0.1, len = 1.3 + rand() * 0.3, ry = (rand() - 0.5) * 0.25;
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, Math.PI / 2, 'YXZ'));
      books.push({ title: Math.floor(rand() * TITLES), pos: new THREE.Vector3(sx, y + th / 2, sz), quat, scale: new THREE.Vector3(th, len, 1.0), out: new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry), stack: sy === DESK.y, top: k === count - 1 });
      y += th;
    }
  }
  // the three manuals that answer the ticket: Licensing and Admin Handbook on the last shelves, Troubleshooting
  // on top of the stack on the desk
  const matched = [
    books.find((b) => b.u === units - 1 && b.side === -1 && b.level === 1 && b.n === 3),
    books.find((b) => b.u === units - 1 && b.side === 1 && b.level === 2 && b.n === 2),
    books.find((b) => b.stack && b.top),
  ];
  [1, 2, 4].forEach((title, i) => { matched[i].title = title; });

  const pagesMat = new THREE.MeshStandardMaterial({ color: 0xd9d5e6, roughness: 0.9 });
  const spineMat = new THREE.MeshStandardMaterial({ map: tex['kc-spines'], roughness: 0.65 });
  const shelves = Array.from({ length: TITLES }, (_, ti) => {
    const list = books.filter((b) => b.title === ti);
    const cover = new THREE.MeshStandardMaterial({ color: COVERS[ti], roughness: 0.7, metalness: 0.05 });
    const mesh = new THREE.InstancedMesh(spineGeo(ti), [cover, cover, pagesMat, pagesMat, spineMat, pagesMat], Math.max(1, list.length));
    list.forEach((b, k) => { b.mesh = mesh; b.k = k; mesh.setMatrixAt(k, m4.compose(b.pos, b.quat, b.scale)); });
    mesh.count = list.length;
    mesh.userData.books = list;
    group.add(mesh);
    return mesh;
  });
  const shelf = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x1a1824, roughness: 0.6, metalness: 0.3 }), boards.length);
  boards.forEach(([p, s], k) => shelf.setMatrixAt(k, m4.compose(v3.set(...p), new THREE.Quaternion(), new THREE.Vector3(...s))));
  group.add(shelf);
  await nextFrame();

  // the desk, the rep's monitor and keyboard; the console's later states lie over its screen
  const dark = new THREE.MeshStandardMaterial({ color: 0x24212f, roughness: 0.55, metalness: 0.2 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(7.2, 0.12, 3.0, 2, 0.04), dark);
  top.position.set(DESK.x, DESK.y - 0.06, DESK.z + 0.3);
  group.add(top);
  for (const [lx, lz] of [[-3.4, -1.2], [3.4, -1.2], [-3.4, 1.6], [3.4, 1.6]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, DESK.y - FLOOR, 0.1), dark);
    leg.position.set(DESK.x + lx, (DESK.y + FLOOR) / 2, DESK.z + lz);
    group.add(leg);
  }
  const mon = panel(tex['kc-console-0'], SCREEN.w, SCREEN.h);
  mon.group.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  mon.group.rotation.x = -0.04;
  const overlays = [1, 2, 3].map((n) => {
    const m = new THREE.Mesh(screenGeometry(SCREEN.w, SCREEN.h, 0.015), new THREE.MeshBasicMaterial({ map: tex[`kc-console-${n}`], toneMapped: false, transparent: true, opacity: 0, depthWrite: false }));
    m.position.z = 0.002 + n * 0.0005;
    mon.group.add(m);
    return m;
  });
  const postH = SCREEN.y - SCREEN.h / 2 - DESK.y;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, postH, 0.12), dark);
  post.position.set(SCREEN.x, DESK.y + postH / 2, SCREEN.z - 0.12);
  const foot = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.05, 0.6, 2, 0.02), dark);
  foot.position.set(SCREEN.x, DESK.y + 0.025, SCREEN.z - 0.1);
  const keys = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.05, 0.85, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x17151f, roughness: 0.6 }));
  keys.position.set(SCREEN.x, DESK.y + 0.025, DESK.z + 1.0);
  const screenGlow = glow(VIOLET, SCREEN.w * 1.6, SCREEN.h * 1.6, 0.12);
  screenGlow.position.set(SCREEN.x, SCREEN.y, SCREEN.z - 0.3);
  group.add(mon.group, post, foot, keys, screenGlow);

  // the matched manuals glow, and a page slides out of each to the desk
  const lights = matched.map((b) => {
    const g = glow(VIOLET, 1.1, 1.9, 0);
    g.position.copy(b.pos).addScaledVector(b.out, 0.4);
    group.add(g);
    return g;
  });
  const pages = matched.map((b, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(PAGE.w, PAGE.h), new THREE.MeshBasicMaterial({ map: tex[`kc-source-${i + 1}`], toneMapped: false, side: THREE.DoubleSide }));
    m.userData.page = i;
    m.visible = false;
    group.add(m);
    const look = new THREE.Object3D();
    look.position.copy(b.pos);
    look.lookAt(b.pos.clone().add(b.out));
    return {
      m, from: b.pos.clone().addScaledVector(b.out, 0.6), fromQ: look.quaternion.clone(),
      rest: new THREE.Vector3(...REST[i].p), restQ: new THREE.Quaternion().setFromEuler(new THREE.Euler(...REST[i].r)),
      fwd: new Spring(0, { stiffness: 150, damping: 20 }),
    };
  });
  await nextFrame();

  // loose pages drifting in the aisle (four designs, one instanced mesh each), with clear air by the desk
  const atlas = pagesAtlas();
  const looseMat = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.85, side: THREE.DoubleSide });
  const nLoose = desk ? 90 : 36;
  const looseMeshes = [0, 1, 2, 3].map((v) => {
    const geo = cropUV(new THREE.PlaneGeometry(LOOSE.w, LOOSE.h), [(v % 2) / 2, 1 - (Math.floor(v / 2) + 1) / 2, (v % 2 + 1) / 2, 1 - Math.floor(v / 2) / 2]);
    const m = new THREE.InstancedMesh(geo, looseMat, Math.ceil((nLoose - v) / 4));
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(m);
    return m;
  });
  const r2 = mulberry32(29);
  const loose = scatter(nLoose, 23, { x: [-4.2, 4.2], y: [FLOOR + 0.6, 4], z: [-28, -1] }, 1.4).map((p, i) => ({
    mesh: looseMeshes[i % 4], k: Math.floor(i / 4), pos: new THREE.Vector3(...p),
    quat: new THREE.Quaternion().setFromEuler(new THREE.Euler((r2() - 0.5) * 0.7, (r2() - 0.5) * 1.3, (r2() - 0.5) * 0.4)),
    off: new THREE.Vector3(), aim: new THREE.Vector3(),
  }));
  const placeLoose = () => {
    loose.forEach((s) => s.mesh.setMatrixAt(s.k, m4.compose(v3.copy(s.pos).add(s.off), s.quat, one)));
    looseMeshes.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  };
  placeLoose();
  world.root.add(group);

  // taps: a source page comes forward (once it has landed) and goes back; a manual slides out a little
  const pin = section.querySelector('.pin');
  const pulls = new Map();   // book -> Spring
  let local = -1;
  const offTap = onTap(pin, (e) => {
    if (e.target.closest('a, button')) return;
    const hit = world.ray(e.clientX, e.clientY).intersectObjects([...pages.map((p) => p.m), ...shelves], false)[0];
    if (!hit) return;
    if (hit.object.userData.page !== undefined) {
      if (kcState(local).pull < 1) return;
      const p = pages[hit.object.userData.page];
      const on = p.fwd.target ? 0 : 1;
      pages.forEach((q) => { q.fwd.target = 0; });
      p.fwd.target = on;
    } else {
      const b = hit.object.userData.books[hit.instanceId];
      if (!b) return;
      const s = pulls.get(b) || new Spring(0, { stiffness: 140, damping: 18 });
      const on = s.target ? 0 : 1;
      pulls.forEach((x) => { x.target = 0; });
      s.target = on;
      pulls.set(b, s);
    }
    stage.invalidate();
  });

  // the cursor parts the loose pages, and they come back when it leaves
  const typed = section.querySelector('[data-typed]');
  let shownTyped = -1, lastPointer = '';
  const ray = new THREE.Ray(), rel = new THREE.Vector3(), closest = new THREE.Vector3();
  function aimAway(f) {
    const P = f.pointer;
    const key = P.inside && P.type === 'mouse' ? `${P.x},${P.y}` : 'out';
    if (key === lastPointer) return;
    lastPointer = key;
    if (key === 'out') { loose.forEach((s) => s.aim.set(0, 0, 0)); return; }
    ray.copy(world.ray(P.x, P.y).ray);
    ray.origin.sub(origin);
    loose.forEach((s) => {
      ray.closestPointToPoint(s.pos, closest);
      rel.copy(s.pos).sub(closest);
      const d = rel.length();
      if (d < PART_R && d > 1e-4) s.aim.copy(rel.multiplyScalar(((PART_R - d) * 0.6) / d));
      else s.aim.set(0, 0, 0);
    });
  }

  const tmp = new THREE.Object3D(), face = new THREE.Object3D();
  const debug = {
    parted: () => Math.max(0, ...loose.map((s) => s.off.length())),
    state: () => ({ ...kcState(local) }),
    forward: (i) => pages[i].fwd.value,
    pulled: () => Math.max(0, ...[...pulls.values()].map((s) => s.value)),
    anchors: { manual: matched[2].pos.clone().add(origin) },
  };
  pages.forEach((p, i) => Object.defineProperty(debug.anchors, `source${i}`, { get: () => p.m.getWorldPosition(new THREE.Vector3()) }));

  return {
    group,
    debug,
    warm: Object.values(tex),
    update(t, f) {
      local = t;
      const visible = t > -1.2 && t < 1.7;
      group.visible = visible;
      if (!visible) return false;
      const st = kcState(t);
      if (st.typed !== shownTyped) { shownTyped = st.typed; typed.textContent = QUESTION.slice(0, st.typed); }
      [st.ticket, st.search, st.answer].forEach((o, k) => { overlays[k].material.opacity = o; overlays[k].visible = o > 0.001; });
      lights.forEach((g) => { g.material.opacity = 0.45 * st.light; g.visible = st.light > 0.001; });
      let busy = false;
      const camLocal = group.worldToLocal(f.camera.position.clone());
      pages.forEach((p) => {
        busy = p.fwd.step(f.dt) || busy;
        p.m.visible = st.pull > 0.01;
        if (!p.m.visible) return;
        const ctrl = p.from.clone().lerp(p.rest, 0.5).add(new THREE.Vector3(0, 1.4, 0.8));
        tmp.position.copy(bez(p.from, ctrl, p.rest, st.pull));
        tmp.quaternion.copy(p.fromQ).slerp(p.restQ, st.pull);
        if (p.fwd.value > 0.001) {
          face.position.copy(tmp.position);
          face.lookAt(camLocal);
          const toCam = camLocal.clone().sub(tmp.position).normalize();
          tmp.position.addScaledVector(toCam, 2.4 * p.fwd.value);
          tmp.quaternion.slerp(face.quaternion, p.fwd.value);
        }
        p.m.position.copy(tmp.position);
        p.m.quaternion.copy(tmp.quaternion);
        p.m.scale.setScalar(1 + 0.45 * p.fwd.value);
      });
      for (const [b, s] of pulls) {
        busy = s.step(f.dt) || busy;
        b.mesh.setMatrixAt(b.k, m4.compose(v3.copy(b.pos).addScaledVector(b.out, 0.4 * s.value), b.quat, b.scale));
        b.mesh.instanceMatrix.needsUpdate = true;
        if (s.target === 0 && s.value < 0.001) pulls.delete(b);
      }
      aimAway(f);
      const k = Math.min(1, f.dt / 120);
      let moved = false;
      loose.forEach((s) => {
        if (s.off.distanceToSquared(s.aim) > 1e-6) { s.off.lerp(s.aim, k); moved = true; }
        else s.off.copy(s.aim);
      });
      if (moved) { placeLoose(); busy = true; }
      return busy;
    },
    dispose() {
      offTap();
      typed.textContent = QUESTION;   // without the 3D, the question shows in full
      world.root.remove(group);
      disposeTree(group);
      Object.values(tex).forEach((x) => x.dispose());
    },
  };
}
```

- [ ] **Step 7: Fly the camera to the desk**

In `js/3d/paths.js`, replace the `knowcad` keys with:

```js
  knowcad: [
    { t: -0.4, at: [0, 0.2, -4], from: [0, 0.02, 1], d: 10 },
    { t: -0.1, at: [0.3, 0.3, -14], from: [0.04, 0.03, 1], d: 8 },
    { t: 0.15, at: [1.0, 0.2, -26], from: [0.02, 0.04, 1], d: 7 },
    { t: 0.42, at: [-0.2, 0.1, -33], from: [-0.06, 0.05, 1], w: 10.5, h: 6.5, stop: true, phone: { at: [1.6, -0.8, -33], w: 5.6, h: 9 } },
    { t: 0.6, at: [-0.2, 0.1, -33], from: [-0.06, 0.05, 1], w: 10.5, h: 6.5, stop: true, phone: { at: [1.6, -0.8, -33], w: 5.6, h: 9 } },
    { t: 0.65, at: [1.5, -2.5, -36], from: [0, 0.6, 1], d: 12 },   // leaves early: the flight onto the Awards wall runs to 1.0
  ],
```

- [ ] **Step 8: Write the failing smoke tests**

In `tests/browser/smoke.mjs`, replace the scenario `KnowCad: the sheets part for the cursor and come back when it leaves` with:

```js
scenario('KnowCad: the loose pages part for the cursor and come back when it leaves', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="knowcad"]'); scrollTo({ top: c.offsetTop + 0.08 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="knowcad"][data-live]', { timeout: 30000 });
  await sleep(500);
  const typed = await page.$eval('[data-typed]', (e) => e.textContent);
  check(typed.length > 0 && typed.length < 63, `the rep’s question is part-typed at this point (${JSON.stringify(typed)})`);
  for (const [x, y] of [[620, 420], [700, 450], [780, 480], [860, 500]]) { await page.mouse.move(x, y); await sleep(60); }
  await sleep(300);
  check(await page.evaluate(() => window.__world.mounted.get('knowcad').debug.parted() > 0.05), 'some pages moved aside');
  await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')));
  await page.waitForFunction(() => window.__world.mounted.get('knowcad').debug.parted() < 0.001, { timeout: 8000 }).catch(() => {});
  check(await page.evaluate(() => window.__world.mounted.get('knowcad').debug.parted() < 0.001), 'all back in place');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('KnowCad: at the payoff the answer and the three source pages are shown', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="knowcad"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="knowcad"][data-live]', { timeout: 30000 });
  await sleep(600);
  const st = await page.evaluate(() => window.__world.mounted.get('knowcad').debug.state());
  check(st.answer === 1 && st.pull === 1 && st.ticket === 1, `the answer is up and the pages have landed (${JSON.stringify(st)})`);
  check(await page.$eval('[data-typed]', (e) => e.textContent) === 'Licence “in use on another device” after moving to new laptops', 'the question is typed in full');
  for (let i = 0; i < 3; i++) {
    const p = await page.evaluate((i) => window.__world.debugProject('knowcad', `source${i}`), i);
    check(p && p.x > 0 && p.x < 1440 && p.y > 0 && p.y < 900, `source page ${i + 1} is on screen (${JSON.stringify(p)})`);
  }
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('KnowCad: a tap brings a source page forward and another puts it back; a tap pulls a manual out', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const c = document.querySelector('[data-scene="knowcad"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="knowcad"][data-live]', { timeout: 30000 });
  await sleep(600);
  const fwd = () => page.evaluate(() => window.__world.mounted.get('knowcad').debug.forward(0));
  let p = await page.evaluate(() => window.__world.debugProject('knowcad', 'source0'));
  await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__world.mounted.get('knowcad').debug.forward(0) > 0.9, { timeout: 6000 }).catch(() => {});
  check(await fwd() > 0.9, `the page came forward (${(await fwd()).toFixed(2)})`);
  p = await page.evaluate(() => window.__world.debugProject('knowcad', 'source0'));
  await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__world.mounted.get('knowcad').debug.forward(0) < 0.02, { timeout: 6000 }).catch(() => {});
  check(await fwd() < 0.02, 'and went back');
  const m = await page.evaluate(() => window.__world.debugProject('knowcad', 'manual'));
  await page.mouse.click(m.x, m.y);
  await page.waitForFunction(() => window.__world.mounted.get('knowcad').debug.pulled() > 0.5, { timeout: 6000 }).catch(() => {});
  check(await page.evaluate(() => window.__world.mounted.get('knowcad').debug.pulled()) > 0.5, 'the manual slid out');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('KnowCad: a swipe that starts on a source page does not bring it forward', async () => {
  const { page } = await open({ w: 390, h: 844 });
  await page.evaluate(() => { const c = document.querySelector('[data-scene="knowcad"]'); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('[data-scene="knowcad"][data-live]', { timeout: 30000 });
  await sleep(600);
  const p = await page.evaluate(() => window.__world.debugProject('knowcad', 'source0'));
  check(p !== null, 'the source page has an anchor');
  if (p) {
    await page.touchscreen.touchStart(p.x, p.y);
    for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(p.x, p.y - k * 30); await sleep(16); }
    await page.touchscreen.touchEnd();
    await sleep(600);
    check(await page.evaluate(() => window.__world.mounted.get('knowcad').debug.forward(0)) < 0.02, 'a swipe is not a tap');
  }
  await page.close();
});
```

- [ ] **Step 9: Build, delete the champion texture, and run everything for KnowCad**

Run:
```bash
python design/build_3d_assets.py
rm assets/3d/kc-champion.webp
python design/build_site.py
python -m pytest tests -q
npm test
ONLY="KnowCad" npm run smoke
```

Expected: all PASS. `tests/js/paths.test.js` passes: the keys are in order, the payoff is held from 0.42 to 0.6, and the last key is at 0.65 so the flight to Awards takes at least 0.3 of a screen.

If a source page is off screen at the payoff, move its `REST` entry toward x 2.5–3.8 or move the payoff `at[0]` right in steps of 0.3, and re-run. If the manual anchor (the desk stack) sits under the words, move the desk stack (`[-1.5, DESK.y, -32.2, 3]`) right to x −0.9.

- [ ] **Step 10: Look at it**

Run:
```bash
node tests/browser/shot.mjs --at=knowcad:-0.1 --out=../portfolio-tools/shots3d/kc-aisle.png
node tests/browser/shot.mjs --at=knowcad:0.5 --out=../portfolio-tools/shots3d/kc-payoff.png
node tests/browser/shot.mjs --at=knowcad:0.5 --size=390x844 --out=../portfolio-tools/shots3d/kc-payoff-phone.png
```

Read all three:
- **The aisle:** shelves of titled violet manuals on both sides with loose pages.
- **The payoff:** the rep's screen readable with the ticket on the left and KnowCad's answer and source tags on the right, three source pages beside the screen with their highlighted passage, and the words on the left clear of the screen.
- **On the phone:** the screen and at least two pages above the words.

Tune `REST`, `SCREEN` and the payoff keys until all of that holds.

- [ ] **Step 11: Commit**

```bash
git add -A design/build_3d_assets.py design/build_site.py assets/3d js/3d/chapters/knowcad.js js/3d/chapters/knowcad-timeline.js js/3d/paths.js tests/js/knowcad-timeline.test.js tests/test_assets.py tests/test_site.py tests/browser/smoke.mjs *.html
git commit -m "KnowCad: a support rep's desk at the end of an aisle of manuals; the ticket, the rep's question, three pages pulled from the manuals and KnowCad's answer with its sources"
```

---

### Task 6: Awards as a gallery wall with Slide and settle

**Files:**
- Modify: `js/3d/awards-timeline.js` (`awState` with `light`, plus `slidePose`, `SLIDE_MS`, `REST_Z`, `LIFT_Z`, `GAP_Z`)
- Modify: `js/3d/awards.js` (rewrite)
- Modify: `design/build_3d_assets.py` (`plaster()`, `main()`)
- Modify: `css/styles.css:153` (comment)
- Test: `tests/js/awards-timeline.test.js`, `tests/test_assets.py`, `tests/browser/smoke.mjs`

**Interfaces:**
- Consumes:
  - `sharpen` and `save` (Task 1)
  - the `aw-*` photos at full resolution (Task 1)
  - `createBoard` (`js/3d/board.js`)
  - `world.boxToWorld`, `world.top('awards')`, `world.origin('page')`
- Produces:
  - `awState(p, i) -> { light, board }`
  - `slidePose(t, { w, dir, back, fromX, fromZ }) -> { x, z }`
  - constants `SLIDE_MS = 500`, `REST_Z = -0.012`, `LIFT_Z = 0.09`, `GAP_Z = 0.004`
  - texture `aw-wall` (512×512)
  - debug `boardText(i)`, `resting(i)`, `topPhoto(i)` (unchanged names)

- [ ] **Step 1: Write the failing timeline tests**

Replace `tests/js/awards-timeline.test.js` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { awState, awProgress, slidePose, REST_Z, LIFT_Z } from '../../js/3d/awards-timeline.js';

test('the spotlights come up one after another, each board lands with its light, all done once the section is in', () => {
  assert.equal(awState(0, 0).light, 0);
  assert.ok(awState(0.4, 0).light > awState(0.4, 2).light);
  for (let i = 0; i < 3; i++) { const s = awState(1, i); assert.deepEqual([s.light, s.board], [1, 1]); }
});

test('arrival runs from the section top meeting the bottom of the screen to a tenth of the way down', () => {
  assert.equal(awProgress(900, 900), 0);
  assert.equal(awProgress(90, 900), 1);
  assert.ok(Math.abs(awProgress(495, 900) - 0.5) < 1e-9);
});

test('Next photo: the front photo lifts and glides out past the edge, then slips back in behind the others', () => {
  const o = { w: 0.8, dir: 1, back: -0.03 };
  assert.deepEqual(slidePose(0, o), { x: 0, z: REST_Z });
  const mid = slidePose(0.5, o);
  assert.ok(Math.abs(mid.x - 0.92) < 1e-9 && Math.abs(mid.z - LIFT_Z) < 1e-9, JSON.stringify(mid));
  const end = slidePose(1, o);
  assert.ok(Math.abs(end.x) < 1e-9 && Math.abs(end.z + 0.03) < 1e-9, JSON.stringify(end));
  let last = -1;
  for (let t = 0; t <= 0.5; t += 0.05) { const x = slidePose(t, o).x; assert.ok(x >= last); last = x; }
  assert.ok(slidePose(0.25, { ...o, dir: -1 }).x < 0, 'a drag to the left slides it out to the left');
});

test('a drag that commits carries on from where the hand let go', () => {
  const p = slidePose(0, { w: 0.8, dir: 1, back: -0.03, fromX: 0.4, fromZ: LIFT_Z });
  assert.deepEqual(p, { x: 0.4, z: LIFT_Z });
});
```

Run: `node --test tests/js/awards-timeline.test.js`

Expected: FAIL (`slidePose` isn't exported; `light` is undefined).

- [ ] **Step 2: Write the timeline**

Replace `js/3d/awards-timeline.js` with:

```js
// The Awards wall as numbers. p is how far the section has arrived: 0 when its top reaches the bottom of the
// screen, 1 when its top is a tenth of the way down. Frame i's spotlight comes up a little after frame i - 1's,
// and its flip-board lands with it. slidePose is Next photo: the front photo's path out and back in behind.
import { ramp, easeOut, easeInOut, lerp } from '../lib/motion.js';

export const SLIDE_MS = 500;
export const REST_Z = -0.012;   // the front photo, just behind the mat's window
export const LIFT_Z = 0.09;     // lifted clear of the frame's moulding
export const GAP_Z = 0.004;     // between photos in the stack

export const awProgress = (top, vh) => Math.min(1, Math.max(0, (vh - top) / (0.9 * vh)));
export const awState = (p, i) => ({
  light: easeOut(ramp(p, 0.15 + i * 0.12, 0.55 + i * 0.12)),
  board: ramp(p, 0.25 + i * 0.12, 0.7 + i * 0.1),
});

// The front photo's place at time t (0..1) of its slide, in the frame's units: in the first half it lifts in front
// of the frame and glides out past the edge (1.15 window widths, to the side `dir`); in the second it drops behind
// the mat and slides back in at `back`, behind the others. fromX and fromZ: where a drag let go of it.
export function slidePose(t, { w, dir = 1, back, fromX = 0, fromZ = REST_Z }) {
  const out = dir * 1.15 * w;
  if (t <= 0.5) {
    const k = easeInOut(t / 0.5);
    return { x: lerp(fromX, out, k), z: lerp(fromZ, LIFT_Z, Math.min(1, k * 3)) };
  }
  const k = easeInOut((t - 0.5) / 0.5);
  return { x: lerp(out, 0, k), z: lerp(LIFT_Z, back, Math.min(1, k * 3)) };
}
```

Run: `node --test tests/js/awards-timeline.test.js`

Expected: PASS. If `assert.deepEqual(slidePose(0, o), { x: 0, z: REST_Z })` fails on `-0` against `0`, change the test to compare with `Math.abs(…) < 1e-12` instead.

- [ ] **Step 3: Write the failing asset test and smoke tests**

In `tests/test_assets.py`, add:

```python
def test_the_awards_wall_is_a_dark_warm_tile():
    from PIL import Image, ImageStat
    with Image.open(ROOT / 'assets' / '3d' / 'aw-wall.webp') as im:
        assert im.size == (512, 512)
        r, g, b = ImageStat.Stat(im.convert('RGB')).mean
        assert r < 60 and r > b, (r, g, b)
```

In `tests/browser/smoke.mjs`:
- rename the scenario `Awards: the boards land on their placings, Next photo flicks, a tap opens the viewer` to `Awards: the boards land on their placings, Next photo slides, a tap opens the viewer`
- in it, change the label `'the flicked print settled'` to `'the photo settled'`
- add:

```js
scenario('Awards: a short drag springs back, a long drag moves to the next photo', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const a = document.getElementById('awards'); scrollTo({ top: a.offsetTop - 0.1 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('#awards .aw-stack[data-live]', { timeout: 30000 });
  await sleep(800);
  const box = await page.$eval('#win-sp .aw-stack', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const top = () => page.$eval('#win-sp .shot[data-on]', (a) => a.dataset.photo);
  const drag = async (dx) => {
    await page.mouse.move(box.x + box.w * 0.5, box.y + box.h * 0.45);
    await page.mouse.down();
    await page.mouse.move(box.x + box.w * 0.5 + dx, box.y + box.h * 0.45, { steps: 8 });
    await page.mouse.up();
  };
  const before = await top();
  await drag(40);
  await page.waitForFunction(() => window.__world.mounted.get('awards').debug.resting(0), { timeout: 8000 }).catch(() => {});
  check(await top() === before, 'a short drag springs back');
  await drag(box.w * 0.45);
  await page.waitForFunction((b) => document.querySelector('#win-sp .shot[data-on]').dataset.photo !== b && window.__world.mounted.get('awards').debug.resting(0), { timeout: 10000 }, before).catch(() => {});
  check(await top() !== before, `a long drag moved to the next photo (${before} → ${await top()})`);
  check(await page.evaluate(() => window.__world.mounted.get('awards').debug.topPhoto(0)) === await top(), 'the 3D frame shows the same photo in front');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});

scenario('Awards: Next photo pressed three times quickly ends on the gallery’s photo', async () => {
  const { page, errors } = await open();
  await page.evaluate(() => { const a = document.getElementById('awards'); scrollTo({ top: a.offsetTop - 0.1 * innerHeight, behavior: 'instant' }); });
  await page.waitForSelector('#awards .aw-stack[data-live]', { timeout: 30000 });
  await sleep(800);
  for (let i = 0; i < 3; i++) { await page.click('#win-dell [data-gal-step]'); await sleep(50); }
  await page.waitForFunction(() => window.__world.mounted.get('awards').debug.resting(1), { timeout: 10000 }).catch(() => {});
  await sleep(200);
  const html = await page.$eval('#win-dell .shot[data-on]', (a) => a.dataset.photo);
  check(await page.evaluate(() => window.__world.mounted.get('awards').debug.topPhoto(1)) === html, `the frame shows the gallery’s photo (${html})`);
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});
```

Run:
```bash
python -m pytest tests/test_assets.py -q -k awards_wall
ONLY="Awards:" npm run smoke
```

Expected: the pytest test FAILs (no `aw-wall`). The new drag scenario may fail on "a short drag springs back". Record whichever fail; the rewrite below must make all pass.

- [ ] **Step 4: Draw the wall texture**

In `design/build_3d_assets.py`, add after `kc_source`:

```python
def plaster():
    """A dark, warm plaster tile for the Awards wall: soft noise that repeats without a seam."""
    rng = random.Random(5)
    base = Image.new('L', (512, 512))
    base.putdata([max(0, min(255, round(128 + rng.gauss(0, 18)))) for _ in range(512 * 512)])
    big = Image.new('L', (1536, 1536))
    for x in range(3):
        for y in range(3):
            big.paste(base, (x * 512, y * 512))
    tile = big.filter(ImageFilter.GaussianBlur(2.2)).crop((512, 512, 1024, 1024))
    return Image.merge('RGB', [tile.point(lambda v, f=f: round(v * f)) for f in (0.27, 0.24, 0.2)])
```

In `main()`, after the award loop, add `save(plaster(), 'aw-wall', quality=80)`.

- [ ] **Step 5: Rewrite the Awards scene**

Replace `js/3d/awards.js` with:

```js
// Awards: the gallery wall (a page scene: the camera holds the page pose, and every object is fitted to its HTML
// box, so the 3D and the words line up). A dark, warm wall runs behind the section; each win is a framed shadow
// box of its real photos (a thin dark-gold moulding, an off-white mat, the photos stacked behind the mat's window,
// shown exactly as shot) under its own spotlight, with its placing on a small gold flip-board below like a
// plaque. As the section scrolls in the spotlights come up one after another and the boards turn to their
// placings, all tied to the scroll. Point at a frame and it tilts toward the pointer under a brighter light. Next
// photo (or a drag past a third of the photo) lifts the front photo out past the frame's edge and slips it in
// behind the others, showing the next; a short drag springs back; a tap opens the photo full size.
import * as THREE from 'three';
import { createBoard } from './board.js';
import { loadTexture, glow, disposeTree, nextFrame } from './textures.js';
import { fitScale } from '../lib/fit.js';
import { Spring } from '../lib/motion.js';
import { awState, awProgress, slidePose, SLIDE_MS, REST_Z, LIFT_Z, GAP_Z } from './awards-timeline.js';
import { onTap } from './tap.js';

const WARM = 0xffd49a;
const FRAME = { w: 1, h: 1 / 1.5, mould: 0.045, depth: 0.06 };   // built one unit wide, scaled to its 3:2 box
const OPEN = { w: 0.8, h: 0.8 / 1.5 };                            // the mat's window

// the wall fades out at its edges into the page's own dark
function fadeMap() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  const edge = (u) => Math.min(1, Math.min(u, 1 - u) / 0.18);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const a = edge(x / 255) * edge(y / 255);
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(a * a * (3 - 2 * a) * 255);
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}

// a shadow-box frame: dark-gold moulding, an off-white mat with a window, a dark back
function frameBox() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0x7a5c2a, metalness: 0.85, roughness: 0.32 });
  const { w, h, mould: m, depth: d } = FRAME;
  const bar = (bw, bh, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), gold); b.position.set(x, y, d / 2); g.add(b); };
  bar(w, m, 0, h / 2 - m / 2);
  bar(w, m, 0, -h / 2 + m / 2);
  bar(m, h - 2 * m, -w / 2 + m / 2, 0);
  bar(m, h - 2 * m, w / 2 - m / 2, 0);
  const iw = w - 2 * m, ih = h - 2 * m;
  const shape = new THREE.Shape();
  shape.moveTo(-iw / 2, -ih / 2); shape.lineTo(iw / 2, -ih / 2); shape.lineTo(iw / 2, ih / 2); shape.lineTo(-iw / 2, ih / 2); shape.lineTo(-iw / 2, -ih / 2);
  const hole = new THREE.Path();
  hole.moveTo(-OPEN.w / 2, -OPEN.h / 2); hole.lineTo(-OPEN.w / 2, OPEN.h / 2); hole.lineTo(OPEN.w / 2, OPEN.h / 2); hole.lineTo(OPEN.w / 2, -OPEN.h / 2); hole.lineTo(-OPEN.w / 2, -OPEN.h / 2);
  shape.holes.push(hole);
  const mat = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: 0xeee9df, roughness: 0.95, metalness: 0 }));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0x0e0d0b, roughness: 1 }));
  back.position.z = -0.08;
  g.add(mat, back);
  return g;
}

// a photo on thin white paper, big enough to fill the window, shown exactly as shot (not lit)
function photo(tex) {
  const a = tex.image.width / tex.image.height;
  const pw = Math.max(OPEN.w, OPEN.h * a) * 1.02, ph = pw / a;
  const g = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(pw + 0.03, ph + 0.03), new THREE.MeshBasicMaterial({ color: 0xf4f2ed }));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  pic.position.z = 0.001;
  g.add(paper, pic);
  return g;
}

export async function mount({ world, stage, section }) {
  const items = [...section.querySelectorAll('.aw')];
  const group = new THREE.Group();
  const wallTex = await loadTexture('assets/3d/aw-wall.webp');
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: wallTex, alphaMap: fadeMap(), transparent: true, depthWrite: false, roughness: 0.95, metalness: 0 }));
  wall.renderOrder = -2;
  group.add(wall);

  const frames = [];
  for (const [i, el] of items.entries()) {
    const stackEl = el.querySelector('.aw-stack'), placeEl = el.querySelector('.aw-place');
    const shots = [...stackEl.querySelectorAll('.shot')];
    const tex = await Promise.all(shots.map((s) => loadTexture(`assets/3d/aw-${s.dataset.photo}.webp`)));
    const frame = frameBox();
    const prints = tex.map((t) => { const p = photo(t); frame.add(p); return p; });
    const pool = glow(WARM, 1, 1, 0), beam = glow(WARM, 1, 1, 0);
    const text = placeEl.textContent.trim().toUpperCase();
    const board = await createBoard({ rows: [{ text, color: 'gold' }], scrub: true });
    group.add(pool, beam, frame, board.group);
    const top = shots.findIndex((s) => s.hasAttribute('data-on'));
    frames.push({
      i, el, stackEl, placeEl, shots, prints, frame, pool, beam, board, tex,
      order: prints.map((_, k) => (k + Math.max(0, top)) % prints.length),   // order[0] is in front
      tiltX: new Spring(0, { stiffness: 120, damping: 20 }), tiltY: new Spring(0, { stiffness: 120, damping: 20 }),
      bright: new Spring(0, { stiffness: 120, damping: 20 }),
      hover: null, drag: null, slide: null, back: null, pending: undefined, byHand: false, fromDrag: false,
    });
    await nextFrame();
  }
  world.root.add(group);

  const fitOf = (s) => world.boxToWorld(s.stackEl, 'page');
  let k = stage.view.k;
  const reorder = (s, top) => { s.order = s.prints.map((_, j) => (j + top) % s.prints.length); };
  // the gallery script (js/script.js) is the one source of truth: it moves data-on and tells us
  function onGal(s, e) {
    if (s.fromDrag) { s.fromDrag = false; reorder(s, e.detail.index); return; }
    s.pending = e.detail.index;
    if (s.slide) return;   // the latest press wins when this slide lands
    s.drag = null;
    s.back = null;
    s.slide = { t: 0, dir: 1, fromX: 0, fromZ: REST_Z, pi: s.order[0] };
    stage.invalidate();
  }
  const listeners = [];
  const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); listeners.push([el, type, fn, opts]); };
  frames.forEach((s) => {
    on(s.stackEl, 'gal:show', (e) => onGal(s, e));
    on(s.stackEl, 'pointermove', (e) => {
      const r = s.stackEl.getBoundingClientRect();
      s.hover = { u: (e.clientX - r.left) / r.width - 0.5, v: (e.clientY - r.top) / r.height - 0.5 };
      if (s.drag && e.pointerId === s.drag.id) { s.drag.dx = e.clientX - s.drag.x0; s.drag.dy = e.clientY - s.drag.y0; }
      stage.invalidate();
    });
    on(s.stackEl, 'pointerleave', () => { s.hover = null; stage.invalidate(); });
    on(s.stackEl, 'pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button') || s.slide || s.back) return;
      s.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
      s.stackEl.setPointerCapture(e.pointerId);
      e.preventDefault();   // a press here is a drag of the photo, not a text selection or a link follow
    });
    const release = (e, cancelled) => {
      const d = s.drag;
      if (!d || e.pointerId !== d.id) return;
      s.drag = null;
      if (!cancelled && Math.hypot(d.dx, d.dy) < 6) { s.shots[s.order[0]].click(); return; }   // a tap: full size
      const x = (d.dx * k) / fitOf(s).w;   // in the frame's units (the frame is one unit wide)
      if (!cancelled && Math.abs(x) > OPEN.w / 3) {
        s.slide = { t: 0, dir: Math.sign(x), fromX: x, fromZ: LIFT_Z, pi: s.order[0] };
        s.byHand = true;
      } else {
        s.back = { x, t: 0 };   // not far enough: it springs back
      }
      stage.invalidate();
    };
    on(s.stackEl, 'pointerup', (e) => release(e, false));
    on(s.stackEl, 'pointercancel', (e) => release(e, true));   // a touch that turned into a scroll
    // the placing's board flickers under the mouse and ripples on a tap, like the name board
    const ndc = (e) => new THREE.Vector2((e.clientX / stage.view.w) * 2 - 1, -(e.clientY / stage.view.h) * 2 + 1);
    on(s.placeEl, 'pointermove', (e) => { if (e.pointerType === 'mouse') { s.board.hover(s.board.pick(stage.camera, ndc(e))); stage.invalidate(); } });
    on(s.placeEl, 'pointerleave', () => s.board.hover(-1));
    s.offTap = onTap(s.placeEl, (e) => { s.board.ripple(s.board.pick(stage.camera, ndc(e))); stage.invalidate(); });
    s.next = s.stackEl.querySelector('[data-gal-step]');
  });

  const debug = {
    boardText: (i) => frames[i].board.text(),
    resting: (i) => !frames[i].slide && !frames[i].drag && !frames[i].back,
    topPhoto: (i) => frames[i].shots[frames[i].order[0]].dataset.photo,
  };
  return {
    group,
    debug,
    warm: [...frames.flatMap((s) => s.tex), wallTex],
    update(local, f) {
      k = stage.view.k;
      let busy = false;
      const boxes = frames.map(fitOf);
      const visible = boxes.some((b) => Math.abs(b.y - world.origin('page').y) < 40);
      group.visible = visible;
      if (!visible) return false;
      const arrival = awProgress(world.top('awards'), f.vh);
      const z0 = boxes[0].z;
      // the wall behind every frame and its words, fading into the page at its edges
      const left = Math.min(...boxes.map((b) => b.x - b.w / 2)), right = Math.max(...boxes.map((b) => b.x + b.w / 2));
      const top = Math.max(...boxes.map((b) => b.y + b.h / 2)), bottom = Math.min(...boxes.map((b) => b.y - b.h / 2));
      const ww = (right - left) * 1.6, wh = top - bottom + boxes[0].h * 2.4;
      wall.scale.set(ww, wh, 1);
      wall.position.set((left + right) / 2, (top + bottom) / 2, z0 - 0.3);
      wallTex.repeat.set(ww / (boxes[0].w * 0.6), wh / (boxes[0].w * 0.6));
      frames.forEach((s, i) => {
        const b = boxes[i];
        const st = awState(arrival, i);
        const scale = fitScale({ w: FRAME.w, h: FRAME.h }, b);
        s.frame.scale.setScalar(scale);
        s.frame.position.set(b.x, b.y, z0);
        // hover: the frame tilts toward the pointer (at most 4° each way) and its light brightens
        const h = s.hover && !s.drag && !s.slide ? s.hover : null;
        s.tiltX.target = h ? h.v * 0.14 : 0;
        s.tiltY.target = h ? h.u * 0.14 : 0;
        s.bright.target = h ? 1 : 0;
        for (const sp of [s.tiltX, s.tiltY, s.bright]) busy = sp.step(f.dt) || busy;
        s.frame.rotation.set(s.tiltX.value, s.tiltY.value, 0);
        // the photos: stacked behind the window; the front one follows a drag, springs back, or slides
        if (s.slide) { s.slide.t = Math.min(1, s.slide.t + f.dt / SLIDE_MS); busy = true; }
        else if (s.back) { s.back.t = Math.min(1, s.back.t + f.dt / 260); busy = true; }
        const n = s.prints.length;
        s.order.forEach((pi, depth) => {
          const p = s.prints[pi];
          p.position.set(0, 0, REST_Z - depth * GAP_Z);
          if (depth !== 0) return;
          if (s.drag) p.position.set((s.drag.dx * k) / b.w, 0, LIFT_Z);
          else if (s.back) {
            const e = 1 - (1 - s.back.t) ** 3;
            p.position.set(s.back.x * (1 - e), 0, LIFT_Z + (REST_Z - LIFT_Z) * e);
          }
        });
        if (s.slide) {
          const pose = slidePose(s.slide.t, { w: OPEN.w, dir: s.slide.dir, back: REST_Z - n * GAP_Z, fromX: s.slide.fromX, fromZ: s.slide.fromZ });
          s.prints[s.slide.pi].position.set(pose.x, 0, pose.z);
          if (s.slide.t >= 1) {
            s.slide = null;
            if (s.byHand) { s.byHand = false; s.fromDrag = true; s.pending = undefined; s.next.click(); }   // the gallery moves on (and tells us)
            else if (s.pending !== undefined) { reorder(s, s.pending); s.pending = undefined; }
          }
        }
        if (s.back && s.back.t >= 1) s.back = null;
        // the spotlight: a warm pool on the wall around the frame and a soft beam above it
        const lit = st.light;
        s.pool.position.set(b.x, b.y + b.h * 0.12, z0 - 0.28);
        s.pool.scale.set(b.w * 1.9, b.h * 2.3, 1);
        s.pool.material.opacity = 0.2 * lit + 0.1 * s.bright.value;
        s.beam.position.set(b.x, b.y + b.h * 1.05, z0 - 0.29);
        s.beam.scale.set(b.w * 0.7, b.h * 2.2, 1);
        s.beam.material.opacity = 0.07 * lit + 0.04 * s.bright.value;
        s.pool.visible = s.beam.visible = lit > 0.001 || s.bright.value > 0.001;
        // the placing on its flip-board, turned up with the scroll
        const pb = world.boxToWorld(s.placeEl, 'page');
        s.board.group.scale.setScalar(fitScale(s.board.size, pb));
        s.board.group.position.set(pb.x, pb.y, pb.z);
        s.board.scrub(st.board);
        busy = s.board.update(f.now, f.dt) || busy;
      });
      return busy;
    },
    dispose() {
      listeners.forEach(([el, type, fn, opts]) => el.removeEventListener(type, fn, opts));
      frames.forEach((s) => { s.offTap(); s.board.dispose(); });
      world.root.remove(group);
      disposeTree(group);
    },
  };
}
```

Change the CSS comment at `css/styles.css:153` from "a table and the placings flip-boards, fitted into .aw-stack and .aw-place" to "a framed shadow box on a gallery wall, and the placings' flip-boards, fitted into .aw-stack and .aw-place".

- [ ] **Step 6: Build and run every Awards test**

Run:
```bash
python design/build_3d_assets.py
python design/build_site.py
python -m pytest tests -q
npm test
ONLY="Awards" npm run smoke
ONLY="award print" npm run smoke
ONLY="pinch-zoom" npm run smoke
```

Expected: all PASS, including:
- the boards' placings
- Next photo
- the viewer on a tap
- the short and long drags
- the quick triple press
- the vertical swipe that still scrolls
- the screen-reader checks (`fix: Awards keeps its words…`)

- [ ] **Step 7: Look at it**

Run:
```bash
node tests/browser/shot.mjs --at=#awards:0 --out=../portfolio-tools/shots3d/aw-wall.png
node tests/browser/shot.mjs --at=#awards:0 --size=390x844 --out=../portfolio-tools/shots3d/aw-wall-phone.png
```

Read both. Expected:
- three gold-framed photos on a dark warm wall, each under a soft spotlight
- the photos sharp and true in colour
- the flip-boards as plaques
- the wall's edges fading into the page, with no hard rectangle
- on the phone, frames in a column

If a hard wall edge shows, raise the `fadeMap` margin from `0.18` to `0.25`.

- [ ] **Step 8: Commit**

```bash
git add -A design/build_3d_assets.py assets/3d js/3d/awards.js js/3d/awards-timeline.js css/styles.css tests/js/awards-timeline.test.js tests/test_assets.py tests/browser/smoke.mjs *.html
git commit -m "Awards: framed photos on a lit gallery wall, sharp and true; Next photo lifts the front photo out and slips it in behind"
```

---

### Task 7: The About words

**Files:**
- Modify: `design/build_site.py` (`ABOUT_FACTS`, a new `ABOUT_INTRO`, the About markup at `:854-860`)
- Modify: `css/styles.css` (after `.facts3 .mono`)
- Test: `tests/test_site.py`

**Interfaces:**
- Produces: `ABOUT_INTRO` (str), and the markup `<div class="me-text"><p class="me-intro">…</p><dl class="facts3" id="credentials">…</dl></div>`

- [ ] **Step 1: Write the failing test**

In `tests/test_site.py`:
- in `COPY`, replace the two lines for Study and Leadership with:

```python
    'Study', 'Diploma in Information Technology · Singapore Polytechnic · 2025–2028',
    'Leadership', 'Secretary, Youth Harmony Chapter subcommittee · Class Chairman · SP ACER',
    'I study IT at Singapore Polytechnic. I build for one real person first: a youth worker at midnight, '
    'someone who can’t rely on their speech, a barber with a full day of bookings.',
```

- add `'(expected)'` to `GONE`

Run: `python -m pytest tests/test_site.py -q -k "copy_deck or removed"`

Expected: FAIL (the intro is missing, and "(expected)" is present).

- [ ] **Step 2: Change the words and the markup**

In `design/build_site.py`, replace `ABOUT_FACTS` with:

```python
ABOUT_INTRO = ('I study IT at Singapore Polytechnic. I build for one real person first: a youth worker at midnight, '
               'someone who can’t rely on their speech, a barber with a full day of bookings.')
ABOUT_FACTS = [
    ('Study', 'Diploma in Information Technology · Singapore Polytechnic · 2025–2028', ''),
    ('Leadership', 'Secretary, Youth Harmony Chapter subcommittee · Class Chairman · SP ACER', ''),
    ('Stack', 'TypeScript · React / Next.js · Node.js / Express · Python / FastAPI · SQL', 'mono'),
]
```

In the About section's markup, replace `<dl class="facts3" id="credentials">{facts}</dl>` with:

```python
        <div class="me-text"><p class="me-intro">{e(ABOUT_INTRO)}</p><dl class="facts3" id="credentials">{facts}</dl></div>
```

In `css/styles.css`, after the `.facts3 .mono{…}` rule, add:

```css
.me-intro{margin:0 0 clamp(28px,4vh,40px);font-size:clamp(22px,2vw,30px);line-height:1.35;max-width:34ch;color:var(--ink)}
```

- [ ] **Step 3: Rebuild and run the page tests**

Run:
```bash
python design/build_site.py
python -m pytest tests/test_site.py -q
```

Expected: PASS. That includes the banned-words test and the dead-CSS-class test (`me-text` has no rule of its own; if the dead-class test flags it, drop the class from the markup and keep a bare `<div>`).

- [ ] **Step 4: Look at it**

Run: `node tests/browser/shot.mjs --at=#about:0 --out=../portfolio-tools/shots3d/about.png`, then read the image.

Expected:
- the intro in large text above Study, Leadership and Stack, beside the portrait
- no "(expected)"

- [ ] **Step 5: Commit**

```bash
git add design/build_site.py css/styles.css tests/test_site.py *.html
git commit -m "About: a short intro, tighter Study and Leadership lines, no '(expected)'"
```

---

### Task 8: Stills, the README, the full checks, the review and the handoff

**Files:**
- Modify: `assets/3d/stills/*` (re-rendered), `README.md:15-19`
- Test: everything

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write the failing phone check**

Add to `tests/browser/smoke.mjs`:

```js
scenario('at 390px every changed chapter goes live without errors', async () => {
  const { page, errors } = await open({ w: 390, h: 844 });
  for (const scene of ['signalbridge', 'boss-breaker', 'better-call-bhai', 'meant', 'knowcad']) {
    await page.evaluate((s) => { const c = document.querySelector(`[data-scene="${s}"]`); scrollTo({ top: c.offsetTop + 0.5 * innerHeight, behavior: 'instant' }); }, scene);
    await page.waitForSelector(`[data-scene="${scene}"][data-live]`, { timeout: 30000 }).catch(() => {});
    check(await page.$(`[data-scene="${scene}"][data-live]`) !== null, `${scene} is live at 390px`);
  }
  await page.evaluate(() => { const a = document.getElementById('awards'); scrollTo({ top: a.offsetTop, behavior: 'instant' }); });
  await page.waitForSelector('#awards .aw-stack[data-live]', { timeout: 30000 }).catch(() => {});
  check(await page.$('#awards .aw-stack[data-live]') !== null, 'Awards is live at 390px');
  check(errors.length === 0, `no errors ${errors.join(' | ')}`);
  await page.close();
});
```

Run: `ONLY="every changed chapter goes live" npm run smoke`

Expected: PASS if Tasks 1–6 hold on phones. This check guards against phone-only errors, such as an empty `matched` book on phones. If it fails, fix the scene it names before going on.

- [ ] **Step 2: Re-render the stills**

Run:
```bash
npm run stills -- signalbridge boss-breaker better-call-bhai meant knowcad
python design/build_site.py
python -m pytest tests/test_assets.py -q
ONLY="still" npm run smoke
```

Expected:
- each still is written with no errors
- `test_each_rendered_still_shows_its_scene` passes
- every chapter's still matches its live payoff (mean difference under 2)

- [ ] **Step 3: Update the README**

In `README.md`, replace these whole bullet lines:

- The line starting `  - **Boss Breaker**, the raid:` with:
  `  - **Boss Breaker**, the raid: the real Boss Raid screen large under the Stress Dragon's health bar, the phone, a hand of the six real challenges as cards (each with its own icon, points and creator) and the leaderboard as bars. The scroll drains the boss to the 1,840 HP in the captures; a click anywhere (or Attack) plays the front card at the boss for 350 and the next comes to the front, until "Stress Dragon defeated". Scrolling back above the chapter resets the fight.`
- The line starting `  - **Better Call Bhai**, the shop:` with:
  `  - **Better Call Bhai**, the shop: two glass barber poles in the shop's yellow, black and white (grab one and spin it), the phone stepping through the real booking to Booking Confirmed, and the day's real time slots lifting onto a wall behind it as rounded 3D pills with crisp times (the taken ones dimmed and struck through, 15:00 in yellow); a pill lifts under the mouse.`
- In the line starting `  - **MEANT**, a café table:`, replace `The reply tiles rise off the tablet` with `The four replies rise off the tablet as clean cards`, and replace `the Tamil Murasu page lies on it and opens the article.` with `the Tamil Murasu page lies on it as a folded newspaper; press it and the camera glides into it before the article opens.`
- The line starting `  - **KnowCad**, the archive:` with:
  `  - **KnowCad**, the support rep's desk: the camera flies down an aisle of manuals to a rep's screen; a customer's licence ticket lands, the rep's question types out, three manuals light up and a page slides out of each to the desk with its passage highlighted, and KnowCad's suggested answer appears with its three sources. The screen and pages are drawn in KnowCad's style as an example (the product is private). Loose pages part around the cursor; tap a source page to bring it forward, or a manual to pull it out.`
- In the line starting `- **Awards** (`#awards`) is a photo table:`, replace everything up to `Under each:` with:
  `- **Awards** (`#awards`) is a gallery wall: each win is a framed shadow box of its real photos (dark-gold moulding, off-white mat) under its own spotlight, the spotlights coming up one after another as the section arrives and each placing turning up on a small gold flip-board below like a plaque. Point at a frame and it tilts toward you; Next photo (or a drag past a third of the photo) lifts the front photo out past the frame and slips it in behind the others; a short drag springs back; a tap opens the full-screen viewer. Under each:`

- [ ] **Step 4: Run the full checks**

Run:
```bash
python design/build_site.py
npm test > ../portfolio-tools/v3-unit.log 2>&1; tail -5 ../portfolio-tools/v3-unit.log
python -m pytest tests -q > ../portfolio-tools/v3-py.log 2>&1; tail -2 ../portfolio-tools/v3-py.log
npm run smoke > ../portfolio-tools/v3-smoke.log 2>&1; grep -E "✗" ../portfolio-tools/v3-smoke.log; tail -2 ../portfolio-tools/v3-smoke.log
npm run perf -- desk
npm run perf -- phone
PYTHONIOENCODING=utf-8 python design/check_site.py --unchanged
```

Expected:
- unit tests: all pass, 0 fail
- pytest: all pass
- smoke: "all passed"
- perf on desk: slow under 5%, longest at most 100 ms, jerk p99 at most 41 px, 0 out-of-sync
- perf on phone: slow under 5%, longest at most 100 ms, 0 out-of-sync
- check_site: "the committed pages match the generator" (after Step 5's commit; before it, run it after committing)

If perf fails on KnowCad (the slow frames' locations print as `ms@screens`; KnowCad sits at about 7.5–8.5 screens on the desk):
- lower `nLoose` to 60 on the desk
- lower `units` to 7 on the desk

Re-run.

- [ ] **Step 5: Commit**

```bash
git add -A assets/3d/stills README.md tests/browser/smoke.mjs *.html
git commit -m "Stills for every changed chapter, a phone check, and the README for v3"
```

- [ ] **Step 6: Final review**

Follow superpowers:executing-plans' Final Review:
- package the branch since the v3 spec commit (`git log --format=%h -1 --grep="Spec for homepage v3"` gives the base)
- dispatch one fresh reviewer on the most capable model with the spec, this plan, its Review Focus and the ledger's `Ruling:` lines
- fix Critical and Important findings in one pass, each with a test that failed first
- ledger the minors

- [ ] **Step 7: Screenshots and recordings to Mruthulan**

Run the screenshot loop at both sizes for each place:
- `hero:0`
- `signalbridge:0.5`
- `boss-breaker:0.5`
- `better-call-bhai:0.5`
- `meant:0.5`
- `knowcad:0.5`
- `#awards:0`
- `#about:0`
- `#contact:0`

The shots go to `$SCRATCHPAD/v3/`. Tile them into `desk-payoffs.jpg` and `phone-payoffs.jpg` as before. Then record:

```bash
node tests/browser/review.mjs --from=0 --to=end --size=1440x900 --frames=180 --ms=80 --out=$SCRATCHPAD/v3/walkthrough-desk.webp
node tests/browser/review.mjs --from=0 --to=end --size=390x844 --frames=200 --ms=80 --out=$SCRATCHPAD/v3/walkthrough-phone.webp
```

Read the contact sheets before sending. Send them with SendUserFile:
- the two contact sheets
- the two recordings
- a rulings file

In the final message cover:
- what changed for each of Mruthulan's points
- the perf numbers
- the rulings, including the three above: the existing site-wide fade, the dragon's source size and the Awards budget
- the deferred minors
- a request to check on a real phone and laptop
- whether it's ready to push

No push until Mruthulan says so. Then delete this plan's ledger workspace and use superpowers:finishing-a-development-branch.
