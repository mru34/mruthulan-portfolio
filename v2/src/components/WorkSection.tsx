import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PROJECTS } from '../data/projects';
import { ProjectShapeMark } from './ProjectShapeMark';
import { track } from '../lib/analytics';

const LINK_LABELS: Record<'live' | 'code' | 'deck', string> = {
  live: 'Live product ↗',
  code: 'View code ↗',
  deck: 'Pitch deck ↗',
};

export function WorkSection() {
  const [activeId, setActiveId] = useState(PROJECTS[0].id);
  const project = PROJECTS.find((p) => p.id === activeId) ?? PROJECTS[0];

  function select(id: string) {
    setActiveId(id);
    track('project_select', { project_id: id, surface: 'work' });
  }

  return (
    <section className="section" id="work" aria-labelledby="work-title" style={{ borderTop: 0 }}>
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="kicker">01 / Selected work</p>
            <h2 id="work-title">Six things I&rsquo;ve made.</h2>
          </div>
          <p>Select a project — the shape and proof panel update. Every project also opens as its own page.</p>
        </div>

        <div className="work-switcher">
          <div className="work-list" role="group" aria-label="Select a project">
            {PROJECTS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.id === activeId}
                aria-label={`${p.index} ${p.name} — ${p.award}`}
                onClick={() => select(p.id)}
              >
                <span className="num">{p.index}</span>
                <span className="name">{p.name}</span>
                <span className="award-chip">{p.award}</span>
              </button>
            ))}
          </div>

          <div className="work-display">
            <div className="shape-stage" aria-hidden="true">
              <span className="stage-index">{project.index}</span>
              <ProjectShapeMark shape={project.shape} />
            </div>
            <div className="work-proof" role="status" aria-live="polite">
              <p className="proof-kicker">{project.award}</p>
              <h3>{project.name}</h3>
              <p className="hook">{project.hook}</p>
              <p className="proof-text">{project.proof}</p>
              <div className="tags">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="work-actions">
                <Link to={`/work/${project.id}`}>Explore the case study ↗</Link>
                {(['live', 'code', 'deck'] as const).map(
                  (kind) =>
                    project.links[kind] && (
                      <a
                        key={kind}
                        className="secondary"
                        href={project.links[kind]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {LINK_LABELS[kind]}
                      </a>
                    ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
