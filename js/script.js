const body = document.body;
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#nav-links');
const interviewPanel = document.querySelector('.interview-panel');
const interviewToggles = document.querySelectorAll('[data-interview-toggle]');
const interviewSlides = [...document.querySelectorAll('[data-interview-slide]')];
const interviewStepButtons = [...document.querySelectorAll('[data-interview-step]')];
const interviewPreviousButtons = document.querySelectorAll('[data-interview-prev]');
const interviewNextButtons = document.querySelectorAll('[data-interview-next]');
const interviewProgressLabels = document.querySelectorAll('[data-interview-progress]');
const announcement = document.querySelector('.mode-announcement');
let currentInterviewSlide = 0;
let interviewReturnFocus = null;

function closeMenu() {
  body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}

function showInterviewSlide(index, focusSlide = true) {
  if (!interviewSlides.length) {
    return;
  }

  const nextIndex = Math.min(Math.max(index, 0), interviewSlides.length - 1);
  currentInterviewSlide = nextIndex;

  interviewSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === nextIndex;
    slide.hidden = !isActive;
    slide.classList.toggle('is-active', isActive);
  });

  interviewStepButtons.forEach((button, buttonIndex) => {
    if (buttonIndex === nextIndex) {
      button.setAttribute('aria-current', 'step');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  interviewProgressLabels.forEach((label) => {
    label.textContent = `${nextIndex + 1} / ${interviewSlides.length}`;
  });

  interviewPreviousButtons.forEach((button) => {
    button.disabled = nextIndex === 0;
  });

  interviewNextButtons.forEach((button) => {
    button.disabled = nextIndex === interviewSlides.length - 1;
  });

  document.querySelector('body.interview-mode main')?.scrollTo({ top: 0 });

  if (focusSlide) {
    interviewSlides[nextIndex]?.focus({ preventScroll: true });
  }

  if (announcement) announcement.textContent = `Interview section ${nextIndex + 1} of ${interviewSlides.length}.`;
}

function setInterviewMode(enabled, trigger = null) {
  if (!interviewPanel) {
    return;
  }

  body.classList.toggle('interview-mode', enabled);
  interviewPanel.setAttribute('aria-hidden', String(!enabled));
  closeMenu();

  if (enabled) {
    interviewReturnFocus = trigger;
    showInterviewSlide(0);
    if (announcement) announcement.textContent = 'Interview View active. Use the arrow keys to move between sections and Escape to exit.';
  } else {
    if (announcement) announcement.textContent = 'Interview View closed.';
    interviewReturnFocus?.focus();
  }
}

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  body.classList.toggle('menu-open', !isOpen);
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
});

navigation?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    closeMenu();
  }
});

interviewToggles.forEach((button) => {
  button.addEventListener('click', () => {
    const enabled = !body.classList.contains('interview-mode');
    setInterviewMode(enabled, enabled ? button : null);
  });
});

interviewStepButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showInterviewSlide(Number(button.dataset.interviewStep));
  });
});

interviewPreviousButtons.forEach((button) => {
  button.addEventListener('click', () => showInterviewSlide(currentInterviewSlide - 1));
});

interviewNextButtons.forEach((button) => {
  button.addEventListener('click', () => showInterviewSlide(currentInterviewSlide + 1));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (body.classList.contains('interview-mode')) {
      setInterviewMode(false);
    } else if (body.classList.contains('menu-open')) {
      closeMenu();
      menuToggle?.focus();
    }
    return;
  }

  if (!body.classList.contains('interview-mode')) {
    return;
  }

  if (event.key === 'ArrowRight' || event.key === 'PageDown') {
    event.preventDefault();
    showInterviewSlide(currentInterviewSlide + 1);
  }

  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    showInterviewSlide(currentInterviewSlide - 1);
  }

  if (event.key === 'Home') {
    event.preventDefault();
    showInterviewSlide(0);
  }

  if (event.key === 'End') {
    event.preventDefault();
    showInterviewSlide(interviewSlides.length - 1);
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMenu();
  }
});

/* Reveal sections as they enter the viewport. Anything already on screen at
   load stays visible, and the whole effect is skipped when the visitor has
   asked for reduced motion or the browser lacks IntersectionObserver. */
function setUpScrollReveal() {
  const revealTargets = [...document.querySelectorAll('.reveal')];

  if (!revealTargets.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealTargets.forEach((target, index) => {
    // Stagger siblings that share a parent so grids cascade rather than pop.
    const position = [...(target.parentElement?.children ?? [])]
      .filter((child) => child.classList.contains('reveal'))
      .indexOf(target);

    target.style.setProperty('--reveal-delay', `${Math.max(position, 0) * 70}ms`);
    observer.observe(target);

    if (index === 0) {
      target.classList.add('is-visible');
    }
  });
}

/* ---------------------------------------------------------------------------
   Theme toggle
   The inline head script has already applied any stored choice. This only
   handles switching, persistence, and keeping the mobile browser chrome in
   step. With no stored choice the OS preference stays in charge.
--------------------------------------------------------------------------- */
function setUpThemeToggle() {
  const toggles = document.querySelectorAll('[data-theme-toggle]');

  if (!toggles.length) {
    return;
  }

  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  const activeTheme = () => root.getAttribute('data-theme')
    || (systemDark.matches ? 'dark' : 'light');

  function paintChrome() {
    const dark = activeTheme() === 'dark';
    document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => {
      // Drop the media split once a theme is pinned, or both tags stay live.
      if (root.hasAttribute('data-theme')) {
        tag.removeAttribute('media');
        tag.setAttribute('content', dark ? '#0b1120' : '#132A4F');
      }
    });
    toggles.forEach((button) => {
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const next = activeTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (error) {
        /* Storage can be unavailable; the choice still applies for this visit. */
      }
      paintChrome();
      if (announcement) announcement.textContent = `${next === 'dark' ? 'Dark' : 'Light'} theme enabled.`;
    });
  });

  // Follow the OS while the visitor has not pinned a preference.
  systemDark.addEventListener('change', () => {
    if (!root.hasAttribute('data-theme')) {
      paintChrome();
    }
  });

  paintChrome();
}

/* ---------------------------------------------------------------------------
   Command palette
--------------------------------------------------------------------------- */
function setUpCommandPalette() {
  const palette = document.querySelector('[data-command-palette]');
  const input = document.querySelector('[data-command-input]');
  const list = document.querySelector('[data-command-results]');
  const empty = document.querySelector('[data-command-empty]');

  if (!palette || !input || !list || !empty) {
    return;
  }

  const commands = [
    { glyph: '01', label: 'About me', kind: 'Section', target: '#about' },
    { glyph: '02', label: 'Why me', kind: 'Section', target: '#fit' },
    { glyph: '03', label: 'Skills', kind: 'Section', target: '#skills' },
    { glyph: '04', label: 'Experience', kind: 'Section', target: '#journey' },
    { glyph: '05', label: 'Projects', kind: 'Section', target: '#work' },
    { glyph: '06', label: 'Contact', kind: 'Section', target: '#contact' },
    { glyph: '→', label: 'SignalBridge case study', kind: 'Page', href: 'signalbridge.html' },
    { glyph: '↓', label: 'Download résumé', kind: 'File', href: 'assets/Senthil-Nathan-Mruthulan-Resume.pdf', download: true },
    { glyph: '↗', label: 'GitHub', kind: 'Link', href: 'https://github.com/mru34', external: true },
    { glyph: '↗', label: 'LinkedIn', kind: 'Link', href: 'https://www.linkedin.com/in/senthil-nathan-mruthulan', external: true },
    { glyph: '@', label: 'Email me', kind: 'Link', href: 'mailto:mruthulansenthilnathan@gmail.com' },
    { glyph: '▦', label: 'Open Interview View', kind: 'Mode', action: () => setInterviewMode(true) },
    { glyph: '◐', label: 'Toggle theme', kind: 'Mode', action: () => document.querySelector('[data-theme-toggle]')?.click() }
  ];

  let matches = commands.slice();
  let activeIndex = 0;
  let returnFocus = null;

  function run(command) {
    closePalette();

    if (command.action) {
      command.action();
      return;
    }

    if (command.target) {
      document.querySelector(command.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (command.external) {
      window.open(command.href, '_blank', 'noopener');
      return;
    }

    if (command.download) {
      const link = document.createElement('a');
      link.href = command.href;
      link.download = '';
      link.click();
      return;
    }

    window.location.href = command.href;
  }

  function render() {
    list.innerHTML = '';

    matches.forEach((command, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(index === activeIndex));
      button.innerHTML = `<span class="command-glyph" aria-hidden="true"></span><span class="command-name"></span><span class="command-kind"></span>`;
      button.querySelector('.command-glyph').textContent = command.glyph;
      button.querySelector('.command-name').textContent = command.label;
      button.querySelector('.command-kind').textContent = command.kind;
      button.addEventListener('click', () => run(command));
      item.append(button);
      list.append(item);
    });

    empty.hidden = matches.length > 0;
    list.hidden = matches.length === 0;
  }

  function filter(term) {
    const needle = term.trim().toLowerCase();
    matches = needle
      ? commands.filter((c) => `${c.label} ${c.kind}`.toLowerCase().includes(needle))
      : commands.slice();
    activeIndex = 0;
    render();
  }

  function move(step) {
    if (!matches.length) {
      return;
    }

    activeIndex = (activeIndex + step + matches.length) % matches.length;
    render();
    list.children[activeIndex]?.firstElementChild?.scrollIntoView({ block: 'nearest' });
  }

  function openPalette() {
    returnFocus = document.activeElement;
    palette.hidden = false;
    body.classList.add('palette-open');
    input.value = '';
    filter('');
    input.focus();
  }

  function closePalette() {
    palette.hidden = true;
    body.classList.remove('palette-open');
    returnFocus?.focus?.();
  }

  document.querySelectorAll('[data-command-open]').forEach((button) => {
    button.addEventListener('click', openPalette);
  });

  document.querySelectorAll('[data-command-close]').forEach((element) => {
    element.addEventListener('click', closePalette);
  });

  input.addEventListener('input', () => filter(input.value));

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (matches[activeIndex]) {
        run(matches[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
    }
  });

  // Keep focus inside the dialog while it is open.
  palette.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = [...palette.querySelectorAll('input, button')].filter((el) => el.offsetParent);
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    const isOpen = !palette.hidden;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (isOpen) {
        closePalette();
      } else {
        openPalette();
      }
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      closePalette();
    }
  });

  render();
}

/* ---------------------------------------------------------------------------
   Reading progress and active-section highlighting
--------------------------------------------------------------------------- */
function setUpScrollProgress() {
  const bar = document.querySelector('[data-scroll-progress]');
  // Only same-page hashes are section targets; cross-page hrefs are not selectors.
  const navLinks = [...document.querySelectorAll('.nav-links a')]
    .filter((link) => (link.getAttribute('href') || '').startsWith('#'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  let ticking = false;

  function update() {
    ticking = false;

    if (bar) {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.setProperty('--scroll-progress', `${Math.min(Math.max(ratio, 0), 1) * 100}%`);
    }

    // The section whose top has most recently passed under the header wins.
    const line = window.scrollY + parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height'), 10) + 40;
    let current = null;

    sections.forEach((section) => {
      if (section.offsetTop <= line) {
        current = section;
      }
    });

    // At the bottom of the page the final section's top may never cross the
    // line, so nothing would ever mark it current. Claim it explicitly.
    const atBottom = window.innerHeight + window.scrollY
      >= document.documentElement.scrollHeight - 2;

    if (atBottom && sections.length) {
      current = sections[sections.length - 1];
    }

    navLinks.forEach((link) => {
      const isCurrent = current && link.getAttribute('href') === `#${current.id}`;
      if (isCurrent) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  window.addEventListener('resize', update, { passive: true });
  update();
}

/* ---------------------------------------------------------------------------
   Live GitHub activity
   Unauthenticated and rate limited, so every failure path leaves the fallback
   copy in place rather than showing a broken panel.
--------------------------------------------------------------------------- */
function setUpGithubActivity() {
  const mount = document.querySelector('[data-github-activity]');

  if (!mount) {
    return;
  }

  const VERBS = {
    PushEvent: 'Pushed to',
    CreateEvent: 'Created',
    PullRequestEvent: 'Pull request on',
    IssuesEvent: 'Issue on',
    WatchEvent: 'Starred',
    ForkEvent: 'Forked',
    ReleaseEvent: 'Released'
  };

  const relative = (iso) => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.round(days / 30);
    return months <= 1 ? 'last month' : `${months} months ago`;
  };

  fetch('https://api.github.com/users/mru34/events/public?per_page=30', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`GitHub responded ${response.status}`);
      }
      return response.json();
    })
    .then((events) => {
      const rows = events
        .filter((event) => VERBS[event.type] && event.repo)
        .slice(0, 5)
        .map((event) => ({
          verb: VERBS[event.type],
          repo: event.repo.name.replace(/^mru34\//, ''),
          when: relative(event.created_at),
          commits: event.type === 'PushEvent' ? (event.payload?.commits?.length || 0) : 0
        }));

      if (!rows.length) {
        return;
      }

      mount.innerHTML = '';
      const list = document.createElement('ul');
      list.className = 'activity-list';

      rows.forEach((row) => {
        const item = document.createElement('li');
        const detail = row.commits
          ? `${row.commits} commit${row.commits === 1 ? '' : 's'}`
          : '';
        item.innerHTML = '<span class="activity-verb"></span><span class="activity-repo"></span><span class="activity-meta"></span>';
        item.querySelector('.activity-verb').textContent = row.verb;
        item.querySelector('.activity-repo').textContent = row.repo;
        item.querySelector('.activity-meta').textContent = [detail, row.when].filter(Boolean).join(' · ');
        list.append(item);
      });

      mount.append(list);
      mount.dataset.state = 'loaded';
    })
    .catch(() => {
      // Rate limited, offline, or blocked: the server-rendered fallback stays.
      mount.dataset.state = 'unavailable';
    });
}

setUpThemeToggle();
setUpCommandPalette();
setUpScrollProgress();
setUpGithubActivity();

setUpScrollReveal();

showInterviewSlide(0, false);
