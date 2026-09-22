(() => {
  'use strict';

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------- arrival --- */
  /* Where a page should start when you arrive on it.
     A top-level tab gets this right on its own, but embedded -- in an iframe
     sized to its content, which is how the preview renders -- the OUTER
     document keeps the scroll position it had when you clicked, so a fresh
     page opens partway down. `scrollIntoView` is the one call that crosses a
     frame boundary, so landing on the heading fixes the embedded case and
     leaves the plain case exactly as it was.

     Back and forward are left alone: `scrollRestoration` stays on `auto`, and
     a `back_forward` navigation is never touched, so returning to a page puts
     you back where you were. */

  function scrollTo(target, instant) {
    if (!target) return;
    target.scrollIntoView({
      block: 'start',
      behavior: instant || still.matches ? 'instant' : 'smooth'
    });
  }

  // focus follows the eye, so the keyboard carries on from the same place
  function focusOn(target) {
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  function hashTarget() {
    if (location.hash.length < 2) return null;
    try { return document.querySelector(location.hash); } catch (e) { return null; }
  }

  const heading = () => document.querySelector('.case-title, #hero-title, main h1, main h2');

  const entry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  const restored = entry ? entry.type === 'back_forward' : false;

  if (!restored) {
    /* Focus moves only when you got here from a link -- arriving at the site
       cold should still put the skip link first. */
    let sameSite = false;
    try { sameSite = !!document.referrer && new URL(document.referrer).origin === location.origin; }
    catch (e) { sameSite = false; }
    const moveFocus = sameSite || location.hash.length > 1;

    // Once the reader has taken over, nothing here touches the scroll again.
    let taken = false;
    const takeOver = () => { taken = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(
      (type) => window.addEventListener(type, takeOver, { once: true, passive: true }));

    const land = () => {
      if (taken) return;
      const target = hashTarget();
      if (target) {
        scrollTo(target, true);
        if (moveFocus) focusOn(target);
        return;
      }
      /* No fragment: start at the very top of the page, so the header and the
         way back are on screen above the title. */
      window.scrollTo(0, 0);
      if (!moveFocus) return;
      /* Only when the reader followed a link from inside the site. Arriving
         cold, `scrollIntoView` would move the sequential focus starting point
         past the skip link, and the skip link has to stay the first tab stop
         for someone who just landed here. */
      scrollTo(document.querySelector('.site-header') || document.body, true);
      focusOn(heading());
    };
    // after layout, and again once webfonts have settled the page height
    requestAnimationFrame(land);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(land);
  }

  /* An in-page link has the same problem when embedded: the browser scrolls
     the fragment into view inside the frame, but the frame itself stays put.
     The default is left to run -- so the hash, history and Back all behave
     natively -- and the target is then nudged into view. */
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2) return;
    let target = null;
    try { target = document.querySelector(hash); } catch (e) { return; }
    if (!target) return;
    requestAnimationFrame(() => { scrollTo(target, false); focusOn(target); });
  });

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
      if (event.key !== 'Escape' || !mainNav.classList.contains('is-open')) return;
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
    el.addEventListener('click', () => track(el.dataset.event, {
      link_id: el.getAttribute('href') || '',
      project_id: el.dataset.project || ''
    }));
  });

  /* ----------------------------------------------------------- field --- */
  /* One ambient layer for the whole site. It answers the pointer anywhere in
     the viewport (corners included -- it is positioned in viewport space, not
     inside any section), reacts locally to a tap, and changes depth and
     lighting with scroll. Under reduced motion none of this is wired up at
     all: no listeners, no transforms, and the ground simply sits still. */

  const field = document.querySelector('.field');
  const aura = field && field.querySelector('.field-aura');
  const grid = field && field.querySelector('.field-grid');
  const heroLayers = Array.from(document.querySelectorAll('.system-layer'));
  const heroEl = document.querySelector('.hero');
  const fine = window.matchMedia('(pointer: fine)').matches;

  function tone(colour) {
    if (field) field.style.setProperty('--tone', colour || '');
  }

  if (field && !still.matches) {
    let ax = window.innerWidth / 2;
    let ay = window.innerHeight * 0.42;
    let hx = 0, hy = 0;            // hero-local pointer, -0.5 .. 0.5
    let depth = 0;                 // scroll progress, 0 .. 1
    let frame = 0;

    const draw = () => {
      frame = 0;

      if (aura) {
        // scroll pushes the aura back and lifts its glow: depth, then lighting
        const scale = 1 + depth * 0.34;
        aura.style.transform =
          'translate3d(' + ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
        aura.style.opacity = (0.1 + depth * 0.06).toFixed(3);
      }
      if (grid) {
        grid.style.transform = 'translate3d(0,' + (depth * -70).toFixed(1) + 'px,0)';
        grid.style.opacity = (0.16 - depth * 0.05).toFixed(3);
      }
      // the hero art rides the same pointer, at three different depths
      heroLayers.forEach((layer) => {
        const d = parseFloat(layer.dataset.depth) || 0;
        const x = hx * d;
        const y = hy * d + depth * d * 1.1;
        layer.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };

    const point = (clientX, clientY) => {
      ax = clientX;
      ay = clientY;
      if (heroEl) {
        const box = heroEl.getBoundingClientRect();
        hx = Math.max(-0.6, Math.min(0.6, (clientX - box.left) / box.width - 0.5));
        hy = Math.max(-0.6, Math.min(0.6, (clientY - box.top) / box.height - 0.5));
      }
      schedule();
    };

    if (fine) {
      window.addEventListener('pointermove', (e) => point(e.clientX, e.clientY), { passive: true });
    }

    /* A tap on open ground: the aura moves there and a ring expands from it.
       Taps on links, buttons and fields are left alone -- those have their own
       feedback, and a ring under a finger that is about to navigate is noise. */
    const ping = (clientX, clientY) => {
      if (field.querySelectorAll('.field-ping').length > 3) return;
      const ring = document.createElement('span');
      ring.className = 'field-ping';
      ring.style.setProperty('--x', clientX + 'px');
      ring.style.setProperty('--y', clientY + 'px');
      ring.addEventListener('animationend', () => ring.remove());
      field.appendChild(ring);
    };

    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('a, button, input, select, textarea, label, [role="button"]')) return;
      point(e.clientX, e.clientY);
      ping(e.clientX, e.clientY);
    }, { passive: true });

    let scrollFrame = 0;
    window.addEventListener('scroll', () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const span = document.documentElement.scrollHeight - window.innerHeight;
        depth = span > 0 ? Math.min(1, window.scrollY / span) : 0;
        schedule();
      });
    }, { passive: true });

    window.addEventListener('resize', () => {
      ax = Math.min(ax, window.innerWidth);
      ay = Math.min(ay, window.innerHeight);
      schedule();
    }, { passive: true });

    draw();
  }

  /* ------------------------------------------------------- award rows --- */
  /* Hover and focus open a row through CSS. This adds the tap/click toggle
     and keeps aria-expanded honest for screen readers. */

  document.querySelectorAll('.award-item .award-head').forEach((head) => {
    const item = head.closest('.award-item');
    head.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', String(open));
      tone(open ? 'var(--gold)' : null);
    });
    head.addEventListener('focus', () => {
      head.setAttribute('aria-expanded', 'true');
      tone('var(--gold)');
    });
    head.addEventListener('blur', () => {
      if (!item.classList.contains('is-open')) head.setAttribute('aria-expanded', 'false');
      tone(null);
    });
    item.addEventListener('mouseenter', () => tone('var(--gold)'));
    item.addEventListener('mouseleave', () => {
      if (!item.classList.contains('is-open')) tone(null);
    });
  });

  /* ------------------------------------------------ work row ambience --- */

  const work = document.querySelector('.work');
  const rows = Array.from(document.querySelectorAll('.work-row[data-project]'));
  const ghosts = Array.from(document.querySelectorAll('.work-ghost [data-ghost]'));

  if (work && rows.length) {
    let active = null;

    function light(id, accent) {
      if (id === active) return;
      active = id;
      if (!id) {
        work.classList.remove('is-hot');
        ghosts.forEach((g) => g.classList.remove('is-on'));
        tone(null);
        return;
      }
      work.classList.add('is-hot');
      work.style.setProperty('--hot', accent);
      tone(accent);
      ghosts.forEach((g) => g.classList.toggle('is-on', g.dataset.ghost === id));
    }

    rows.forEach((row) => {
      const accent = row.style.getPropertyValue('--row-acc').trim() || '#5BE1D8';
      const on = () => light(row.dataset.project, accent);
      const off = () => light(null);
      row.addEventListener('mouseenter', on);
      row.addEventListener('focus', on);
      // a tap lights the environment before the navigation happens
      row.addEventListener('pointerdown', on, { passive: true });
      row.addEventListener('mouseleave', off);
      row.addEventListener('blur', off);
    });
  }

  /* ------------------------------------------------------------ media --- */
  /* Slots render their designed fallback by default. data/media.json is the
     only place a real file is named; nothing about it is shown on the page. */

  const slots = Array.from(document.querySelectorAll('[data-media]'));

  if (slots.length) {
    fetch('data/media.json', { cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : null))
      .then((manifest) => {
        if (!manifest) return;
        slots.forEach((slot) => {
          const entry = manifest[slot.dataset.media];
          if (!entry) return;

          // A caption is the author's to write, so the manifest wins over
          // anything hard-coded in the page.
          const figure = slot.closest('figure');
          if (entry.caption && figure) {
            let cap = figure.querySelector('.media-caption');
            if (!cap) {
              cap = document.createElement('figcaption');
              cap.className = 'mono media-caption';
              figure.appendChild(cap);
            }
            cap.textContent = entry.caption;
          }
          if (!entry.src) return;

          const src = 'assets/media/' + entry.src;
          const isVideo = /\.(mp4|webm)$/i.test(entry.src);
          let node;

          if (isVideo && !still.matches) {
            node = document.createElement('video');
            node.src = src;
            node.muted = true;
            node.loop = true;
            node.autoplay = true;
            node.playsInline = true;
            if (entry.poster) node.poster = 'assets/media/' + entry.poster;
            node.setAttribute('aria-hidden', 'true');
          } else {
            node = document.createElement('img');
            node.src = isVideo ? 'assets/media/' + (entry.poster || '') : src;
            node.alt = entry.alt || '';
            node.loading = 'lazy';
            node.decoding = 'async';
            if (!node.getAttribute('src')) return;
          }

          if (entry.focal) node.style.objectPosition = entry.focal;

          /* An award photo is never cropped: the frame takes the file's own
             aspect ratio, and the figure's flex ratio is set to match, so a
             pair sits at one height with proportional widths. Anything that
             would otherwise be cut -- a face at the edge, the award, the
             event text on a screen -- simply stays in frame. */
          const shapeToFile = () => {
            if (!node.naturalWidth || !node.naturalHeight) return;
            const ratio = node.naturalWidth / node.naturalHeight;
            slot.style.aspectRatio = node.naturalWidth + ' / ' + node.naturalHeight;
            const figure = slot.closest('.award-photos figure');
            if (figure) figure.style.flexGrow = ratio.toFixed(4);
          };
          if (slot.closest('.award-photos')) {
            if (node.complete) shapeToFile();
            node.addEventListener('load', shapeToFile);
          }

          node.addEventListener('error', () => {
            node.remove();
            slot.classList.remove('has-file');
            slot.style.aspectRatio = '';
          });
          slot.insertBefore(node, slot.firstChild);
          slot.classList.add('has-file');
        });
      })
      .catch(() => { /* no manifest, or offline: the fallbacks stand. */ });
  }

  /* ------------------------------------------------------------- deck --- */
  /* An inline slide viewer. Without JavaScript the slides stack and stay
     readable; here they become one-at-a-time with real buttons, arrow keys
     and a swipe. Arrow keys only apply while focus is inside the viewer, and
     a swipe only claims the gesture once it is clearly horizontal, so the
     page never takes the scroll away from the reader. */

  document.querySelectorAll('.deck').forEach((deckEl) => {
    const slides = Array.from(deckEl.querySelectorAll('.deck-slide'));
    const prev = deckEl.querySelector('.deck-prev');
    const next = deckEl.querySelector('.deck-next');
    const now = deckEl.querySelector('.deck-now');
    const live = deckEl.querySelector('.deck-live');
    if (slides.length < 2 || !prev || !next) return;

    let at = 0;
    deckEl.classList.add('is-live');

    function show(i, announce) {
      at = Math.max(0, Math.min(slides.length - 1, i));
      slides.forEach((slide, n) => {
        const on = n === at;
        slide.hidden = !on;
        const img = slide.querySelector('img');
        // the next slide is worth having ready; the rest stay lazy
        if (img && (on || n === at + 1)) img.loading = 'eager';
      });
      prev.disabled = at === 0;
      next.disabled = at === slides.length - 1;
      if (now) now.textContent = String(at + 1);
      if (live && announce) live.textContent = 'Slide ' + (at + 1) + ' of ' + slides.length;
    }

    prev.addEventListener('click', () => show(at - 1, true));
    next.addEventListener('click', () => show(at + 1, true));

    deckEl.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { show(at - 1, true); event.preventDefault(); }
      else if (event.key === 'ArrowRight') { show(at + 1, true); event.preventDefault(); }
      else return;
      // keep the focused control usable at the ends of the deck
      if (document.activeElement && document.activeElement.disabled) deckEl.focus();
    });

    let sx = 0, sy = 0, swiping = false;
    const stage = deckEl.querySelector('.deck-stage');
    if (stage) {
      stage.addEventListener('touchstart', (event) => {
        const t = event.touches[0];
        sx = t.clientX; sy = t.clientY; swiping = true;
      }, { passive: true });
      stage.addEventListener('touchend', (event) => {
        if (!swiping) return;
        swiping = false;
        const t = event.changedTouches[0];
        const dx = t.clientX - sx;
        const dy = t.clientY - sy;
        if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.6) show(at + (dx < 0 ? 1 : -1), true);
      }, { passive: true });
    }

    show(0, false);
  });

  /* ---------------------------------------------------------- reveals --- */

  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if (!reveals.length) return;

  if (still.matches || typeof IntersectionObserver !== 'function') {
    reveals.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

  reveals.forEach((el) => observer.observe(el));
})();
