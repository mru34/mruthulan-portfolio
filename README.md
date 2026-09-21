# Mruthulan's portfolio

Personal portfolio for Senthil Nathan Mruthulan at [mruthulan.com](https://mruthulan.com). It is a static site built with HTML, CSS and JavaScript and hosted on GitHub Pages. No build step.

## Design

The site follows the **Signal Lab v3** direction. The hero and the Work section have different jobs and do not repeat each other:

- **Hero** creates curiosity. One abstract system that names no project, the full name, and a single specific hook. There is no project picker here.
- **Work** is the evidence. Six rows, each carrying the role and the result on the row itself, each linking to its own case page. Hovering or tabbing a row lights that section in the project's colour — the only ambient-light moment on the page.
- **Recognition** inverts to bone. Three award rows state the exact result without interaction; hover, focus or tap opens an event-photo slot and the proof link.
- **About** is personal and specific, with an optional portrait.
- **Credentials** is a short timeline: education, representing SP at Dell InnovateFest, and student leadership. Drawn from the résumé, confirmed by Mruthulan.
- **Contact** ends the thread that runs down the whole page in a beacon.

Each case page tells its story with a different module — a handoff flow, a conversation turn, a before/after, a funnel, a ladder of mechanics, a research tally — over the same shared navigation.

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
- LinkedIn is always `linkedin.com/in/mruthulan`.

## Pages

- `index.html` — hero, the work index, recognition, about and contact
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

## Assets

Typography is self-hosted from `assets/fonts` (Bricolage Grotesque, Spline Sans, JetBrains Mono — latin subsets, SIL Open Font License; see `assets/fonts/LICENSES.txt`). The photo-free social sharing card and linked PDFs live in `assets/`. `sitemap.xml` and `robots.txt` provide search crawler entry points.
