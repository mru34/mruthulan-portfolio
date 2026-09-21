import { assetUrl } from '../lib/assetUrl';

export type ShapeKind = 'icosahedron' | 'octahedron' | 'box' | 'dodecahedron' | 'torus' | 'tetrahedron';

export interface ProjectLinks {
  live?: string;
  code?: string;
  deck?: string;
}

export interface Project {
  id: string;
  index: string;
  name: string;
  shape: ShapeKind;
  /** Position around the hero hub, degrees clockwise from 12 o'clock. Undefined = not in the hero scene. */
  heroAngle?: number;
  award: string;
  hook: string;
  proof: string;
  tags: string[];
  problem: string;
  role: string;
  /** Case-page "Explore the build" list. Omit entirely when evidence is thin — the case page
   * then renders the brief variant (overview only, no disclosure) rather than inventing detail. */
  decisions?: string[];
  outcome: string;
  links: ProjectLinks;
}

// Verified facts only — see REDESIGN_PLAN.md §7 and the private sourcebook. Do not invent
// numbers, links, or individual contributions that aren't directly traceable to a source line.
export const PROJECTS: Project[] = [
  {
    id: 'signalbridge',
    index: '01',
    name: 'SignalBridge',
    shape: 'icosahedron',
    heroAngle: 0,
    award: "SP InnovateDash '26 Champion",
    hook: 'Youth support without lost context.',
    proof: 'SP InnovateDash 2026 champion. I built the youth UX, integrations and tests.',
    tags: ['Next.js', 'FastAPI', 'PostgreSQL'],
    problem: 'Youth workers juggle conversations across channels, and context gets lost at handoff.',
    role: 'Youth-facing experience & consent/handoff flow; frontend-to-API and Discord integration; automated tests.',
    decisions: [
      'Owned the youth-facing experience and SafeNight Companion.',
      "Built the consent/handoff flow so youth stay in control of what's shared.",
      'Connected the frontend to the API and to Discord.',
      'Wrote automated tests for the youth experience workstream.',
    ],
    outcome: 'SP InnovateDash 2026 champion — qualified the team for Dell InnovateFest.',
    links: {
      live: 'https://signalbridge-web.onrender.com/',
      code: 'https://github.com/mru34/signalbridge',
    },
  },
  {
    id: 'meant',
    index: '02',
    name: 'MEANT',
    shape: 'octahedron',
    heroAngle: 72,
    award: "Dell InnovateFest '26 · 2nd runner-up",
    hook: 'Faster AAC conversations. User in control.',
    proof: "Dell InnovateFest 2026, second runner-up, S$3,000 — a separate project from SignalBridge.",
    tags: ['Accessible UX', 'Local AI', 'FastAPI'],
    problem: 'AAC users can get left behind in fast-moving conversations.',
    role: 'Client & Demo Engineering lead — the PWA client, accessibility and the booth/demo experience.',
    decisions: [
      'Built the PWA client and its accessibility.',
      'Added AAC boards, conversation flow and reliability fixes.',
      'Led the booth/demo experience.',
    ],
    outcome: 'Dell InnovateFest 2026, second runner-up, S$3,000 — a separate project from SignalBridge.',
    links: {},
  },
  {
    id: 'bettercallbhai',
    index: '03',
    name: 'Better Call Bhai',
    shape: 'box',
    heroAngle: 144,
    award: 'Live client site',
    hook: 'Barber bookings, minus the back-and-forth.',
    proof: 'Live client site — frontend design and deployment.',
    tags: ['Frontend', 'Deployment'],
    problem: 'Booking a haircut meant manual back-and-forth over WhatsApp.',
    role: 'Designed, built and deployed the responsive booking site.',
    decisions: ['Designed the booking flow and mobile interface.', 'Built and deployed it on Render.'],
    outcome: 'Live client site, in real use today.',
    links: { live: 'https://bettercalbhai.onrender.com/' },
  },
  {
    id: 'knowcad',
    index: '04',
    name: 'KnowCad',
    shape: 'tetrahedron',
    // Not in the hero scene — brief §6 keeps it to work index + wins only.
    award: 'Autodesk AI+ML Hackathon Champion',
    hook: 'Less searching. Better answers.',
    proof: 'Autodesk Singapore AI+ML Hackathon champion.',
    tags: ['Retrieval', 'AI workflow'],
    problem: 'Customer-service agents lose time hunting for answers across internal systems.',
    role: 'Collaborated on the build and helped present it to a non-technical audience.',
    // No decisions list — evidence is thin (see sourcebook), so the case page stays brief
    // rather than inventing detail.
    outcome: 'Autodesk Singapore AI+ML Hackathon 2026 champion.',
    links: {},
  },
  {
    id: 'bossbreaker',
    index: '05',
    name: 'Boss Breaker',
    shape: 'dodecahedron',
    heroAngle: 216,
    award: 'Coursework build',
    hook: 'Wellness as a game.',
    proof: 'Full-stack BED CA2 build — challenges, points and boss raids.',
    tags: ['JavaScript', 'Node.js', 'MySQL'],
    problem: 'Coursework brief: build a full-stack wellness app that makes healthy habits stick.',
    role: 'Full-stack build — frontend and backend.',
    decisions: [
      'Built challenges, points and boss-raid mechanics to gamify wellness habits.',
      'Implemented JWT-based auth, the MySQL schema and the Express API.',
    ],
    outcome: 'Full-stack CA2 build — registration, challenges, points, boss raids, shop and leaderboard.',
    links: { code: 'https://github.com/mru34/bedca2' },
  },
  {
    id: 'loomy',
    index: '06',
    name: 'Loomy',
    shape: 'torus',
    heroAngle: 288,
    award: 'Product concept',
    hook: 'Thrifting with a community.',
    proof: 'Product concept shaped by 30+ user interviews.',
    tags: ['User research', 'Product design'],
    problem: 'Second-hand fashion is harder to trust and less social than it should be.',
    role: 'Prototype designer — concept, UX and the frontend prototype.',
    decisions: [
      'Interviewed 30+ youths aged 15–25 to shape the marketplace and swap flows.',
      'Designed the wardrobe scanner and profile/community flows.',
    ],
    outcome: 'A grade for the module; concept shaped by 30+ interviews.',
    links: {
      live: 'https://loomy-copy-eb9f937f.base44.app/Community',
      deck: assetUrl('/assets/Loomy-Pitch-Deck.pdf'),
    },
  },
];

export const HERO_PROJECTS = PROJECTS.filter(
  (p): p is Project & { heroAngle: number } => p.heroAngle !== undefined,
).sort((a, b) => a.heroAngle - b.heroAngle);

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
