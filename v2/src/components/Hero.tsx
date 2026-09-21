import { lazy, Suspense } from 'react';
import { ProjectPicker } from './ProjectPicker';
import { ProofPanel } from './ProofPanel';
import { NodeGraphFallback } from './NodeGraphFallback';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useWebglSupport } from '../hooks/useWebglSupport';
import { useInView } from '../hooks/useInView';

const HeroScene = lazy(() => import('./HeroScene'));

interface HeroProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function Hero({ activeId, onSelect: select }: HeroProps) {
  const reducedMotion = useReducedMotion();
  const webglSupported = useWebglSupport();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="hero shell" id="top" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="badge">
          <i></i> DEVELOPER · SINGAPORE
        </p>
        <h1 id="hero-title" tabIndex={-1} data-route-heading>
          <em>Senthil Nathan Mruthulan</em>.
        </h1>
        <p className="hero-intro">
          Developer and builder in Singapore, shipping human-centred products across interface
          and backend.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#work">
            Explore the work
          </a>
          <a className="text-link" href="#contact">
            Get in touch
          </a>
        </div>
        <p className="hero-note">Year 2 · Singapore Polytechnic · Open to software internships</p>
      </div>

      <div className="hero-visual">
        <div className="scene-frame" ref={ref} aria-hidden="true">
          {webglSupported ? (
            <Suspense fallback={<NodeGraphFallback activeId={activeId} onSelect={select} />}>
              <HeroScene
                activeId={activeId}
                reducedMotion={reducedMotion}
                inView={inView}
                onSelect={select}
              />
            </Suspense>
          ) : (
            <NodeGraphFallback activeId={activeId} onSelect={select} />
          )}
        </div>

        <ProjectPicker activeId={activeId} onSelect={select} />
        <ProofPanel activeId={activeId} />
        {!webglSupported && (
          <p className="fallback-note">
            Showing the 2D fallback — your browser or device doesn't support WebGL.
          </p>
        )}
      </div>
    </section>
  );
}
