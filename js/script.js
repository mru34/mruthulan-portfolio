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

  const system = document.querySelector('.system');
  const layers = Array.from(document.querySelectorAll('.system-layer'));

  if (system && layers.length && window.matchMedia('(pointer: fine)').matches && !still.matches) {
    let frame = 0;
    system.closest('.hero').addEventListener('pointermove', (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = system.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        layers.forEach((layer) => {
          const depth = parseFloat(layer.dataset.depth) || 0;
          layer.style.transform = `translate3d(${(x * depth).toFixed(1)}px, ${(y * depth).toFixed(1)}px, 0)`;
        });
      });
    });
    system.closest('.hero').addEventListener('pointerleave', () => {
      layers.forEach((layer) => { layer.style.transform = ''; });
    });
  }

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
