# Homepage v3: cleaner rooms, KnowCad's real story, a gallery for Awards

Date: 11 October 2026 · Branch: `redesign-3d` · Status: design approved by Mruthulan in chat

This builds on the v2 spec (`2026-10-11-3d-homepage-v2-design.md`). Where this document is silent, v2 holds. It replaces v2's chapter 05 (KnowCad) and the Awards section, and changes parts of chapters 01–04 and the About section.

## Why

Mruthulan reviewed v2 and found:

- **SignalBridge:** white shapes on a monitor at the back look odd. This is the youth preview screen (`sb-wall-preview`), the one light-themed screen in a dark room.
- **Better Call Bhai:** the time slots look like a boxed screenshot.
- **MEANT:**
  - the reply options look like screenshot rectangles
  - the newspaper should be 3D
  - pressing it should move smoothly to the article
- **Boss Breaker:**
  - the images should be clearer
  - the fan of challenge cards looks repetitive
- **KnowCad:** the scene says nothing about the product. KnowCad helps a customer service rep find the best answer to a customer's question when the information is scattered across many long manuals.
- **Awards:**
  - the photos look blurry
  - it doesn't look premium
  - the change between photos is bad
- **About:** drop "(expected)" and improve the wording.
- **Everywhere:** stay on theme.

## What success looks like

1. **No screenshot edges:** nothing on the homepage looks like a cropped screenshot pasted on a box. Times, replies and challenge cards are drawn crisp from the app's real words.
2. **Sharp:** at 1440×900 and 1920×1080, the photos, screens and words in the 3D read cleanly. Every texture is at least 1.5× its largest size on screen at 1× pixel ratio, up to the size of its source.
3. **KnowCad tells its story:** someone who has never heard of it can say, from the scene alone, "it finds the answer in the manuals for a support rep".
4. **Awards feels like a gallery:**
   - framed photos on a lit wall
   - Next photo glides
   - no jumps or snaps
5. **Still smooth and fast:** v2's perf limits hold on desktop and phone (slow frames under 5%, longest frame at most 100 ms, wheel jerk at most 41 px at p99, no frames out of sync).

## Rules changed from v2

- **The KnowCad screen is drawn, not captured.** v2 said every screen is a real capture. KnowCad's product is private, so the rep's console and the manual pages are drawn in KnowCad's style. The description for screen readers says the question and manuals are an example. Still no "private" label and no claim about who built what.
- **Words drawn crisp instead of cropped:** Better Call Bhai's times, MEANT's replies and Boss Breaker's challenges are drawn at build time in the app's own words, states and colours. They are not cropped from captures. Every other screen is still a real capture.
- **One navigation fades:** pressing MEANT's newspaper fades into the article. Every other link stays instant, and nothing moves on page load.

## The rooms

### 01 · SignalBridge

- **The white screen goes:** the back monitor showing `sb-wall-preview` shows the worker's handoffs list (`d-worker-handoffs`, dark) instead.
- **No light screens on the wall:** every wall monitor shows a dark worker-side screen. The test is that each wall texture's mean brightness is under 70 out of 255.
- Nothing else changes. The cockpit captures stay banned.

### 02 · Boss Breaker

- **Sharper screens:** each is cropped from the 2880 px captures:
  - the big screen (`d-boss`), 2048 px wide, cropped to the raid and leaderboard so its words are larger
  - the leaderboard, 1600 px wide
  - the dragon, at twice its current size
  - the phone (`m-boss`), at least 1024 px wide
- **Six different cards:** the challenge cards are the six real challenges from `d-challenges`.
  - Each is drawn in the app's dark card style with:
    - its own icon (water drop, footsteps, moon, stretch, pan, bed)
    - its own accent from Boss Breaker's orange family
    - its words, points and creator
  - The challenges:
    - #1 Drink 2L of water before 6pm · +15 pts · mruthulan
    - #2 Walk 8,000 steps · +25 pts · aisha.k
    - #3 Screen off 30 minutes before bed · +20 pts · mruthulan
    - #4 Ten minutes of stretching after class · +10 pts · jun_wei
    - #5 Cook one meal instead of ordering in · +30 pts · priya.r
    - #6 Eight hours of sleep, two nights running · +35 pts · mruthulan
- **A hand of cards:** instead of the fan on the floor, the cards are held in a loose arc low in the frame. Each sits at its own angle and height, with the front card on top.
- **Attack** (the button, a tap, or Enter) plays the front card. It flies into the boss, the boss takes the hit, and the next card moves to the front. After the sixth, the hand starts again.
- **The hit stays −350**, the app's own estimate for a hit. A 10–35 point card would barely dent 5,000 HP. This differs from the chat, where the card's points became the hit.

### 03 · Better Call Bhai

- **The slot wall** is 20 rounded 3D pills in the app's three columns, with the times and taken/free states of the `m3-slots` capture:
  - **free:** dark glass with crisp white time
  - **taken:** dimmed with a strike-through
  - **15:00:** shop yellow, raised a little, with a soft glow
- **Hover:** a pill lifts slightly under the mouse (decorative).
- The time text comes from one atlas drawn at build time.

### 04 · MEANT

- **Reply cards:** the four replies (Roasted chicken rice, Steamed chicken rice, Char siew rice, Duck rice) are rounded white cards in the tablet's style, with crisp dish names and a small dish icon in the app's style.
  - Picking still sends the reply to the partner display.
  - The HTML buttons stay for the keyboard and screen readers.
- **Newspaper:** a folded broadsheet with:
  - two leaves meeting at a centre fold
  - a few sheets of visible thickness at the edges
  - a soft curl at one corner
  - the Tamil Murasu article on top, sharper than now
- **Pressing it** (the paper, or *Featured in Tamil Murasu*):
  - The camera glides toward the paper for about 0.6 s, then `meant.html#press` opens with a crossfade (a cross-document view transition), landing on the article.
  - Browsers without view transitions navigate normally after the glide.
  - With reduced motion, it navigates at once.
  - Back returns to the same place on the homepage.

### 05 · KnowCad: the support rep's desk (replaces the archive)

- **The room:**
  - The camera flies in through stacks and shelves of thick manuals in KnowCad's violet.
  - The spines carry five generic titles: *Installation Guide*, *Licensing*, *Admin Handbook*, *Release Notes*, *Troubleshooting*.
  - Loose pages drift between them.
  - The manuals and pages are instanced, so they are cheap.
- **The desk:** at the end, a support rep's monitor with a support console drawn in KnowCad's style:
  - the customer's ticket on the left
  - KnowCad's panel on the right
- **The story, with the scroll:**
  1. **A ticket arrives** on the rep's screen: *"We moved to new laptops and the app says our licence is in use on another device. How do we fix it?"*
  2. **The rep asks KnowCad.** The scroll types the rep's question in HTML by the name, replacing *Who won the Autodesk Singapore Hackathon 2026?*: *Licence "in use on another device" after moving to new laptops*.
  3. **Retrieval:** three manuals glow violet (*Licensing*, *Admin Handbook*, *Troubleshooting*). A page slides out of each and flies to the desk with the matching passage highlighted.
  4. **Payoff:** KnowCad's suggested answer on the rep's screen, ready to send: *"Sign out on the old laptop to free the licence. If that laptop is gone, an admin can release it from the account portal. Then sign in on the new one."* Under it are three source tags (*Licensing · p. 42*, *Admin Handbook · p. 118*, *Troubleshooting · p. 7*) and *Send to customer*.

  The answer is an illustration in KnowCad's style, not a claim about any real product's steps.
- **Touch** (decorative):
  - the loose pages drift out of the cursor's way
  - tapping a source page brings it forward to read, and tapping again puts it back
  - tapping a manual slides it out a little
- **Words:** the name, line, result and *Case study* as now. The still and its alt text describe the desk, the manuals and the answer.

### Awards: the gallery wall (replaces the photo table)

- **The wall:** a dark, warm wall (charcoal with a faint plaster texture) spans the section. Each award is a framed shadow box fitted to its HTML box, as now, so the 3D and the words line up. Each frame has:
  - a thin dark-gold moulding
  - an off-white mat
  - the photos stacked inside, the front one face-on
- **Light:** each frame has its own warm spotlight glow on the wall. It is a painted light pool, not an extra light, so no shaders recompile.
  - As the section scrolls in, the spotlights brighten one after another. This is tied to the scroll and runs backwards when you scroll back.
- **Placings:** the flip-board under each frame is its plaque, landing on its placing with the scroll as now.
- **Sharp photos:**
  - every photo at its source's full resolution (at most 1400 px wide), lightly sharpened
  - mipmaps and anisotropic filtering on
  - facing the camera, so nothing is foreshortened
- **Next photo** (the button, or a drag):
  - The front print lifts slightly, glides out sideways past the frame's edge, slips behind the others and settles. The next photo is revealed in one move of about 0.5 s, eased in and out.
  - **Drag:** the print follows the finger or mouse. Let go past a third of its width and it commits; otherwise it springs back. The last photo leads back to the first.
  - The gallery script stays the one source of truth and announces each change.
- **Hover:** the frame under the mouse tilts toward it (at most 4°) and its spotlight brightens.
- **Click** a photo to open the full-screen viewer, as now.
- **Flight in:** the camera glides from KnowCad's desk down to the wall, and the colour warms from violet to gold.
- **Phones:** the frames hang in one column down the wall.

### About

- **Intro** (new, above the facts): *I study IT at Singapore Polytechnic. I build for one real person first: a youth worker at midnight, someone who can't rely on their speech, a barber with a full day of bookings.*
- **Study:** *Diploma in Information Technology · Singapore Polytechnic · 2025–2028*
- **Leadership:** *Secretary, Youth Harmony Chapter subcommittee · Class Chairman · SP ACER*
- **Stack:** unchanged.

## Words changed from v2

- **KnowCad:**
  - the typed question becomes the rep's question
  - the ticket, answer and source tags are new (drawn in the 3D, and in the alt text)
- **Awards:** *Next photo* stays.
- **About:** the intro is added, and the Study and Leadership lines are rewritten as above.

## How it is built

- **`design/build_3d_assets.py`** draws:
  - the slot atlas, reply cards and challenge cards (Pillow, the app's fonts, at 2× their on-screen size)
  - the KnowCad console states, spine labels and pages
  - the wall's plaster texture
  - the new crops

  It keeps every texture at least 1.5× its on-screen size, up to its source. Budget: at most 600 KB of textures per chapter, as v2.
- **Geometry** is built in code, as now:
  - rounded pills and cards
  - folded paper
  - books
  - frames
- **The press glide:** the world gives a scene a short camera move toward a point (about 0.6 s) that the scroll then takes back.
  - Only the newspaper navigation opts into the view transition. All others skip it.
- **The fixed lighting rig stays:** no lights are added or removed.

## Testing

All v2 checks stay, updated where a scene changed. New or changed:

- **Assets:**
  - every texture meets its minimum size
  - no SignalBridge wall texture has a mean brightness of 70 or more
  - the per-chapter budgets hold
  - the About section has the intro and no "(expected)"
- **Better Call Bhai:** hovering a pill lifts it, and the mouse leaving puts it back.
- **MEANT:**
  - picking a reply from the keyboard still updates the partner display
  - pressing the paper reaches `meant.html#press` after the glide, and at once under reduced motion
  - no other link uses a view transition
- **Boss Breaker:**
  - *Attack* plays the front card and the next comes to the front
  - six attacks go through all six cards
  - attacking down to *defeated* and the reset still work
- **KnowCad:**
  - at the payoff, the answer and the three source pages are shown
  - tapping a source page brings it forward, and tapping again returns it
  - the loose pages return after the cursor leaves
- **Awards:**
  - *Next photo* changes the front photo within 0.7 s
  - a short drag springs back, and a long drag commits
  - the flip-boards land on their placings
  - the viewer opens on a click
- **Perf, stills and recordings:** perf on desktop and phone within v2's limits. New stills for every changed room, each matching its live payoff (mean difference under 2). Screenshots and a scroll recording of every room at its payoff, desktop and phone, go to Mruthulan at the end.

## Build order (all in one go)

1. The sharpness pass: new crops and sizes, the SignalBridge screen swap, the asset tests.
2. Better Call Bhai's pills.
3. MEANT's reply cards, the folded paper and the press glide with its view transition.
4. Boss Breaker's six cards and the hand.
5. KnowCad's desk.
6. The Awards gallery wall and the slide.
7. The About words.
8. Stills, perf, final review, then screenshots and a recording to Mruthulan. Nothing is pushed until Mruthulan says so.

## Risks

- **The drawn KnowCad console looks fake:**
  - it uses KnowCad's palette and the site's fonts, with clean spacing and no fake logos
  - the recording at the end shows it before anything ships
- **More geometry slows phones:** instanced manuals and pages, fewer objects on phones, and the watchdog's fall back to stills.
- **View transitions are not in every browser:** those browsers navigate normally after the glide.
- **The example answer reads as a real product claim:** it stays generic, names no product, and is marked as an example in the description.
