import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Win {
  year: string;
  tag: string;
  name: string;
  detail: string;
}

const WINS: Win[] = [
  { year: '2026', tag: 'Champion', name: 'SP InnovateDash', detail: 'Champion — qualified the team for Dell InnovateFest.' },
  {
    year: '2026',
    tag: '2nd Runner-up',
    name: 'Dell InnovateFest',
    detail: 'Second runner-up, S$3,000 — a separate project (MEANT) from SignalBridge.',
  },
  { year: '2026', tag: 'Champion', name: 'Autodesk AI+ML Hackathon', detail: 'First place for KnowCad, Singapore.' },
];

export function WinsStrip() {
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState<boolean[]>(() => WINS.map(() => reducedMotion));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      setRevealed(WINS.map(() => true));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = refs.current.indexOf(entry.target as HTMLDivElement);
          if (index === -1) return;
          setTimeout(() => {
            setRevealed((prev) => {
              const next = [...prev];
              next[index] = true;
              return next;
            });
          }, index * 90);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section className="section" id="wins" aria-labelledby="wins-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="kicker">02 / Recognition</p>
            <h2 id="wins-title">Three hackathon wins.</h2>
          </div>
        </div>
        <div className="wins-strip">
          {WINS.map((win, i) => (
            <div
              key={win.name}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={`win-card${revealed[i] ? ' revealed' : ''}`}
            >
              <span className="win-tag">
                {win.year} · {win.tag}
              </span>
              <h3>{win.name}</h3>
              <p>{win.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
