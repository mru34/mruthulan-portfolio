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

- Sticky responsive navigation and a light/dark theme that follows the operating system
- Hero positioned for software engineering internships, with availability and track-record signals
- Candidate profile, strengths and role-fit sections
- Skills split into technologies already shipped with and technologies actively being learned
- Education, employment and student-leadership experience
- Four projects: SignalBridge, Better Call Bhai, Loomy and KnowCad
- Direct contact, LinkedIn, GitHub and résumé actions
- Interview View: a six-section presentation mode for interview preparation
- Keyboard presentation controls: Left/Right arrows, Page Up/Page Down, Home/End and Escape

## Accessibility and performance notes

- Inter is self-hosted as a single variable `woff2` (~48 KB) and preloaded, so the site renders in its intended typeface rather than a per-OS fallback.
- Scroll reveal, hover lifts and the availability pulse are all disabled under `prefers-reduced-motion: reduce`.
- Every `<img>` carries intrinsic `width`/`height` to prevent layout shift; below-the-fold images are lazy-loaded and the hero portrait is marked `fetchpriority="high"`.
- Colours are defined as custom properties on `:root` and overridden in a single `prefers-color-scheme: dark` block.

## Structure

```text
index.html
css/styles.css
js/script.js
assets/fonts/          Inter variable woff2 + license
assets/images/
assets/*.pdf           résumé and pitch deck
README.md
```
