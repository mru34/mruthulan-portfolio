import type { ShapeKind } from '../data/projects';

interface ProjectShapeMarkProps {
  shape: ShapeKind;
  className?: string;
}

/**
 * Flat CSS/SVG echo of the hero's 3D primitives — used on the Work switcher and case pages so
 * the whole site reads as one system without paying for a second WebGL scene (brief: one
 * meaningful 3D experience is enough).
 */
export function ProjectShapeMark({ shape, className }: ProjectShapeMarkProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      {shape === 'icosahedron' && (
        <polygon className="shape-mark filled" points="90,50 70,84.6 30,84.6 10,50 30,15.4 70,15.4" />
      )}
      {shape === 'octahedron' && <polygon className="shape-mark filled" points="50,8 92,50 50,92 8,50" />}
      {shape === 'box' && <rect className="shape-mark filled" x="14" y="26" width="72" height="48" rx="10" />}
      {shape === 'dodecahedron' && (
        <polygon className="shape-mark filled" points="50,8 90,37 74,88 26,88 10,37" />
      )}
      {shape === 'torus' && <circle className="shape-mark ring" cx="50" cy="50" r="34" />}
      {shape === 'tetrahedron' && <polygon className="shape-mark filled" points="50,10 90,84 10,84" />}
    </svg>
  );
}
