# Mruthulan's portfolio

Personal portfolio for Senthil Nathan Mruthulan at [mruthulan.com](https://mruthulan.com). It is a static site built with HTML, CSS and JavaScript and hosted on GitHub Pages. No build step.

## Design

The site follows the **Signal Lab v3** direction. The hero and the Work section have different jobs and do not repeat each other:

- **Header** is sticky on every page and never changes its in-flow height (a sticky bar that shrank would pull the page up under the reader). Over the hero it is transparent and slightly lower; once the page moves it becomes solid ink. The section being read is marked in the nav. On phones it is a compact bar — name, search, menu — and the menu opens as a panel under the bar, with the page underneath inert and still.
- **Search** is a static command palette (the Search button, `Ctrl K` / `⌘K`, or `/`). It indexes the six projects, the sections, the awards, the proof posts, the tools and the key links, with typo-tolerant matching. No network request, and the query is never recorded.
- **Hero** is the name, one line, one hook, a four-fact proof strip (each fact links to what backs it up) and the **constellation**: one node per project in that project's colour. Hover or keyboard focus previews a node; a click or tap selects it, lights its connections and tints the room; the readout's "Open case study" is the deliberate second step. Every node has a plain link twin in the Work list.
- **Work** is the evidence. Six rows, each carrying the role and the result on the row itself, each linking to its own case page. On phones the role collapses to one short line and the result leads. Hovering, tabbing or tapping a row tints the whole environment in that project's colour.
- **Wins** keeps the dark ground but lights it differently — gold stage light, display-scale placings, a slow shimmer on the headline. Three rows state the exact placing without any interaction; a click, tap or Enter opens one row at a time, with the event photographs and my LinkedIn post, and the page settles so the heading and first photo are in view. Without JavaScript every row is simply open.
- **About** is a two-sentence introduction, four proof blocks (ship, constraints, tests, presenting — each linking to its evidence), what I'm looking for, and the tools grouped by where they were used. The portrait slot only appears if a real photo exists.
- **Credentials** is three entries: the diploma (with one line on representing SP), and two student-leadership roles.
- **Contact** is a chooser, not a single `mailto:` link: copy the address (works everywhere), Gmail compose, the default mail app, or LinkedIn. The same chooser opens as a dialog from the hero, the case-page nav and search. The footer keeps a direct email link with a copy button beside it.

Behind all of it sits one fixed **field** layer: an aura that follows the pointer anywhere in the viewport, a depth layer that shifts against the page as you scroll, and a brief ring where you tap open ground. It paints above the section grounds and below every piece of content, and it only ever adds light, so nothing it does can reduce contrast. Under reduced motion no listener is attached at all.

Each case page tells its story with a different module — a handoff flow, a conversation turn, a before/after, a funnel, a ladder of mechanics, a research tally and an inline pitch-deck viewer — over the same shared navigation. Every case page opens with an **At a glance** block (Role, Result, Stack, Team or Partner, Status where they apply) and ends with previous project, next project and back to all work, which returns to that project's row.

### Motion

Native scrolling only — no scroll-jacking library. The first load is a ~700ms stagger (name and lead, then proof and actions, then the constellation); the name and lead rise without fading, so first paint never waits on an animation. Section reveals use `IntersectionObserver`. Moving between the home page and a case page is a short cross-fade through the View Transitions API where supported, with the header held still; other browsers simply navigate. Long passages dim the ambient aura behind them. Under `prefers-reduced-motion: reduce` there is no entrance, no drift, no parallax and no cross-page transition.

The forms are inline SVG plus CSS layers — **no WebGL and no 3D library**. Depth comes from gradients, filters and transforms, so the visuals survive reduced motion, low-powered phones and old browsers.

Prototype sources for both iterations live in `design/signal-lab-v2/`. The longer brief is in [REDESIGN_PLAN.md](REDESIGN_PLAN.md).

### Arriving on a page

A link to a case page has to open at that page's title. In a normal tab the
browser does that by itself, but **embedded** — in an iframe sized to its
content, which is how the shared preview renders — the *outer* document keeps
the scroll position it had when the link was clicked, so a fresh page opens
partway down. `scrollIntoView` is the one call that crosses a frame boundary,
so on arrival the page scrolls its own top into view and puts focus on the
heading. In-page fragment links do the same thing after the browser's default
has run, so the hash and history stay native.

Back and forward are deliberately untouched: `history.scrollRestoration` is
left on `auto`, and a `back_forward` navigation never runs any of this, so
returning to a page puts the reader back where they were. The landing also
stands down the moment the reader scrolls, so nothing ever pulls the page out
from under them.

### Type scale

The hero and the case titles are the only display-scale type. Everything that
*carries information* — project names, the role and result on each Work row,
case body copy, award details, captions and links — is sized to be read, not
skimmed past, with `clamp()` so it tracks the viewport from phone to wide
laptop. Paragraphs are capped at `--prose` (68ch) so a wider shell never turns
into a long line. The smallest mono labels use `--faint`, which is the lowest
value in the palette that still clears 6:1 on the section grounds.

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
- The three proof posts are the verified short links — SP InnovateDash `lnkd.in/p/dCBs22kx`, Dell InnovateFest `lnkd.in/p/dZQiUX3z`, Autodesk `lnkd.in/p/dQW9Pg_v` — on both the Wins row and the case page, with labels that name the event.
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

The Google Analytics 4 measurement ID is configured in `js/analytics.js`. The tag loads only after a visitor selects **Allow analytics**. The choice is stored in that browser and can be changed on the privacy page. After consent the site sends `case_open`, `resume_click`, `proof_post_click` (with the project), `search_open`, `search_result_open` (the result's id, never the query), `contact_chooser_open`, `contact_copy_email`, `contact_open_gmail`, `contact_open_mail_app`, `contact_open_linkedin`, `deck_open` and `deck_fullscreen` — no names, email addresses or free text.

## Photos and media

Every image is optional. Slots render a designed fallback by default, so a page with no photos still looks finished. To add one: drop the file in `assets/media/` and name it in `data/media.json`, with its `width` and `height` so the frame takes its final shape before the image loads. See `assets/media/README.md` for the slot list, crops and rules. Nothing about this system is visible on the site itself.

## Rebuilding the case pages

The six case pages are generated by `design/build_cases_v4.py` — run it from anywhere and it rewrites them in place. Edit the page content there, never in the generated HTML, or the next run will overwrite it. `OWNER_QUOTE` and `OWNER_ATTRIBUTION` near the top hold the Better Call Bhai testimonial; while they are `None` no testimonial is rendered at all.

## The Loomy deck viewer

`assets/deck/loomy-01.jpg` … `loomy-10.jpg` are one-per-page renders of `assets/Loomy-Pitch-Deck.pdf`, shown by the inline viewer on the Loomy case page. The viewer has real previous/next buttons, a slide counter, a live region that announces each change, arrow-key support while it has focus, and a swipe on touch. Tapping a slide opens it full screen in a modal dialog with its own previous/next, arrow keys, swipe, slide count, an optional quarter turn on portrait phones, and Escape returning focus to the slide. Arrow keys outside the viewer are left alone, so the deck never takes the page's scrolling away. Without JavaScript the slides simply stack and stay readable, and the full PDF is always one click away.

## Assets

Typography is self-hosted from `assets/fonts` (Bricolage Grotesque, Spline Sans, JetBrains Mono — latin subsets, SIL Open Font License; see `assets/fonts/LICENSES.txt`). The photo-free social sharing card and linked PDFs live in `assets/`. `sitemap.xml` and `robots.txt` provide search crawler entry points.
