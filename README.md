# Mruthulan's portfolio

Personal portfolio for Senthil Nathan Mruthulan at [mruthulan.com](https://mruthulan.com). It is a static site built with HTML, CSS and JavaScript and hosted on GitHub Pages. No build step.

## Design

The site follows the **Signal Lab v3** direction. The hero and the Work section have different jobs and do not repeat each other:

- **Hero** creates curiosity. One abstract system that names no project, the full name, and a single specific hook. There is no project picker here.
- **Work** is the evidence. Six rows, each carrying the role and the result on the row itself, each linking to its own case page. Hovering, tabbing or tapping a row tints the whole environment in that project's colour.
- **Wins** keeps the dark ground but lights it differently — gold stage light, display-scale placings, a slow shimmer on the headline. Three rows state the exact placing without any interaction; hover, focus or tap opens the event photographs and the proof link.
- **About** is personal and specific, with an optional portrait.
- **Credentials** is a short timeline: education, representing SP at Dell InnovateFest, and student leadership. Drawn from the résumé, confirmed by Mruthulan.
- **Contact** ends the thread that runs down the whole page in a beacon.

Behind all of it sits one fixed **field** layer: an aura that follows the pointer anywhere in the viewport, a depth layer that shifts against the page as you scroll, and a brief ring where you tap open ground. It paints above the section grounds and below every piece of content, and it only ever adds light, so nothing it does can reduce contrast. Under reduced motion no listener is attached at all.

Each case page tells its story with a different module — a handoff flow, a conversation turn, a before/after, a funnel, a ladder of mechanics, a research tally and an inline pitch-deck viewer — over the same shared navigation.

The forms are inline SVG plus CSS layers — **no WebGL and no 3D library**. Depth comes from gradients, filters and transforms, so the visuals survive reduced motion, low-powered phones and old browsers.

Prototype sources for both iterations live in `design/signal-lab-v2/`. The longer brief is in [REDESIGN_PLAN.md](REDESIGN_PLAN.md).

### Rules the design depends on

- No stock photography, ever. Real photos are optional and supplied by Mruthulan; every slot has a drawn fallback that looks finished on its own.
- Every animation sits inside a `prefers-reduced-motion: no-preference` query.
- Every project row is a real link, so mouse, touch and keyboard all reach the same place. Hover and focus produce the same ambient response.
- Without JavaScript the rows still work as links, the fallbacks still draw, and only the parallax and the ambient light are lost.
- Project facts, award wording and roles are only ever taken from verified sources.
- **Nothing unfilled is ever rendered as content.** A decision with no stated reasoning omits its "Because" block; Loomy's quote spine is not drawn until there are real quotes. Never ship a visible "awaiting wording" state.
- No file paths, slot names or authoring instructions appear on any public page.
- **The phone number on the résumé is never published.** There is an automated check for it.
- The MEANT repository is private, so it is linked nowhere; the MEANT case page is that award's proof instead.
- The KnowCad repository and the Autodesk materials are private, so that case page carries no code button and no product screenshots. Its proof is the award photo, the LinkedIn post and a public description, and the page says why.
- The Better Call Bhai testimonial stays unpublished until the shop owner's exact approved words and chosen attribution exist. Nothing stands in for it.
- LinkedIn is always `linkedin.com/in/senthil-nathan-mruthulan`.
- Loomy's deck is reproduced in full, and its targets and projected revenue are labelled as projections, never as results.

## Pages

- `index.html` — hero, the work index, wins, about, credentials and contact
- `signalbridge.html`, `meant.html`, `better-call-bhai.html`, `knowcad.html`, `boss-breaker.html`, `loomy.html` — one case study per project
- `privacy.html` — analytics information and visitor choice
- `404.html` — missing page

## Preview

Run `python3 -m http.server 8000` in this folder and open `http://localhost:8000`.

## Publishing and domain

GitHub Pages publishes the `main` branch from the repository root. The `CNAME` file sets `mruthulan.com` as the custom domain. The Namecheap DNS zone should have GitHub Pages' four apex A records and a `www` CNAME to `mru34.github.io`.

## Analytics

The Google Analytics 4 measurement ID is configured in `js/analytics.js`. The tag loads only after a visitor selects **Allow analytics**. The choice is stored in that browser and can be changed on the privacy page. After consent the site sends `project_select`, `case_open`, `resume_click` and `contact_click` events — no names, email addresses or free text.

## Photos and media

Every image is optional. Slots render a designed fallback by default, so a page with no photos still looks finished. To add one: drop the file in `assets/media/` and name it in `data/media.json`. See `assets/media/README.md` for the slot list, crops and rules. Nothing about this system is visible on the site itself.

## Rebuilding the case pages

The six case pages are generated by `design/build_cases_v4.py` — run it from anywhere and it rewrites them in place. Edit the page content there, never in the generated HTML, or the next run will overwrite it. `OWNER_QUOTE` and `OWNER_ATTRIBUTION` near the top hold the Better Call Bhai testimonial; while they are `None` no testimonial is rendered at all.

## The Loomy deck viewer

`assets/deck/loomy-01.jpg` … `loomy-10.jpg` are one-per-page renders of `assets/Loomy-Pitch-Deck.pdf`, shown by the inline viewer on the Loomy case page. The viewer has real previous/next buttons, a slide counter, a live region that announces each change, arrow-key support while it has focus, and a swipe on touch. Arrow keys outside the viewer are left alone, so the deck never takes the page's scrolling away. Without JavaScript the slides simply stack and stay readable, and the full PDF is always one click away.

## Assets

Typography is self-hosted from `assets/fonts` (Bricolage Grotesque, Spline Sans, JetBrains Mono — latin subsets, SIL Open Font License; see `assets/fonts/LICENSES.txt`). The photo-free social sharing card and linked PDFs live in `assets/`. `sitemap.xml` and `robots.txt` provide search crawler entry points.
