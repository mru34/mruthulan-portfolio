import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PROJECTS, getProject } from '../data/projects';
import { ProjectShapeMark } from '../components/ProjectShapeMark';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { track } from '../lib/analytics';

const LINK_LABELS: Record<'live' | 'code' | 'deck', string> = {
  live: 'Live product ↗',
  code: 'View code ↗',
  deck: 'Pitch deck ↗',
};

export function CasePage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProject(slug) : undefined;

  useDocumentMeta(
    project ? `${project.name} — Mruthulan` : 'Project not found — Mruthulan',
    project ? project.problem : 'This project could not be found.',
  );

  useEffect(() => {
    if (project) track('case_open', { project_id: project.id });
  }, [project]);

  if (!project) {
    return (
      <main id="main">
        <div className="shell case-page">
          <Link className="case-back" to="/#work">
            ← Back to work
          </Link>
          <h1 tabIndex={-1} data-route-heading>
            Project not found.
          </h1>
        </div>
      </main>
    );
  }

  const index = PROJECTS.findIndex((p) => p.id === project.id);
  const prev = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const linkEntries = (['live', 'code', 'deck'] as const).filter((kind) => project.links[kind]);

  return (
    <main id="main">
      <div className="shell case-page">
        <Link className="case-back" to="/#work">
          ← Back to work
        </Link>
        <p className="case-kicker">
          <span className="idx">{project.index}</span> {project.award}
        </p>
        <h1 tabIndex={-1} data-route-heading>
          {project.name}
        </h1>
        <p className="case-problem">{project.problem}</p>
        <p className="case-role">My role: {project.role}</p>

        {linkEntries.length > 0 && (
          <div className="case-actions">
            {linkEntries.map((kind, i) => (
              <a
                key={kind}
                className={i === 0 ? undefined : 'secondary'}
                href={project.links[kind]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {LINK_LABELS[kind]}
              </a>
            ))}
          </div>
        )}

        <div className="case-art" aria-hidden="true">
          <ProjectShapeMark shape={project.shape} />
        </div>

        <div className="case-facts">
          <div>
            <span>Role</span>
            <strong>{project.role}</strong>
          </div>
          {project.tags.length > 0 && (
            <div>
              <span>Stack</span>
              <strong>{project.tags.join(' · ')}</strong>
            </div>
          )}
          <div>
            <span>Outcome</span>
            <strong>{project.outcome}</strong>
          </div>
          {linkEntries.length > 0 && (
            <div>
              <span>Links</span>
              <strong style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                {linkEntries.map((kind) => (
                  <a key={kind} href={project.links[kind]} target="_blank" rel="noopener noreferrer">
                    {kind === 'live' ? 'Live ↗' : kind === 'code' ? 'Code ↗' : 'Deck ↗'}
                  </a>
                ))}
              </strong>
            </div>
          )}
        </div>

        {project.decisions && project.decisions.length > 0 ? (
          <details className="case-disclosure">
            <summary>
              Explore the build <span className="chevron">+</span>
            </summary>
            <ul>
              {project.decisions.map((decision) => (
                <li key={decision}>{decision}</li>
              ))}
            </ul>
          </details>
        ) : (
          <p className="case-overview">{project.outcome}</p>
        )}

        <nav className="case-nav" aria-label="More projects">
          <Link to={`/work/${prev.id}`}>
            ← {prev.index} {prev.name}
          </Link>
          <Link className="next" to={`/work/${next.id}`}>
            {next.index} {next.name} →
          </Link>
        </nav>
      </div>
    </main>
  );
}
