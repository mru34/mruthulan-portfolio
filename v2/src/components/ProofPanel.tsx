import { HERO_PROJECTS } from '../data/projects';

interface ProofPanelProps {
  activeId: string;
}

export function ProofPanel({ activeId }: ProofPanelProps) {
  const project = HERO_PROJECTS.find((p) => p.id === activeId) ?? HERO_PROJECTS[0];
  return (
    <div className="proof-panel" role="status" aria-live="polite">
      <p className="proof-kicker">{project.award}</p>
      <h3>{project.name}</h3>
      <p>{project.proof}</p>
    </div>
  );
}
