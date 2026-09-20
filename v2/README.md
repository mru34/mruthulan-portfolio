# Portfolio V2 — Signal Lab prototype

Clickable hero prototype for the portfolio redesign (see `../REDESIGN_PLAN.md`), built on the
direction chosen after the mockup review (`../mockups/signal-lab.html`).

Stack: Vite + React + TypeScript + React Three Fiber (`three`, `@react-three/fiber`,
`@react-three/drei`).

## What's here

- A five-module 3D hero scene (`src/components/HeroScene.tsx`) standing in for SignalBridge,
  MEANT, Better Call Bhai, Boss Breaker and Loomy. Selecting a project (via the accessible HTML
  buttons in `ProjectPicker.tsx`) highlights the matching module and updates the proof panel.
- A CSS/SVG fallback (`NodeGraphFallback.tsx`) shown automatically when WebGL isn't available —
  same data, same interaction, same look.
- `prefers-reduced-motion` disables the pointer-tilt and idle rotation; selection still works via
  a `frameloop="demand"` canvas that only re-renders on state change.
- The 3D code is lazy-loaded (`React.lazy`) and code-split into its own chunk so it never blocks
  the initial hero text/actions.

This is only the hero — not the full page. The rest of the site (work index, wins, about, contact,
case pages) comes after this prototype is reviewed, per the redesign brief's execution sequence.

## Run it

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run lint
```
