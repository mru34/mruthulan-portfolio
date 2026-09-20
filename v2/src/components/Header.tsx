import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { track } from '../lib/analytics';
import { assetUrl } from '../lib/assetUrl';

const RESUME_HREF = assetUrl('/assets/Senthil-Nathan-Mruthulan-Resume.pdf');

interface NavLinkProps {
  hash: string;
  children: React.ReactNode;
  onClick: () => void;
}

/** Plain in-page anchor on the home page; a route Link (to "/#hash") from anywhere else. */
function NavLink({ hash, children, onClick }: NavLinkProps) {
  const isHome = useLocation().pathname === '/';
  if (isHome) {
    return (
      <a href={`#${hash}`} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={`/#${hash}`} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="shell nav-wrap">
        <Link className="brand" to="/" onClick={close}>
          <span className="brand-mark">m</span> mruthulan
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label="Open menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span></span>
          <span></span>
        </button>
        <nav className={`main-nav${open ? ' open' : ''}`} id="main-nav" aria-label="Main navigation">
          <NavLink hash="work" onClick={close}>
            Work
          </NavLink>
          <NavLink hash="wins" onClick={close}>
            Wins
          </NavLink>
          <NavLink hash="about" onClick={close}>
            About
          </NavLink>
          <NavLink hash="contact" onClick={close}>
            Contact
          </NavLink>
          <a
            className="nav-resume"
            href={RESUME_HREF}
            target="_blank"
            rel="noopener"
            onClick={() => {
              close();
              track('resume_click');
            }}
          >
            Résumé ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
