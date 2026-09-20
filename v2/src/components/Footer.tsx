import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <span>mruthulan. — Made with care in Singapore.</span>
        <nav aria-label="Footer links">
          <a href="mailto:mruthulansenthilnathan@gmail.com">Email</a>
          <a href="https://www.linkedin.com/in/mruthulan" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href="https://github.com/mru34" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <Link to="/privacy">Privacy</Link>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top ↑
          </button>
        </nav>
      </div>
    </footer>
  );
}
