import { useState } from 'react';

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell nav-wrap">
        <a className="brand" href="#top">
          <span className="brand-mark">m</span> mruthulan
        </a>
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
          <a href="#work" onClick={() => setOpen(false)}>
            Work
          </a>
          <a href="#wins" onClick={() => setOpen(false)}>
            Wins
          </a>
          <a href="#about" onClick={() => setOpen(false)}>
            About
          </a>
          <a href="#contact" onClick={() => setOpen(false)}>
            Contact
          </a>
          <a className="nav-resume" href="#" onClick={() => setOpen(false)}>
            Résumé ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
