(() => {
  'use strict';

  /* ------------------------------------------------------------- menu --- */

  const menuButton = document.querySelector('.menu-button');
  const mainNav = document.querySelector('.main-nav');

  function closeMenu() {
    if (!menuButton || !mainNav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    mainNav.classList.remove('is-open');
  }

  if (menuButton && mainNav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mainNav.classList.toggle('is-open', open);
    });
    mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || mainNav.classList.contains('is-open') === false) return;
      closeMenu();
      menuButton.focus();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* -------------------------------------------------------- analytics --- */

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  document.querySelectorAll('[data-event]').forEach((el) => {
    el.addEventListener('click', () => track(el.dataset.event, { link_id: el.getAttribute('href') || '' }));
  });

  /* --------------------------------------------------------- projects --- */

  const PROJECTS = {
    sb: {
      name: 'SignalBridge',
      hook: 'Youth support that never loses context.',
      result: 'SP InnovateDash 2026 — Champion',
      href: 'signalbridge.html',
      acc: '#5BE1D8', glow: 'rgba(91,225,216,.30)', tint: 'rgba(91,225,216,.10)',
      lampX: '46%', lampY: '-16%'
    },
    mt: {
      name: 'MEANT',
      hook: 'Faster AAC replies. The user picks every word.',
      result: 'Dell InnovateFest 2026 — Second runner-up · S$3,000',
      href: 'meant.html',
      acc: '#FFB661', glow: 'rgba(255,182,97,.28)', tint: 'rgba(255,182,97,.10)',
      lampX: '52%', lampY: '-22%'
    },
    bb: {
      name: 'Better Call Bhai',
      hook: 'Barber bookings, minus the back-and-forth.',
      result: 'Live client site',
      href: 'better-call-bhai.html',
      acc: '#FF8095', glow: 'rgba(255,128,149,.28)', tint: 'rgba(255,128,149,.10)',
      lampX: '40%', lampY: '-10%'
    },
    kc: {
      name: 'KnowCad',
      hook: 'Less searching. Better answers.',
      result: 'Autodesk Singapore AI+ML Hackathon — Champion',
      href: 'knowcad.html',
      acc: '#AC93FF', glow: 'rgba(172,147,255,.28)', tint: 'rgba(172,147,255,.10)',
      lampX: '56%', lampY: '-14%'
    },
    bx: {
      name: 'Boss Breaker',
      hook: 'Wellness, played as a game.',
      result: 'Full-stack coursework build',
      href: 'boss-breaker.html',
      acc: '#A4EC76', glow: 'rgba(164,236,118,.26)', tint: 'rgba(164,236,118,.10)',
      lampX: '62%', lampY: '-8%'
    },
    lm: {
      name: 'Loomy',
      hook: 'Thrifting, with a community attached.',
      result: '30+ user interviews',
      href: 'loomy.html',
      acc: '#84B6FF', glow: 'rgba(132,182,255,.28)', tint: 'rgba(132,182,255,.10)',
      lampX: '68%', lampY: '-18%'
    }
  };

  const nodes = Array.from(document.querySelectorAll('.node[data-project]'));
  const rows = Array.from(document.querySelectorAll('.work-row[data-project]'));
  const forms = Array.from(document.querySelectorAll('.form[data-project]'));
  const panels = Array.from(document.querySelectorAll('.work-panel[data-project]'));
  const readout = document.querySelector('.readout');

  if (nodes.length || rows.length) {
    const root = document.documentElement;
    let current = 'sb';

    function select(id, announce) {
      const project = PROJECTS[id];
      if (!project || id === current) return;
      current = id;

      nodes.forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.project === id)));
      rows.forEach((r) => r.setAttribute('aria-pressed', String(r.dataset.project === id)));
      forms.forEach((f) => f.classList.toggle('is-on', f.dataset.project === id));
      panels.forEach((p) => p.classList.toggle('is-on', p.dataset.project === id));

      root.style.setProperty('--acc', project.acc);
      root.style.setProperty('--acc-glow', project.glow);
      root.style.setProperty('--acc-tint', project.tint);
      root.style.setProperty('--lamp-x', project.lampX);
      root.style.setProperty('--lamp-y', project.lampY);

      if (readout) {
        const set = (key, value) => {
          const el = readout.querySelector(`[data-readout="${key}"]`);
          if (el) el.textContent = value;
        };
        set('result', project.result);
        set('name', project.name);
        set('hook', project.hook);
        const caseLink = readout.querySelector('[data-readout="case"]');
        if (caseLink) caseLink.setAttribute('href', project.href);
      }

      if (announce) track('project_select', { project_id: id, project_name: project.name });
    }

    [...nodes, ...rows].forEach((control) => {
      control.addEventListener('click', () => select(control.dataset.project, true));
    });

    // Left/right (or up/down) move through the hero selector without leaving it.
    const group = document.querySelector('.hero-nodes');
    if (group) {
      group.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        const index = nodes.findIndex((n) => n === document.activeElement);
        if (index < 0) return;
        event.preventDefault();
        const next = nodes[(index + step + nodes.length) % nodes.length];
        next.focus();
        select(next.dataset.project, true);
      });
    }
  }

  /* ---------------------------------------------------------- reveals --- */

  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const stillness = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!reveals.length) return;

  if (stillness.matches || typeof IntersectionObserver !== 'function') {
    reveals.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // threshold 0: any sliver counts. A reveal that never fires would leave real
  // content invisible, so this errs towards showing it.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

  reveals.forEach((el) => observer.observe(el));
})();
