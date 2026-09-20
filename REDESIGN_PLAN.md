# Mruthulan.com — Portfolio V2 design and build brief

**Purpose:** Make the portfolio feel like a memorable, interactive product while letting a recruiter understand the work in under a minute. This brief is ready to hand to Claude or another developer.

**Status:** V2 is a plan, not an approved visual design. The current live site has been given a temporary cleanup: no portrait or project screenshots, shorter copy, and geometric visual placeholders. Build V2 on a separate branch and review a working preview before replacing production.

## 1. What should change

The current design feels like a static editorial page. It relies on large blocks of text and project imagery. The next version should be more tactile, responsive to the visitor, and visually distinctive.

### Non-negotiables

- **No portrait. No stock photos. No project screenshots or other real images** until specifically approved. Use labelled geometric placeholders and procedural shapes.
- Fewer words, stronger hierarchy. Show the headline, outcome and action first; put technical depth behind a deliberate click.
- Interactions should reveal or clarify work. Motion alone is not the product.
- One meaningful 3D experience is enough. The rest of the site should remain fast, readable and easy to use.
- Every action must work with keyboard, touch and pointer. The site must work without WebGL and with reduced motion.
- Preserve the real projects, accurate results, contact links, custom domain and opt-in analytics.

## 2. Audience and first impression

**Primary:** internship and graduate recruiters, hiring managers, and people considering Mruthulan for a build. **Secondary:** peers and collaborators.

The first 10 seconds should answer:

1. Who is this? A developer and builder in Singapore.
2. What can he do? Ship useful, human-centred software across interface and backend.
3. What is the proof? SignalBridge, MEANT and competition results.
4. What should I do next? Explore a project, view the résumé, or make contact.

## 3. Visual directions to prototype

| Direction | Feel | Main device | Tradeoff |
| --- | --- | --- | --- |
| **A. Signal Lab — recommended** | Dark, sharp, experimental, with luminous accents and big type | A modular 3D object whose pieces represent selected projects | Most memorable; requires careful performance work |
| B. Kinetic Type | Mostly typographic, energetic, editorial | Responsive type, layered cards, depth created in CSS | Fastest and most robust; less obviously 3D |
| C. Digital Workbench | Industrial grid, playful controls, tactile surfaces | Visitors activate switches and project modules | Highly interactive; can become visually busy |

**Prototype A first.** Use near-black/ink as the foundation, one electric accent and one warm accent. Use oversized typography, generous empty space, subtle grain/grid drawn in CSS, and restrained lighting. Avoid the current cream-card layout. Create a second, smaller Kinetic Type prototype as a comparison before committing to a full build.

## 4. Proposed site structure

```text
HEADER       Name/logo | Work | Wins | About | Contact | Résumé
HERO         One strong sentence + two actions + interactive project object
WORK         Select a project -> visual reacts -> concise proof panel updates
WINS         Three hackathon wins, in a compact strip
ABOUT        One short human statement + useful skills and links
CONTACT      Big, unmistakable email action
CASE PAGES   Short overview first; optional deeper technical story
FOOTER       GitHub | LinkedIn | Privacy | Back to top
```

Keep the work links available as ordinary HTML links. A visitor should never have to learn the 3D interface to reach a case study.

## 5. Interaction storyboard

| Area | Pointer / touch response | Keyboard and fallback |
| --- | --- | --- |
| Hero object | Gently tilts toward the pointer. Tap or click a labelled module to select a project. Selection changes colour, form and a short nearby description. | Tab through the matching project buttons. Arrow keys optional. A plain HTML project list remains visible if WebGL is unavailable. |
| Project index | Hover/focus expands one project, reveals a one-line outcome and clear actions. On touch, first tap selects; a visible button opens details. | Focus produces the same selected state. Enter opens the project. No hover-only information. |
| Project transition | Selected module shifts into a large geometric placeholder matching that project. Movement has a short beginning and end. | Under reduced motion, switch instantly or cross-fade. |
| Wins | Short responsive highlight when brought into view or focused. | All award text is readable without animation. |
| Buttons / links | Small press, lift, underline or magnetic response; never move far from the pointer. | Clear focus ring and pressed state; minimum comfortable touch size. |
| Case study | Compact summary first. “Explore the build” reveals problem, my role, decisions and outcome. | Use semantic disclosure controls or buttons with clear expanded state. |

**Avoid:** scroll hijacking, endless auto-rotation, custom cursors that hide the system pointer, sound, autoplay video, flashy loading screens, and drag as the only way to navigate.

## 6. The 3D feature, scoped so it helps

Build one hero scene from simple procedural geometry. Think of **five connected modules** for SignalBridge, MEANT, Better Call Bhai, Boss Breaker and Loomy. KnowCad can appear in the project index and wins strip. The module is selected by a visible text control; the 3D object responds to the same state.

- The 3D scene is a visual companion to real DOM content, never the only source of information.
- Use deliberate, finite transitions. Render on demand when idle where possible.
- Load the 3D code after the hero text is usable. Reserve the canvas space to avoid layout shift.
- If WebGL fails, display a CSS/SVG geometric placeholder with the same project controls.
- On weaker mobile devices, simplify lighting, materials and geometry. The touch project selector must still feel intentional.
- Keep labels and actions in HTML; treat the canvas as decorative for assistive technology.
- Add a visible “Reduce motion” control only if the operating-system preference is not enough for a comfortable experience.

**Prototype acceptance test:** selecting every project works by mouse, touch and keyboard; the scene never blocks reading or scrolling; turning WebGL off leaves the site complete.

## 7. Content system: fewer words, more proof

### Copy limits

- Hero: name + headline of **up to 7 words**, one supporting line of **up to 14 words**.
- Project preview: one hook of **up to 10 words**, one proof/outcome line of **up to 16 words**, at most three tags.
- About: **30–40 words** total on the home page.
- Awards: title, placement and project. Extra explanation belongs on a case page.
- Each case page: the first screen contains project name, one-line problem, Mruthulan's role, outcome and actions. Longer detail is optional below.

### Suggested short hooks, to refine in design

| Project | Hook | Proof to show |
| --- | --- | --- |
| SignalBridge | **Youth support without lost context.** | SP InnovateDash 2026 champion; Mruthulan worked on youth UX, integrations and tests. |
| MEANT | **Faster AAC conversations. User in control.** | Dell InnovateFest 2026 second runner-up, S$3,000; a separate project from SignalBridge. |
| Better Call Bhai | **Barber bookings, minus the back-and-forth.** | Live client site; frontend and deployment. |
| Boss Breaker | **Wellness as a game.** | Full-stack BED CA2 build; challenges, points and boss raids. |
| Loomy | **Thrifting with a community.** | Product concept informed by 30+ interviews. |
| KnowCad | **Less searching. Better answers.** | Autodesk Singapore AI+ML Hackathon champion. |

**Fact rule:** Do not invent impact numbers or personal contributions. Keep MEANT and SignalBridge separate. Preserve the exact Dell placement and prize supplied by Mruthulan.

## 8. Placeholder system

Real images are intentionally out of scope for V2. Placeholders should look like designed components, not broken-image boxes or grey skeletons.

- Each project gets one colour, a large typographic mark, an index number and a small `VISUAL PLACEHOLDER` label.
- Hero uses code-generated geometry. Project panels use CSS shapes, gradients and typography.
- The same placeholder identity carries from the project index to the case page.
- Decorative placeholder layers have `aria-hidden="true"`; the adjacent project title and actions carry meaning.
- The social sharing card is typographic and photo-free.
- If screenshots are wanted later, add them only after choosing an intentional art direction and reviewing privacy/content rights.

## 9. Recommended build approach

**Recommended stack:** Vite + React + TypeScript for explicit interaction state and reusable project components; React Three Fiber for the one 3D scene; Motion for modest UI transitions; plain modular CSS with design tokens. Only add the 3D and motion packages if the prototype proves they improve the experience. [React Three Fiber](https://r3f.docs.pmnd.rs/) pairs with React and supports reusable interactive scene components. [Motion](https://motion.dev/docs/react-use-reduced-motion) supports reduced-motion handling.

**Why this suits the current setup:** Vite can produce a static `dist` build for the existing GitHub Pages site and custom domain. Its [official deployment guide](https://vite.dev/guide/static-deploy) describes the GitHub Actions build and `base: '/'` for a custom domain. Keep the Namecheap DNS and `mruthulan.com` domain connection as they are.

Suggested code shape:

```text
src/
  data/projects.ts          verified project facts, links, short copy
  components/HeroScene.tsx  one 3D scene, loaded only when needed
  components/ProjectPicker.tsx
  components/ProjectPanel.tsx
  components/AwardsStrip.tsx
  components/ConsentBanner.tsx
  pages/Home.tsx
  pages/Project.tsx
  styles/tokens.css
  styles/global.css
public/CNAME                mruthulan.com
```

Preserve the existing GA4 property **G-FSK2WF40K9** and visitor opt-in. Track only useful, non-personal events after consent: `project_select`, `case_open`, `resume_click`, and `contact_click`. Do not send names, email addresses or free-text content to analytics.

## 10. Accessibility and device rules

Target **WCAG 2.2 AA** as the practical baseline. In particular: keyboard access, visible focus, readable contrast, text alternatives where content is meaningful, and no essential information available only through motion or colour. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) and its [reduced-motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) are the reference.

Test at minimum:

- 320, 375, 390, 768, 1024 and 1440 CSS-pixel widths; portrait and landscape tablet.
- iPhone Safari, Android Chrome, iPad Safari and desktop Chrome/Firefox/Edge where available.
- Keyboard-only navigation from start to finish; screen reader smoke test on hero, project picker, menu and consent banner.
- Reduced motion on, WebGL unavailable, slow connection and low-powered mobile.
- 200% text zoom, no sideways page overflow, menu usable with touch and keyboard.

Use the 3D canvas as progressive enhancement. A user's device choice or assistive technology should never remove the project information.

## 11. Performance targets

Treat these as review targets, not reasons to strip away the creative concept: mobile Largest Contentful Paint around **2.5 seconds or less**, Interaction to Next Paint **200 ms or less**, and Cumulative Layout Shift **0.1 or less** on representative connections/devices. These align with [Google's Core Web Vitals guidance](https://web.dev/articles/defining-core-web-vitals-thresholds). Measure the actual preview before launch.

- Lazy-load 3D. Keep the main headline, actions and work index in the initial HTML.
- Use procedural primitives rather than heavy model or texture downloads.
- Cap pixel ratio, pause rendering when out of view, and clean up WebGL resources.
- Keep interaction feedback responsive even if the 3D scene is still loading.
- Run Lighthouse and manual device checks; automated scores do not replace keyboard and screen reader testing.

## 12. Execution sequence and review gates

1. **Reference and moodboard:** create two visual directions, A and B, using only type/geometry/placeholders. Deliver desktop and mobile mockups plus a short explanation of interaction intent.
2. **Clickable hero prototype:** implement the A concept with project selection, 3D response, accessible DOM controls, reduced-motion and no-WebGL fallback. Review this before building the full site.
3. **Build the page system:** work index, compact wins, about and contact. Add project case pages using the same data source and concise copy.
4. **Content pass:** verify links, roles, award wording and résumé; cut any line that does not help someone understand the work or take action.
5. **QA pass:** device sizes, browser checks, keyboard, screen reader smoke test, reduced motion, no WebGL, performance and analytics consent.
6. **Launch:** preview on a branch, review against this brief, then deploy to the existing GitHub Pages site and verify HTTPS, redirects and analytics events.

### Definition of done

- A first-time visitor can find the best work, the résumé and contact within 10 seconds.
- The hero reacts to input and has a clear purpose: selecting work.
- Every project is reachable without using 3D, hover or dragging.
- No portrait, project screenshots, stock imagery or unapproved media appears anywhere, including the social card.
- Home page copy meets the limits above; case pages keep depth available without front-loading it.
- The site works on the device and accessibility states listed above.
- Analytics remains opt-in, the custom domain stays live, and the production build passes review.

## 13. Copy-paste handoff prompt for Claude

> Read `REDESIGN_PLAN.md` and inspect this repository before changing code: `https://github.com/mru34/mruthulan-portfolio`. The live domain is `https://mruthulan.com`. I dislike the current static layout. Design an interactive, visually striking V2 with less copy and one purposeful 3D project selector. Do not use my portrait, stock photos, project screenshots or unapproved imagery; use intentional geometric placeholders. Start on a separate branch. First deliver two visual directions (Signal Lab and Kinetic Type) as desktop and mobile mockups, then a clickable hero prototype that works with mouse, touch, keyboard, reduced motion and no WebGL. Show me that prototype before building the rest. Preserve accurate project/award facts, the Namecheap custom domain, GitHub Pages deployment and opt-in GA4 analytics. Use the acceptance criteria and copy limits in the brief. Do not deploy the full redesign until I have reviewed the preview.

## 14. Source of truth and useful links

- [Current site](https://mruthulan.com/) and [GitHub repository](https://github.com/mru34/mruthulan-portfolio)
- [MEANT team repository](https://github.com/King-Shelton/meant-DellInnovateFest)
- [Boss Breaker / BED CA2 repository](https://github.com/mru34/bedca2)
- [Singapore Polytechnic SignalBridge feature](https://www.sp.edu.sg/courses/schools/soc/happenings/detail/soc-happenings/information-technology-students-clinch-top-prize-at-sp-innovatedash-2026)
- [LinkedIn profile](https://www.linkedin.com/in/senthil-nathan-mruthulan)

The pre-cleanup screenshots remain recoverable from Git history if Mruthulan later chooses to use any of them. Do not bring them back into the visible design without approval.
