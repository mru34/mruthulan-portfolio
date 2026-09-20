import { HERO_PROJECTS } from '../data/projects';

interface ProjectPickerProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function ProjectPicker({ activeId, onSelect }: ProjectPickerProps) {
  return (
    <div className="project-picker" role="group" aria-label="Select a project">
      {HERO_PROJECTS.map((project) => (
        <button
          key={project.id}
          type="button"
          aria-pressed={project.id === activeId}
          onClick={() => onSelect(project.id)}
        >
          {project.index} {project.name}
        </button>
      ))}
    </div>
  );
}
