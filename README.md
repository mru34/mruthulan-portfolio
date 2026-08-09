# Mruthulan — Software Engineering Intern Portfolio

A portfolio built with semantic HTML, CSS and vanilla JavaScript. It runs entirely in the browser with no backend, database, build step or third-party runtime dependency.

## Live site

https://mru34.github.io/mruthulan-portfolio/

## Preview locally

### Quick option

Open `index.html` directly in a modern browser.

### Recommended option

From this folder, start any simple local web server. For example, if Python is installed:

```text
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Contents

- Sticky responsive navigation, a reading-progress bar and active-section highlighting
- Light/dark theme that follows the operating system, with an in-page toggle that persists
- Command palette (`Cmd`/`Ctrl` + `K`) for jumping to any section, page or link
- Hero positioned for software engineering internships, with availability and track-record signals
- Candidate profile, strengths and role-fit sections
- Skills split into technologies already shipped with and technologies actively being learned
- Education, employment and student-leadership experience
- Four projects: SignalBridge, Better Call Bhai, Loomy and KnowCad
- Direct contact, LinkedIn, GitHub and résumé actions
- SignalBridge case study on its own page, with a live GitHub activity feed on the home page
- Interview View: a six-section presentation mode for interview preparation
- Keyboard presentation controls: Left/Right arrows, Page Up/Page Down, Home/End and Escape

## Accessibility and performance notes

- Inter is self-hosted as a single variable `woff2` (~48 KB) and preloaded, so the site renders in its intended typeface rather than a per-OS fallback.
- Scroll reveal, hover lifts and the availability pulse are all disabled under `prefers-reduced-motion: reduce`.
- Every `<img>` carries intrinsic `width`/`height` to prevent layout shift; below-the-fold images are lazy-loaded and the hero portrait is marked `fetchpriority="high"`.
- Colours are custom properties on `:root`. The dark theme is emitted twice — once behind `prefers-color-scheme` (skipped when the visitor has explicitly chosen light) and once behind `data-theme="dark"` — so the toggle wins in both directions. An inline head script applies a stored choice before first paint, so there is no flash.
- The command palette traps focus, is fully keyboard driven, and closes on `Esc`.
- The GitHub feed is unauthenticated and rate limited, so every failure path leaves the server-rendered fallback in place.
- Scroll reveal is gated behind a `.js` class, so content is never hidden when the script does not run.

## Structure

```text
index.html             home
signalbridge.html      case study
404.html
css/styles.css
js/script.js
assets/fonts/          Inter variable woff2 + license
assets/images/
assets/og-card.jpg     1200x630 social share card
assets/*.pdf           résumé and pitch deck
README.md
```
