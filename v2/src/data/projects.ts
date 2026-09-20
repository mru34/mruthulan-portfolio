export interface HeroProject {
  id: string;
  index: string;
  name: string;
  award: string;
  hook: string;
  proof: string;
  tags: string[];
  href: string;
  /** Position around the hub, degrees clockwise from 12 o'clock. */
  angle: number;
}

// Verified facts only — see REDESIGN_PLAN.md section 7. Do not invent numbers.
export const HERO_PROJECTS: HeroProject[] = [
  {
    id: 'signalbridge',
    index: '01',
    name: 'SignalBridge',
    award: "SP InnovateDash '26 Champion",
    hook: 'Youth support without lost context.',
    proof: 'SP InnovateDash 2026 champion. I built the youth UX, integrations and tests.',
    tags: ['Next.js', 'FastAPI', 'PostgreSQL'],
    href: '/signalbridge.html',
    angle: 0,
  },
  {
    id: 'meant',
    index: '02',
    name: 'MEANT',
    award: "Dell InnovateFest '26 · 2nd runner-up",
    hook: 'Faster AAC conversations. User in control.',
    proof: "Dell InnovateFest 2026, second runner-up, S$3,000 — a separate project from SignalBridge.",
    tags: ['Accessible UX', 'Local AI', 'FastAPI'],
    href: '/meant.html',
    angle: 72,
  },
  {
    id: 'bettercallbhai',
    index: '03',
    name: 'Better Call Bhai',
    award: 'Live client site',
    hook: 'Barber bookings, minus the back-and-forth.',
    proof: 'Live client site — frontend design and deployment.',
    tags: ['Frontend', 'Deployment'],
    href: 'https://bettercalbhai.onrender.com/',
    angle: 144,
  },
  {
    id: 'bossbreaker',
    index: '04',
    name: 'Boss Breaker',
    award: 'Full-stack build',
    hook: 'Wellness as a game.',
    proof: 'Full-stack BED CA2 build — challenges, points and boss raids.',
    tags: ['JavaScript', 'Node.js', 'MySQL'],
    href: 'https://github.com/mru34/bedca2',
    angle: 216,
  },
  {
    id: 'loomy',
    index: '05',
    name: 'Loomy',
    award: 'Product concept',
    hook: 'Thrifting with a community.',
    proof: 'Product concept shaped by 30+ user interviews.',
    tags: ['User research', 'Product design'],
    href: '/assets/Loomy-Pitch-Deck.pdf',
    angle: 288,
  },
];
