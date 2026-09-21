# Mruthulan's portfolio

Personal portfolio for Senthil Nathan Mruthulan at [mruthulan.com](https://mruthulan.com). It is a static site built with HTML, CSS and JavaScript and hosted on GitHub Pages. No build step.

## Design

The site follows the **Signal Lab v2** direction: a dark, lit stage with six code-drawn project forms, a selector that keeps the hero and the work panel in sync, and a light "recognition" section that breaks the rhythm.

The forms are inline SVG plus CSS layers — **no WebGL and no 3D library**. Depth comes from gradients, filters and transforms, so the visuals survive reduced motion, low-powered phones and old browsers.

Design sources for the direction live in `design/signal-lab-v2/`. The longer brief is in [REDESIGN_PLAN.md](REDESIGN_PLAN.md).

### Rules the design depends on

- No portrait, stock photos or project screenshots. Visual placeholders are labelled and drawn in code.
- Every animation sits inside a `prefers-reduced-motion: no-preference` query.
- Selection works with mouse, touch and keyboard. Arrow keys move through the hero selector.
- Without JavaScript the selector is removed and all six project panels are shown stacked.
- Project facts, award wording and roles are only ever taken from verified sources. **MEANT's personal role is a visible placeholder** until Mruthulan supplies the wording; it must be filled in before launch.

## Pages

- `index.html` — hero selector, six projects, recognition, about and contact
- `signalbridge.html`, `meant.html`, `better-call-bhai.html`, `knowcad.html`, `boss-breaker.html`, `loomy.html` — one case study per project
- `privacy.html` — analytics information and visitor choice
- `404.html` — missing page

## Preview

Run `python3 -m http.server 8000` in this folder and open `http://localhost:8000`.

## Publishing and domain

GitHub Pages publishes the `main` branch from the repository root. The `CNAME` file sets `mruthulan.com` as the custom domain. The Namecheap DNS zone should have GitHub Pages' four apex A records and a `www` CNAME to `mru34.github.io`.

## Analytics

The Google Analytics 4 measurement ID is configured in `js/analytics.js`. The tag loads only after a visitor selects **Allow analytics**. The choice is stored in that browser and can be changed on the privacy page. After consent the site sends `project_select`, `case_open`, `resume_click` and `contact_click` events — no names, email addresses or free text.

## Assets

Typography is self-hosted from `assets/fonts` (Bricolage Grotesque, Spline Sans, JetBrains Mono — latin subsets, SIL Open Font License; see `assets/fonts/LICENSES.txt`). The photo-free social sharing card and linked PDFs live in `assets/`. `sitemap.xml` and `robots.txt` provide search crawler entry points.
