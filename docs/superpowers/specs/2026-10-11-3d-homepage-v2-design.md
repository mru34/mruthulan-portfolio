# 3D homepage, version 2: immersive, fast, smooth

Date: 11 October 2026 · Branch: `redesign-3d` · Status: approved by Mruthulan (with the Awards additions Mruthulan asked for)

This replaces the flow, pacing, look, chapters and Awards of the first spec (`2026-10-11-3d-homepage-design.md`, "v1"). Where this document is silent, v1 still holds. These v1 sections stand unchanged: Rules carried over (except the two rules changed below), Every word on the homepage (with the changes below), Writing rules, Project facts, Typography, Fallbacks, Accessibility, Analytics.

## Why

Mruthulan reviewed part 1 (the name board and SignalBridge) and found:

- **Too slow to scroll:**
  - about 18 screens in all
  - 2½ screens per project
  - 2 nearly empty screens of "Five projects."
  - a glide that moved the page after scrolling stopped
- **Choppy:** a mouse wheel moves the page in steps, and the 3D followed the steps.
  - The smoothness test scrolled with a script, so it never saw this.
- **Hard to see:** the phone and laptop filled less than half the screen, and the app's dark screens sat on a dark page.
- **Too little 3D:** one project in 3D, four projects with none.
- **Awards unchanged.**

Mruthulan asked for it to be clean, very interactive, fast, more eye-catching, with lots of 3D elements filling the whole screen: an immersive experience.

## What success looks like

1. **Smooth:** a mouse wheel or trackpad glides with momentum, and the 3D never trails the page. Measured with real wheel input, not script scrolling (see Testing).
2. **Fast:**
   - the homepage has at most 12 screens of scrolling on a laptop (`scrollHeight - innerHeight`)
   - each project takes about 1.6 screens
   - the first project's result is visible within 2.5 screens of the top
3. **Immersive:** every project is a 3D scene that fills the screen edge to edge, with several real objects at different depths and a camera that moves through it.
4. **All of it:** all five projects, Awards and the ending board are 3D. Each project has its own thing to touch, and no two are alike.
5. **Still real:** no generated imagery, every screen a real capture, real sizes, real shadows. Mruthulan judges it next to apple.com/airpods-pro, landonorris.com, lusion.co and linear.app.

## Rules changed from v1

- **Scrolling:** v1 said "Native scrolling". Now a mouse wheel and trackpad are smoothed by Lenis (see How it is built), which still scrolls the real page.
  - Touch keeps the phone's own scrolling.
  - Keyboard, links, find-in-page and the scrollbar all work.
  - With reduced motion, Lenis is not started.
- **No snap:** the page never moves by itself. The glide after scrolling stops (`snap()` in `js/home.js`, `snapTarget` in `js/lib/scrollnav.js`) is removed.
- **Colour:** v1 allowed project colour only as a thin edge light. Now each project's colour lights its whole scene:
  - its coloured lights
  - a large soft glow behind the main objects
  - a pool of that light on the floor
  - the project name and result in that colour

  Between projects the page returns to near-black.
- **Still banned:**
  - lens flares
  - neon outlines
  - chromatic aberration
  - rainbow or purple-blue gradients
  - random floating shapes
  - hologram UI
  - full-screen post-processing (bloom passes, which also cost phones too much)

  Glow is made with lights and soft gradient sprites.

## The page, top to bottom

1. **Header:** as v1, with icons on every page.
2. **Hero:** the 3D name board and three icon links, as built in part 1. As the visitor scrolls, the board tilts back and the camera flies past it straight into SignalBridge.
3. **Five project chapters,** one after another.
4. **Awards:** the photo table.
5. **About:** portrait and three facts, as v1.
6. **Ending:** the internship board, *Reach out* and three icon links.
7. **Footer.**

**"Five projects." and the gold dust are removed** (`js/3d/flythrough.js`, the `.fly` section and its CSS).

## Pacing

- **Chapter:** each chapter is 1.6 screens of scrolling, in two parts:
  - 0.6 screen where its words are pinned and the camera moves through its scene
  - 1 screen where the next chapter slides in while the camera flies from one scene to the next
- **Hero:** 1 screen. **Awards**, **About** and the **ending** are not pinned. They take their natural height: about 1.2 screens for Awards on a laptop, one screen each for the others.
- **In all,** that comes to about 11.4 screens of scrolling on a laptop.
- **Keyframes:** every scene has its keyframes tied to scroll position, so scrolling back plays it backwards.
- **The three beats from v1 stay:**
  1. the name arrives as the chapter enters
  2. the line appears as its scene starts moving
  3. the result and *Case study →* appear by 70% of the pinned part, and stay until the chapter leaves
- **The side rail** marking the five chapters stays.

## The world

- **One world:** there is one 3D world and one camera.
  - The scenes sit one after another along the camera's path, so moving between projects is a real camera flight, never a cut or a blank screen.
  - The hero board sits at the start of the path, and the Awards table and the ending board at the end.
- **Two kinds of section:**
  - **Flight sections** are the five chapters. The camera moves along the path with the scroll.
  - **Page sections** are the hero at rest, Awards and the ending. The camera holds one fixed pose, and their 3D is fitted to HTML boxes as in part 1, so objects and words always line up and scroll together.
  - **Between the two kinds,** the camera blends: the hero hands into SignalBridge, and KnowCad hands into the Awards table.
- **The studio rig travels with the camera:**
  - **Fixed lights:** a soft key light from the top left, a dim fill, and two coloured lights that take each project's colour as the camera arrives.
  - **No recompiles:** the set of lights never changes, so the GPU never recompiles shaders mid-scroll.
- **Words:** each chapter's words (number, name, line, result, *Case study →*) are HTML over the scene. They sit in a corner that changes from chapter to chapter, over a soft dark shade so they stay readable. On phones they sit along the bottom.
- **Loading:** a scene's code, textures and font load when the visitor is within one chapter of it. They are freed when the visitor is two chapters past it.
- **On phones:** the same scenes with fewer background objects (marked per object as `desk-only`).

## The chapters

Every screen is a real capture, cropped or resized by `design/build_3d_assets.py`. Every object is built in code at real size. The words in each chapter are the v1 copy deck.

### 01 · SignalBridge (teal): the control room at night

- **Opening:** the youth's phone close up, filling most of the screen, showing her chat (`m-youth-chat`).
- **Pull back:** the camera pulls back to show the rest of SignalBridge's real screens standing in rows into the dark like a control room, each one a lit display panel. The screens are:
  - the youth preview (`m-youth-preview`, `d-youth-preview`)
  - the worker's cases (`d-worker-cases`)
  - youths (`d-worker-youths`)
  - signal radar (`d-worker-signal-radar`)
  - the supervisor view (`d-supervisor`), cropped so the "Signed in as" corner is not shown

  Never shown: `d-worker-cockpit`, `d-cockpit`.
- **Crossing:** the message (`sb-message`) lifts off the phone. The camera follows it along the beam of light, through the consent card (`sb-consent-ask` turning to `sb-consent-given`), until the laptop fills most of the screen showing the handoff brief (`sb-laptop-brief`). The brief is readable at the payoff.
- **Touch:**
  - moving the mouse turns the camera slightly to look around the room
  - tapping the consent card flips it between asking and given (decorative: hidden from screen readers, since the words carry the meaning)
- **Reuse:** the existing phone, laptop, beam and consent card are kept, and placed at a larger scale.

### 02 · Boss Breaker (orange): the raid

- **Back:** the Boss Raid screen on a large display at the back of an arena (`d-boss`).
- **Health bar:** a 3D health bar across the full width of the screen, labelled with HTML: *Stress Dragon* and the HP.
- **Front:**
  - the phone with the raid screen (`m-boss`)
  - a fan of challenge cards cropped from the real Challenges page (`d-challenges`)
  - the leaderboard's rows standing as 3D bars sized by their real total damage (crop and numbers from `d-boss`)
- **Scroll:** the bar drains from 5,000 to 1,780 HP, the number in the capture, so bar and screen agree at the payoff.
- **Touch:**
  - clicking anywhere in the scene, or the *Attack* button (a real button, keyboard reachable), hits the boss for 350
  - a challenge card flies from the fan into the boss, −350 pops up (HTML), the scene shakes once and the bar drops
  - at 0: *Stress Dragon defeated*
  - the HP is announced politely to screen readers
  - it resets when the visitor scrolls back above the chapter

### 03 · Better Call Bhai (yellow): the shop

- **Poles:** two tall barber poles frame the screen: glass tubes with yellow, black and white stripes, and chrome caps. They turn as the visitor scrolls.
- **Phone:** in the middle, it steps through the real booking with the scroll: home, form, time slots, *Booking Confirmed* (`bcb-shots/m1-hero`, `m2-form`, `m3-slots`, `m4-confirmed`). Each change slides the next screen up.
- **Slot wall:** behind the phone, the day's time slots pop off it into a wall of 3D tiles. Each tile is cropped from `m3-slots`, with the taken slots struck through as in the app, and the chosen 15:00 lit yellow.
- **Laptop:** off to one side, showing the desktop booking page (`desk-booking`).
- **Touch:** grab a pole and spin it. It keeps spinning and slows down on its own (decorative).

### 04 · MEANT (sky blue): the café table

- **The table:** MEANT's demo is ordering food. A tablet on a stand (`meant-shot-1`, the four replies) faces the partner's display across the table (`meant-shot-2`, "Give me a moment").
- **Word tiles:** around the table, the coloured word tiles hang in the air at different depths. They are cropped from the real word board (`meant-shot-3`), coloured by word type as Mruthulan built them.
- **Pick:**
  - the four reply tiles (crops of the real buttons) rise off the tablet as real buttons
  - clicking, or Enter on one, sends it across the table, and the partner's display shows that reply
  - until then it shows "Give me a moment"
- **Newspaper:** the Tamil Murasu page (`press/tamil-murasu-2026-09-28-p8`) lies on the table as a sheet of newsprint with a slight curl. Clicking it opens `meant.html#press`, with the HTML label *Featured in Tamil Murasu*.
- **Partner display captures:**
  - First choice: run the MEANT web app from `../meant-DellInnovateFest/meant/web` with its own test fixtures and capture the partner display showing each reply.
  - Otherwise: the reply is written onto the real "Give me a moment" capture in the display's own font, size and colour, and Mruthulan is told.

### 05 · KnowCad (violet): the archive

- **The archive:** hundreds of drawing sheets fill the screen at every depth, and the camera flies through them.
  - The sheets are drawn in fine drafting lines: border, title block, grid. These are generic drafting marks with no invented content.
  - They are one instanced mesh, so they are cheap.
- **Question:** the scroll types *Who won the Autodesk Singapore Hackathon 2026?* (HTML) letter by letter.
- **Answer:** the sheets that "match" light up violet along their edges and fly together into one stack in front of the camera. It turns over to the champion photo (`win-knowcad-champion`), which fills most of the screen at the payoff.
- **Touch:** the sheets drift out of the way of the cursor (decorative).
- **Words:** the product and the win only, as v1. No "private" label, no claim about who built what.

### Awards (gold): the photo table

- **The table:** a long dark table running into the distance, with each win as a stack of its real photos printed with a white border:
  - Dell InnovateDash: `win-signalbridge-team`, `win-signalbridge-award`
  - Dell InnovateFest: `win-meant-handover`, `win-meant-stage`, `win-meant-team`
  - Autodesk: `win-knowcad-champion`, `win-knowcad-team`
- **Layout:** the table spans the full width. Each stack is fitted to an HTML box above its own words, so the 3D and the words always line up:
  - the placing in large gold
  - the event
  - the project link
  - *LinkedIn post ↗*
  - the organisers' logos

  On a laptop, the three stacks sit side by side. On phones, they are one per row, and the table runs down the screen.
- **The placings as flip-boards:** each stack has a small gold split-flap board built from the name board's parts: **CHAMPION**, **2ND RUNNER-UP**, **CHAMPION**.
  - As its stack arrives, the board turns through letters and lands on the placing, tied to the scroll so that scrolling back turns it back. Nothing turns on page load.
  - It flickers under the mouse and ripples on a tap, like the hero.
  - The HTML placing stays for screen readers and the stills, hidden visually while the board is live.
- **Scroll, so it flows:** the section flows on from KnowCad without a break.
  - The camera glides down from KnowCad's archive onto the table, and the colour warms from violet to gold.
  - The three stacks then stand up one after another, each a little later in the scroll than the one before, with a soft spotlight brightening over each as it stands.
- **Touch:**
  - **Hover:** the prints lift toward the mouse and fan out slightly, with a gloss that follows the pointer, and the spotlight over that stack brightens.
  - **Flick:** drag or flick the top print off a stack. It slides across the table with momentum, spins a little, settles, and tucks back under the stack, showing the next photo. The last one brings the stack back to the start.
  - **Keyboard:** a *Next photo* button on each stack does the same.
  - **Click:** clicking a print opens the existing full-screen viewer at that photo.
- **Replaces:** the carousels, arrows, dots and photos that advance by themselves.

### Ending: the internship board

As v1:

- the 3D board **OPEN TO A SWE INTERNSHIP / 2027/28**, across the full width (four rows on phones)
- it flickers under the mouse and ripples on a tap
- under it, *Reach out* and the Gmail, LinkedIn and GitHub icon links, with the address and *Copy*

## Words changed from v1's copy deck

- **Removed:** "Five projects."
- **Added:** *Next photo* (one per Awards stack, a button label).
- **Unchanged:**
  - Boss Breaker: *Attack*, −350, *Stress Dragon defeated*
  - MEANT: *Featured in Tamil Murasu*
  - KnowCad: the question

## How it is built

- **Lenis** (MIT, pinned version, bundled into `js/vendor/` like three.js and loaded through the import map) smooths wheel and trackpad scrolling.
  - It runs the page's single animation loop. Each frame it updates the scroll, then the chapter beats and rail, then the camera and scenes, then draws, in that order. The 3D therefore always matches the scroll position the page shows in that frame.
  - The renderer still sleeps when nothing is moving.
- **`js/3d/world.js`** replaces the per-box fitting for chapters:
  - it lays the scenes along the path
  - it maps scroll position to camera position and orientation from each chapter's keyframes
  - it moves the studio rig and its colours
  - it loads and frees scenes

  The page sections (the hero, Awards, the ending) still fit their 3D into HTML boxes, as in part 1.
- **Each scene keeps one module** in `js/3d/chapters/` with the same shape:
  - `mount(world)` builds it and loads its textures
  - `update(t)` poses it for its own timeline, 0 to 1
  - `pointer()` and `press()` handle touch, if it has any
  - `dispose()` frees it
- **`design/build_3d_assets.py`** gains the new crops and screens for every chapter. Budget: at most 600 KB of textures per chapter.
- **Code budget:** at most 320 KB gzipped for three.js, Lenis and the site's own 3D code.
- **Stills:** each chapter's still is a full-screen render of its payoff pose (laptop and phone shapes), made by `design/stills.mjs`. Stills remain the first paint for the hero and the whole fallback.

## Fallbacks and accessibility

As v1, plus:

- **In stills mode** each chapter is one screen: its still fills the background and its words sit over it. Nothing pins or moves.
- **Pins** use `100svh`, so Safari's toolbar never covers *Case study* (the open item from part 1).
- **Part 1's small leftovers are fixed in passing:**
  - the project name links to the case study
  - a chapter's alt text stays available when its 3D is live
  - a swipe that starts on the board no longer ripples it
  - the project fonts load as each chapter comes near
  - `?pose=` works only together with `mode=3d`
  - the stale README notes are updated

## Testing

All of part 1's checks stay. Changed or added:

- **Smoothness with a real wheel:** headful Chrome on the real GPU, with the CPU slowed 4×, scrolls the whole page with real wheel events (CDP `Input.dispatchMouseEvent`, type `mouseWheel`) at 1440×900. It fails if:
  - slow frames (over 33 ms) are 5% or more of all frames
  - the scroll speed jumps between two frames by more than a threshold, set in the plan from Lenis' measured baseline
  - the camera's scroll value differs from the page's scroll value in any frame
  - in a page section at rest (the hero, Awards, the ending), a fitted object is more than 1 px off its HTML box
- **Phone smoothness:** 390×844 at pixel ratio 3 with touch scrolling (`Input.synthesizeScrollGesture`). Slow frames stay under 5%, or the page ends on stills.
- **Pacing:** the test asserts both of these:
  - the scrolling length is no more than 12 screens
  - SignalBridge's result is fully shown within 2.5 screens of the top
- **Every interaction:** smoke tests for:
  - Boss Breaker's attack down to *defeated* and its reset
  - MEANT's pick from the keyboard
  - Awards: the flip-boards landing on their placings, *Next photo*, a flicked print settling, the viewer opening
  - the pole spin settling
  - the KnowCad sheets returning after the cursor leaves
- **No GPU leaks:** after scrolling top to bottom and back twice, the texture and geometry counts return to where they started.
- **Stills:** every chapter's still matches its live payoff pose (mean difference under 2).
- **Screenshots and a scroll recording** of every chapter at its payoff, desktop and phone, go to Mruthulan at the end.

## Build order (all in one go)

1. Lenis and the single frame loop, the new pacing, removing the fly-through and the snap, the wheel smoothness test.
2. `world.js`: the path, camera keyframes, studio rig, loading and freeing. The hero flies into SignalBridge.
3. SignalBridge rebuilt as the control room. **A short recording goes to Mruthulan here, so the feel can be corrected early; the build does not stop for it.**
4. Boss Breaker.
5. Better Call Bhai.
6. MEANT, with the attempt to capture the partner display.
7. KnowCad.
8. Awards photo table.
9. Ending board and the header icons on every page.
10. Phones, speed and accessibility passes, part 1's leftovers, stills, README.
11. Final review against this spec, then the screenshots and recording to Mruthulan. Nothing is pushed until Mruthulan says so.

## Risks

- **Phones can't keep up with full scenes:**
  - fewer objects on phones
  - lazy loading and freeing
  - pixel ratio capped at 1.5
  - the watchdog's fall back to stills
- **Lots of objects looks cluttered or cheap:**
  - every object is a real capture or a real-sized build
  - one lighting rig
  - the recording after step 3 catches it early
- **Smooth scrolling annoys some people:** it only smooths, never blocks, and never runs under reduced motion. Removing it is one line.
- **MEANT can't be run locally:** the fallback in chapter 04 above.
