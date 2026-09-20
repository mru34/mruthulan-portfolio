# Mruthulan's portfolio

Personal portfolio for Senthil Nathan Mruthulan at [mruthulan.com](https://mruthulan.com). It is a static site built with HTML, CSS and JavaScript and hosted on GitHub Pages.

## Pages

- `index.html` — introduction, selected projects, recognition and contact
- `signalbridge.html` — SignalBridge case study
- `meant.html` — MEANT case study
- `privacy.html` — analytics information and visitor choice
- `404.html` — missing page

## Preview

Run `python -m http.server 8000` in this folder and open `http://localhost:8000`.

## Publishing and domain

GitHub Pages publishes the `main` branch from the repository root. The `CNAME` file sets `mruthulan.com` as the custom domain. The Namecheap DNS zone should have GitHub Pages' four apex A records and a `www` CNAME to `mru34.github.io`.

## Analytics

The Google Analytics 4 measurement ID is configured in `js/analytics.js`. The tag loads only after a visitor selects **Allow analytics**. The choice is stored in that browser and can be changed on the privacy page. Aggregate reports are available in the Google Analytics property named `mruthulan.com`.

## Assets

Images and PDFs live in `assets/`. The MEANT poster comes from the [public team repository](https://github.com/King-Shelton/meant-DellInnovateFest). `sitemap.xml` and `robots.txt` provide search crawler entry points.
