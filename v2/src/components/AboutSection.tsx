import { track } from '../lib/analytics';
import { assetUrl } from '../lib/assetUrl';

const RESUME_HREF = assetUrl('/assets/Senthil-Nathan-Mruthulan-Resume.pdf');

export function AboutSection() {
  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="shell about-grid">
        <div>
          <p className="kicker">03 / About</p>
          <h2 id="about-title">Curious by default.</h2>
        </div>
        <div>
          <p className="about-lead">
            Year 2 IT student at Singapore Polytechnic, turning rough ideas into useful,
            human-centred products across interfaces, APIs, data and practical AI. Open to
            internships and ambitious collaborations.
          </p>
          <div className="toolkit">
            <strong>Tools I&rsquo;ve worked with</strong>
            JavaScript · HTML &amp; CSS · Java · Node.js · FastAPI · SQL (PostgreSQL/MySQL) · Git ·
            Testing
          </div>
          <div className="about-links">
            <a href="https://github.com/mru34" target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <a href="https://www.linkedin.com/in/mruthulan" target="_blank" rel="noopener noreferrer">
              LinkedIn ↗
            </a>
            <a href={RESUME_HREF} target="_blank" rel="noopener" onClick={() => track('resume_click')}>
              Full résumé ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
