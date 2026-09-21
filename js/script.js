(() => {
  'use strict';

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  /* ------------------------------------------------------- hero depth --- */
  /* Three layers at different depths answer to the pointer, to touch, and to
     scroll. Under reduced motion none of it runs and the art sits still. */

  const system = document.querySelector('.system');
  const layers = Array.from(document.querySelectorAll('.system-layer'));
  const hero = system && system.closest('.hero');

  if (hero && layers.length && !still.matches) {
    let px = 0, py = 0, sy = 0, frame = 0;

    const apply = () => {
      frame = 0;
      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth) || 0;
        const x = px * depth;
        // scroll pushes the near layers further than the far ones
        const y = py * depth + sy * depth * 0.55;
        layer.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };

    const track = (clientX, clientY) => {
      const box = system.getBoundingClientRect();
      px = Math.max(-0.6, Math.min(0.6, (clientX - box.left) / box.width - 0.5));
      py = Math.max(-0.6, Math.min(0.6, (clientY - box.top) / box.height - 0.5));
      schedule();
    };

    if (window.matchMedia('(pointer: fine)').matches) {
      hero.addEventListener('pointermove', (e) => track(e.clientX, e.clientY));
      hero.addEventListener('pointerleave', () => { px = 0; py = 0; schedule(); });
    }
    hero.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      if (t) track(t.clientX, t.clientY);
    }, { passive: true });
    hero.addEventListener('touchend', () => { px = 0; py = 0; schedule(); }, { passive: true });

    window.addEventListener('scroll', () => {
      const h = hero.offsetHeight || 1;
      sy = Math.max(0, Math.min(1.2, window.scrollY / h));
      schedule();
    }, { passive: true });
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
    });
    head.addEventListener('focus', () => head.setAttribute('aria-expanded', 'true'));
    head.addEventListener('blur', () => {
      if (!item.classList.contains('is-open')) head.setAttribute('aria-expanded', 'false');
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
        return;
      }
      work.classList.add('is-hot');
      work.style.setProperty('--hot', accent);
      ghosts.forEach((g) => g.classList.toggle('is-on', g.dataset.ghost === id));
    }

    rows.forEach((row) => {
      const accent = row.style.getPropertyValue('--row-acc').trim() || '#5BE1D8';
      const on = () => light(row.dataset.project, accent);
      const off = () => light(null);
      row.addEventListener('mouseenter', on);
      row.addEventListener('focus', on);
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
          if (!entry || !entry.src) return;

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
          node.addEventListener('error', () => {
            node.remove();
            slot.classList.remove('has-file');
          });
          slot.insertBefore(node, slot.firstChild);
          slot.classList.add('has-file');
        });
      })
      .catch(() => { /* no manifest, or offline: the fallbacks stand. */ });
  }

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
