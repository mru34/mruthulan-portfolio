import { HERO_PROJECTS } from '../data/projects';

const CENTER = 200;
const RADIUS = 150;
const NODE_W = 84;
const NODE_H = 64;

function nodeCenter(angleDeg: number) {
  const theta = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.sin(theta),
    y: CENTER - RADIUS * Math.cos(theta),
  };
}

interface NodeGraphFallbackProps {
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * CSS/SVG stand-in for the 3D hero scene, shown when WebGL is unavailable.
 * Ports the geometry validated in the Signal Lab mockup 1:1 so the two feel like the same object.
 */
export function NodeGraphFallback({ activeId, onSelect }: NodeGraphFallbackProps) {
  const pentagonPath =
    HERO_PROJECTS.map((p, i) => {
      const { x, y } = nodeCenter(p.heroAngle);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ') + ' Z';

  return (
    <svg
      className="node-graph"
      viewBox="0 0 400 400"
      role="img"
      aria-label="Five connected project modules. Use the buttons below to select one."
    >
      <g className="edges">
        {HERO_PROJECTS.map((p) => {
          const { x, y } = nodeCenter(p.heroAngle);
          return (
            <path
              key={p.id}
              className={`edge${p.id === activeId ? ' active' : ''}`}
              d={`M${CENTER},${CENTER} L${x},${y}`}
            />
          );
        })}
        <path className="edge" d={pentagonPath} />
      </g>
      <g className="hub" aria-hidden="true">
        <circle cx={CENTER} cy={CENTER} r="46" />
        <text x={CENTER} y={CENTER + 6} textAnchor="middle">
          m.
        </text>
      </g>
      {HERO_PROJECTS.map((p) => {
        const { x, y } = nodeCenter(p.heroAngle);
        return (
          <g
            key={p.id}
            className="node-mod"
            data-active={p.id === activeId}
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => onSelect(p.id)}
          >
            <rect x={x - NODE_W / 2} y={y - NODE_H / 2} width={NODE_W} height={NODE_H} rx="14" />
            <text className="num" x={x} y={y - 10} textAnchor="middle">
              {p.index}
            </text>
            <text x={x} y={y + 6} textAnchor="middle">
              {p.name.split(' ')[0].toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
