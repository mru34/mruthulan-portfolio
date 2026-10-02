/* Mruthulan — Night Edition
   Everything here is an enhancement: every page reads and links correctly
   without it. Motion checks prefers-reduced-motion before it runs. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const page = body.dataset.page;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduced.matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // In-page links scroll smoothly once the page has loaded. Not before: a page opened at /#about must
  // jump straight there, so the browser can keep it in place while fonts and pictures settle above it.
  const smooth = () => requestAnimationFrame(() => root.classList.add('loaded'));
  if (document.readyState === 'complete') smooth(); else addEventListener('load', smooth, { once: true });

  /* ---------------------------------------------------------- smooth-motion helpers */
  // One flap turn, handed to the compositor (no class toggling, no forced layout).
  const FLIP = [{ transform: 'rotateX(75deg)', filter: 'brightness(1.8)' }, { transform: 'none', filter: 'none' }];
  const flap = (el, ms) => { if (!still() && el.animate) el.animate(FLIP, { duration: ms, easing: 'ease-out' }); };
  // Every flickering letter (the name, the board, a hovered flap) is advanced by one
  // loop tied to the screen's refresh, so a whole board costs one update per frame.
  const jobs = new Set();
  let loop = 0;
  const pump = () => {
    const now = performance.now();
    for (const j of jobs) {
      if (now < j.start) continue;
      if (now >= j.stop) {
        j.el.textContent = j.final === ' ' ? '' : j.final;
        if (j.flip) flap(j.el, j.flip);
        jobs.delete(j);
        if (j.done) j.done();
      } else if (now >= j.next) {
        j.el.textContent = j.chars[Math.random() * j.chars.length | 0];
        if (j.flip && (j.each || j.next === j.start)) flap(j.el, j.flip);
        j.next = now + j.step;
      }
    }
    loop = jobs.size ? requestAnimationFrame(pump) : 0;
  };
  const flicker = (el, final, o) => {
    const start = performance.now() + (o.delay || 0);
    jobs.add({ el, final, start, next: start, stop: start + o.dur, step: o.step, flip: o.flip, each: o.each, chars: o.chars, done: o.done });
    if (!loop) loop = requestAnimationFrame(pump);
  };
  // Decode a picture before it is shown, so a crossfade never waits on a large image.
  const warm = (img) => {
    if (!img || !img.decode) return;
    img.loading = 'eager';
    const go = () => img.decode().catch(() => {});
    if (img.complete) go(); else img.addEventListener('load', go, { once: true });
  };

  /* ---------------------------------------------------------- analytics */
  // analytics.js defines window.gtag only after the visitor opts in.
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-event]');
    if (el) track(el.dataset.event, el.dataset.project ? { project: el.dataset.project } : undefined);
  });

  /* ---------------------------------------------------------- header */
  const bar = $('[data-top]');
  const menuBtn = $('[data-menu-btn]');
  const menu = $('#menu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
    };
    menuBtn.addEventListener('click', () => setMenu(menu.hidden));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
    matchMedia('(min-width: 861px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });
  }

  /* ---------------------------------------------------------- zoom viewer */
  // Any <a data-zoom href="full.jpg"> opens here; without script it opens the file.
  const viewer = $('[data-viewer]');
  if (viewer && typeof viewer.showModal === 'function') {
    const stage = $('[data-stage]', viewer);
    const img = $('img', stage);
    const zl = $('[data-zl]', viewer);
    const title = $('[data-vw-title]', viewer);
    const original = $('[data-vw-original]', viewer);
    const prevBtn = $('[data-vw-prev]', viewer), nextBtn = $('[data-vw-next]', viewer), count = $('[data-vw-count]', viewer);
    let s = 1, tx = 0, ty = 0, bw = 0, bh = 0, opener = null, set = [], at = 0;
    const MAX = 5;
    const layout = () => {
      const W = stage.clientWidth - 32, H = stage.clientHeight - 32;
      const nw = img.naturalWidth || 1600, nh = img.naturalHeight || 1000;
      const f = Math.min(W / nw, H / nh);
      bw = nw * f; bh = nh * f;
      img.style.width = bw + 'px'; img.style.height = bh + 'px';
    };
    const clampPan = () => {
      const W = stage.clientWidth, H = stage.clientHeight, w = bw * s, h = bh * s;
      tx = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, tx));
      ty = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, ty));
    };
    const apply = () => { clampPan(); img.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; zl.textContent = Math.round(s * 100) + '%'; };
    const zoomAt = (ns, cx, cy) => {
      ns = Math.max(1, Math.min(MAX, ns));
      const r = stage.getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
      tx = px - (px - tx) * (ns / s); ty = py - (py - ty) * (ns / s); s = ns; apply();
    };
    const reset = () => { layout(); s = 1; tx = 0; ty = 0; apply(); };
    const centre = () => { const r = stage.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

    const load = (a) => {
      title.textContent = a.dataset.zoom || 'Full size';
      original.href = a.href;
      img.alt = a.dataset.alt || '';
      img.onload = reset;
      img.src = a.href;
      if (img.complete && img.naturalWidth) reset();
      const many = set.length > 1;
      [prevBtn, nextBtn, count].forEach((el) => { el.hidden = !many; });
      if (many) count.textContent = `${at + 1} / ${set.length}`;
    };
    const step = (d) => { if (set.length > 1) { at = (at + d + set.length) % set.length; load(set[at]); } };
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-zoom]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      opener = a.closest('[data-gal]') ? $('.shot[data-on]', a.closest('[data-gal]')) || a : a;
      set = a.dataset.group ? $$(`a[data-zoom][data-group="${a.dataset.group}"]`) : [a];
      at = Math.max(0, set.indexOf(a));
      viewer.showModal();
      load(a);
      $('[data-close]', viewer).focus();
      if (a.dataset.viewEvent) track(a.dataset.viewEvent, a.dataset.project ? { project: a.dataset.project } : undefined);
    });
    addEventListener('resize', () => { if (viewer.open) reset(); });
    // Close ourselves (button and Escape) so focus always returns to what opened the viewer.
    const closeViewer = () => {
      if (viewer.open) viewer.close();
      img.removeAttribute('src');
      if (opener) { const o = opener; opener = null; o.focus(); }
    };
    $('[data-close]', viewer).addEventListener('click', closeViewer);
    viewer.addEventListener('cancel', (e) => { e.preventDefault(); closeViewer(); });
    viewer.addEventListener('close', closeViewer);
    $$('[data-z]', viewer).forEach((b) => b.addEventListener('click', () => {
      const [cx, cy] = centre();
      if (b.dataset.z === 'in') zoomAt(s * 1.4, cx, cy);
      else if (b.dataset.z === 'out') zoomAt(s / 1.4, cx, cy);
      else reset();
    }));
    stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(s * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener('dblclick', (e) => zoomAt(s > 1.5 ? 1 : 2.5, e.clientX, e.clientY));
    const pts = new Map(); let pinch0 = 0, s0 = 1;
    stage.addEventListener('pointerdown', (e) => {
      stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); stage.classList.add('drag');
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); s0 = s; }
    });
    stage.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; if (pinch0) zoomAt(s0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      else if (s > 1) { tx += e.clientX - prev[0]; ty += e.clientY - prev[1]; apply(); }
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (!pts.size) stage.classList.remove('drag'); };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    viewer.addEventListener('keydown', (e) => {
      const [cx, cy] = centre();
      if (e.key === '+' || e.key === '=') zoomAt(s * 1.4, cx, cy);
      else if (e.key === '-') zoomAt(s / 1.4, cx, cy);
      else if (e.key === '0') reset();
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && s <= 1 && set.length > 1) { step(e.key === 'ArrowLeft' ? -1 : 1); e.preventDefault(); }
      else if (e.key.startsWith('Arrow') && s > 1) {
        const d = 60;
        if (e.key === 'ArrowLeft') tx += d; if (e.key === 'ArrowRight') tx -= d;
        if (e.key === 'ArrowUp') ty += d; if (e.key === 'ArrowDown') ty -= d;
        apply(); e.preventDefault();
      }
    });
  }

  /* ---------------------------------------------------------- featured builds: linked hotspots */
  // Pointing at (or tapping) a "What I built" line zooms the real screenshot to that part,
  // or, where there is nothing on screen to show, opens a card with the real route, test or
  // table names. With reduced motion the view changes without moving.
  const fine = matchMedia('(hover: hover)');
  $$('[data-feat]').forEach((f) => {
    const view = $('.hs-view', f), stage = $('.hs-stage', f), spot = $('.hs-spot', f), tag = $('.hs-tag', f);
    const layers = $$('.hs-layer', f), cards = $$('.hs-card', f), items = $$('.hs-item', f);
    const first = (layers.find((l) => l.hasAttribute('data-on')) || layers[0]).dataset.layer;
    let current = null;
    const showLayer = (name) => layers.forEach((l) => l.toggleAttribute('data-on', l.dataset.layer === name));
    const reset = () => {
      current = null;
      f.classList.remove('active');
      items.forEach((i) => i.setAttribute('aria-pressed', 'false'));
      showLayer(first);
      stage.style.transform = '';
      view.classList.remove('spotlit', 'carded');
      cards.forEach((c) => c.removeAttribute('data-on'));
      tag.removeAttribute('data-on');
    };
    const activate = (it) => {
      const d = JSON.parse(it.dataset.hs);
      current = it;
      f.classList.add('active');
      items.forEach((i) => i.setAttribute('aria-pressed', String(i === it)));
      cards.forEach((c) => c.toggleAttribute('data-on', +c.dataset.card === d.i));
      if (d.t === 'img') {
        showLayer(d.l);
        const [x, y, w, h] = d.r;
        const s = Math.max(1, Math.min(2.4, 0.84 / Math.max(w, h)));
        // keep the zoomed picture covering the frame
        const cx = Math.min(Math.max(x + w / 2, 0.5 / s), 1 - 0.5 / s), cy = Math.min(Math.max(y + h / 2, 0.5 / s), 1 - 0.5 / s);
        stage.style.transform = `scale(${s.toFixed(3)}) translate(${((0.5 - cx) * 100).toFixed(2)}%, ${((0.5 - cy) * 100).toFixed(2)}%)`;
        stage.style.setProperty('--s', s.toFixed(3));
        Object.assign(spot.style, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` });
        view.classList.toggle('spotlit', w < 0.99 || h < 0.99);
        view.classList.remove('carded');
        tag.textContent = d.tag || '';
        tag.toggleAttribute('data-on', !!d.tag);
      } else {
        showLayer(first);
        stage.style.transform = '';
        view.classList.remove('spotlit');
        view.classList.add('carded');
        tag.removeAttribute('data-on');
      }
    };
    items.forEach((it) => {
      it.addEventListener('mouseenter', () => { if (fine.matches) activate(it); });
      it.addEventListener('focus', () => activate(it));
      it.addEventListener('click', () => (current === it && !fine.matches ? reset() : activate(it)));
    });
    f.addEventListener('mouseleave', () => { if (fine.matches) reset(); });
    f.addEventListener('focusout', (e) => { if (!f.contains(e.relatedTarget)) reset(); });
    new IntersectionObserver(([en], o) => { if (en.isIntersecting) { o.disconnect(); layers.forEach(warm); } }, { rootMargin: '600px' }).observe(f);
  });

  /* ---------------------------------------------------------- swipe rows (the awards, on phones) */
  $$('[data-track]').forEach((row) => {
    const nav = row.parentElement.querySelector('[data-track-nav]');
    if (!nav) return;
    const slides = [...row.children], dots = $$('.track-dots i', nav), now = $('[data-slide-now]', nav);
    let idx = 0;
    const setNow = (n) => {
      idx = n;
      dots.forEach((d, k) => d.toggleAttribute('data-on', k === n));
      now.textContent = `${n + 1} / ${slides.length}`;
    };
    setNow(0);
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) setNow(slides.indexOf(en.target)); }), { root: row, threshold: 0.6 });
    slides.forEach((sl) => io.observe(sl));
    $$('[data-slide]', nav).forEach((btn) => btn.addEventListener('click', () => {
      const n = Math.max(0, Math.min(slides.length - 1, idx + +btn.dataset.slide));
      row.scrollTo({ left: slides[n].offsetLeft - slides[0].offsetLeft, behavior: still() ? 'auto' : 'smooth' });
    }));
  });

  /* ---------------------------------------------------------- award photos */
  // Arrows, the arrow keys or a swipe move between an event's photos; a tap opens the viewer.
  // While a card is in view and nobody is pointing at or using it, its photos move on slowly by
  // themselves (not with reduced motion); touching a card's photos stops that card for good.
  $$('[data-gal]').forEach((gal, gi) => {
    const main = $('.gal-main', gal), shots = $$('.shot', gal);
    const live = $('[data-gal-live]', gal);
    if (shots.length < 2) return;
    let i = 0, used = false, over = false, seen = false;
    const show = (n, quiet) => {
      const hadFocus = shots.includes(document.activeElement);
      i = (n + shots.length) % shots.length;
      shots.forEach((sh, k) => sh.toggleAttribute('data-on', k === i));
      if (!quiet) live.textContent = `Photo ${i + 1} of ${shots.length}: ${shots[i].dataset.zoom}`;
      if (hadFocus) shots[i].focus();
    };
    const byHand = (n) => { used = true; show(n); };
    new IntersectionObserver(([en]) => {
      seen = en.isIntersecting;
      if (seen) shots.forEach((sh) => warm($('img', sh)));
    }, { threshold: 0.5 }).observe(main);
    $$('[data-gal-step]', gal).forEach((btn) => btn.addEventListener('click', () => byHand(i + +btn.dataset.galStep)));
    gal.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      byHand(i + (e.key === 'ArrowLeft' ? -1 : 1));
      e.preventDefault();
    });
    gal.addEventListener('pointerenter', () => { over = true; });
    gal.addEventListener('pointerleave', () => { over = false; });
    let x0 = null, y0 = 0, swiped = false;
    main.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; used = true; } });
    main.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { byHand(dx < 0 ? i + 1 : i - 1); swiped = true; setTimeout(() => { swiped = false; }, 60); }
    });
    main.addEventListener('pointercancel', () => { x0 = null; });
    main.addEventListener('click', (e) => { if (swiped) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    if (still()) return;
    setTimeout(() => setInterval(() => {
      if (!used && !over && seen && !document.hidden && !gal.contains(document.activeElement) && !$('[data-viewer]')?.open) show(i + 1, true);
    }, 5200), gi * 1700);
  });

  /* ---------------------------------------------------------- tilt */
  // Pictures lean toward the mouse; on touch they tilt toward the finger while pressed.
  const tilt = (el, zone = el) => {
    el.setAttribute('data-tilt', '');
    // The lean is written straight onto the frame; custom properties would be inherited,
    // making the browser restyle everything inside the frame on every move.
    let raf = 0, box = null, sx = 0, sy = 0;
    const set = (x, y, amp) => {
      if (!box) { box = el.getBoundingClientRect(); sx = scrollX; sy = scrollY; }
      if (!box.width) return false;
      const left = box.left - (scrollX - sx), top = box.top - (scrollY - sy);
      const px = Math.min(1, Math.max(0, (x - left) / box.width)), py = Math.min(1, Math.max(0, (y - top) / box.height));
      const m = Math.min(amp, 2600 / box.width); // big pictures lean less
      el.style.transform = `perspective(1000px) rotateX(${((0.5 - py) * 2 * m).toFixed(2)}deg) rotateY(${((px - 0.5) * 2 * m).toFixed(2)}deg)`;
      return true;
    };
    const clear = () => {
      cancelAnimationFrame(raf);
      box = null;
      el.classList.remove('tilting', 'pressing');
      el.style.transform = '';
    };
    zone.addEventListener('pointermove', (e) => {
      if (still() || e.pointerType !== 'mouse') return;
      const x = e.clientX, y = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (set(x, y, 7)) el.classList.add('tilting'); });
    });
    zone.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') clear(); });
    zone.addEventListener('pointerdown', (e) => {
      if (still() || e.pointerType === 'mouse') return;
      if (set(e.clientX, e.clientY, 5)) el.classList.add('tilting', 'pressing');
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => zone.addEventListener(t, (e) => { if (e.pointerType !== 'mouse') clear(); }));
  };
  $$('a.zoom, .pcard, .gal-main, .about > .ph, .deck-stage').forEach((el) => tilt(el));

  /* ---------------------------------------------------------- buttons */
  // The fill grows from where the pointer came in and leaves toward where it went;
  // with a mouse the button leans a few pixels toward it.
  $$('.btn').forEach((b) => {
    const at = (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
      b.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
    };
    let home = null, raf = 0;
    b.addEventListener('pointerenter', (e) => { at(e); home = b.getBoundingClientRect(); });
    b.addEventListener('pointerdown', at);
    b.addEventListener('pointermove', (e) => {
      if (still() || e.pointerType !== 'mouse' || !home) return;
      const dx = e.clientX - (home.left + home.width / 2), dy = e.clientY - (home.top + home.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { b.style.translate = `${(dx * 0.16).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`; });
    });
    b.addEventListener('pointerleave', (e) => { cancelAnimationFrame(raf); at(e); home = null; b.style.translate = ''; });
  });

  /* ---------------------------------------------------------- contact */
  $$('[data-copy]').forEach((btn) => {
    const status = $('[data-copy-status]');
    const label = btn.textContent;
    btn.addEventListener('click', () => {
      const addr = btn.dataset.copy;
      const ok = () => {
        btn.textContent = 'Copied ✓';
        if (status) status.textContent = 'Copied. Paste it into any email app.';
        setTimeout(() => { btn.textContent = label; }, 2200);
        track('contact_copy_email');
      };
      const fallback = () => {
        const target = $('[data-mail]');
        if (target) { const r = document.createRange(); r.selectNodeContents(target); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
        if (status) status.textContent = 'Selected. Press Ctrl+C (or Copy) to finish.';
      };
      try { navigator.clipboard.writeText(addr).then(ok, fallback); } catch { fallback(); }
    });
  });

  /* ---------------------------------------------------------- Loomy deck */
  $$('[data-deck]').forEach((deck) => {
    const slides = $$('.deck-slide', deck);
    const now = $('[data-deck-now]', deck);
    const live = $('[data-deck-live]', deck);
    let i = 0;
    const show = (n, announce) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.toggleAttribute('data-on', k === i); s.setAttribute('aria-hidden', String(k !== i)); s.tabIndex = k === i ? 0 : -1; });
      now.textContent = i + 1;
      if (announce) live.textContent = `Slide ${i + 1} of ${slides.length}`;
    };
    $('[data-deck-prev]', deck).addEventListener('click', () => show(i - 1, true));
    $('[data-deck-next]', deck).addEventListener('click', () => show(i + 1, true));
    deck.addEventListener('keydown', (e) => {
      if (e.target.closest('button,a:not(.deck-slide)')) return;
      if (e.key === 'ArrowRight') { show(i + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(i - 1, true); e.preventDefault(); }
    });
    let x0 = null;
    const stage = $('.deck-stage', deck);
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(dx < 0 ? i + 1 : i - 1, true); stage.dataset.swiped = '1'; setTimeout(() => delete stage.dataset.swiped, 50); }
    });
    stage.addEventListener('click', (e) => { if (stage.dataset.swiped) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    show(0, false);
  });

  /* ---------------------------------------------------------- case pages */
  if (page === 'case') {
    const progress = $('[data-progress]');
    // Where the browser can tie the bar to the scroll itself (styles.css), script stays out of it.
    const native = !still() && window.CSS && CSS.supports('animation-timeline: scroll()');
    if (!native) {
      let raf = 0;
      const onScroll = () => {
        const h = document.documentElement.scrollHeight - innerHeight;
        progress.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
      };
      addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(onScroll); }, { passive: true });
      onScroll();
    }
    // Embedded previews keep the outer scroll position; bring a freshly opened
    // case page to its top. Back and forward are left alone.
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      if (window.self !== window.top && nav && nav.type !== 'back_forward' && !location.hash) {
        $('#top').scrollIntoView();
      }
    } catch { /* cross-origin frame */ }
  }

  if (page !== 'home') return;

  /* ---------------------------------------------------------- home: the name board */
  // The name never changes. A tile flickers under the mouse and lands back on its
  // letter; a tap or click ripples the whole name out from that tile.
  const nameEl = $('[data-name]');
  if (nameEl) {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const cells = $$('.t', nameEl);
    const flick = (t, delay = 0) => {
      if (still() || t.dataset.busy) return;
      t.dataset.busy = '1';
      flicker(t, t.dataset.ch, { delay, dur: 200, step: 45, flip: 220, chars: L, done: () => { delete t.dataset.busy; } });
    };
    cells.forEach((t) => t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') flick(t); }));
    nameEl.addEventListener('pointerdown', (e) => {
      const hit = e.target.closest('.t');
      const i0 = hit ? cells.indexOf(hit) : 0;
      cells.forEach((t, i) => { if (t !== hit || e.pointerType !== 'mouse') flick(t, Math.abs(i - i0) * 28); });
    });
  }

  /* ---------------------------------------------------------- home: the name docks into the header */
  // Scrolling out of the hero, the big name glides up and shrinks while the nine MRUTHULAN tiles close
  // ranks, until each letter sits on the same letter of the small logo, at its size; the tiles and
  // SENTHIL NATHAN fade on the way and the logo takes over at the end. It follows the scroll position,
  // so it runs backwards on the way up and never hides anything at rest. Everything is measured once
  // (and on resize), so scrolling only writes transforms.
  const logo = $('.logo', bar);
  const logoText = logo && logo.firstChild;
  const first = nameEl && $('.w', nameEl);
  const row = first ? $$('.t', first) : [];
  if (nameEl && logoText && logoText.nodeType === 3 && logoText.length === row.length && !still()) {
    const intro = $('.hero-intro');
    const range = document.createRange();
    const charBox = (node, i) => { range.setStart(node, i); range.setEnd(node, i + 1); return range.getBoundingClientRect(); };
    let m = null, raf = 0;
    const measure = () => {
      root.classList.add('docking');                     // the logo's resting place, without its fade-in offset
      nameEl.style.transform = '';
      row.forEach((t) => { t.style.translate = ''; });
      const r = first.getBoundingClientRect(), n = nameEl.getBoundingClientRect();
      // layout sizes, not on-screen boxes: the tiles may still be mid flip-in when this runs
      const letters = row.map((t, i) => charBox(logoText, i));
      const s = parseFloat(getComputedStyle(logo).fontSize) / parseFloat(getComputedStyle(row[0]).fontSize);
      const centres = row.map((t) => t.offsetLeft - first.offsetLeft + t.offsetWidth / 2);
      const cy = row[0].offsetTop - first.offsetTop + row[0].offsetHeight / 2;
      const tx = letters[0].left + letters[0].width / 2 - s * centres[0];
      const ty = letters[0].top + letters[0].height / 2 - s * cy;
      const top = r.top + scrollY;                       // where MRUTHULAN sits in the page
      m = {
        x: r.left, top, s, tx, ty,
        // how far each tile slides (before scaling) so its letter lands on the logo's letter
        shift: letters.map((b, i) => (b.left + b.width / 2 - tx) / s - centres[i]),
        end: Math.max(top - letters[0].top, innerHeight * 0.6),   // scroll distance over which it docks
      };
      nameEl.style.transformOrigin = `${r.left - n.left}px ${r.top - n.top}px`;
      update();
    };
    const ease = (t) => t * t * (3 - 2 * t);
    const update = () => {
      raf = 0;
      if (!m) return;
      // the glide finishes at 85% of the distance and holds, so the logo takes over with every letter in place
      const y = scrollY, t = Math.min(1, Math.max(0, y / m.end)), p = ease(Math.min(1, t / 0.85));
      const dx = (m.tx - m.x) * p, dy = (m.ty - (m.top - y)) * p, sc = 1 + (m.s - 1) * p;
      nameEl.style.transform = p ? `translate(${dx}px, ${dy}px) scale(${sc})` : '';
      row.forEach((tile, i) => { tile.style.translate = p ? `${(m.shift[i] * p).toFixed(2)}px 0` : ''; });
      root.style.setProperty('--dock', p.toFixed(4));
      root.style.setProperty('--hand', Math.min(1, Math.max(0, (t - 0.88) / 0.12)).toFixed(3)); // tiles → logo
      if (intro) intro.style.opacity = String(1 - Math.min(1, t * 1.4));
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', () => requestAnimationFrame(measure));
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(measure));
  }

  /* ---------------------------------------------------------- home: header */
  const heroEnd = $('[data-hero-end]');
  new IntersectionObserver(([e]) => {
    bar.classList.toggle('scrolled', !e.isIntersecting && e.boundingClientRect.top < 200);
  }, { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px` }).observe(heroEnd);

  const ink = $('.nav-ink');
  function mark(id) {
    let hit = null;
    $$('[data-nav]', bar).forEach((a) => {
      if (a.dataset.nav === id) { a.setAttribute('aria-current', 'true'); hit = a; } else a.removeAttribute('aria-current');
    });
    if (hit && hit.offsetWidth) { ink.style.opacity = 1; ink.style.transform = `translateX(${hit.offsetLeft}px) scaleX(${hit.offsetWidth / 100})`; }
    else ink.style.opacity = 0;
  }
  const secObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    mark(e.target.dataset.sec);
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-sec]').forEach((s) => secObs.observe(s));
  addEventListener('scroll', () => { if (scrollY < 200) mark(null); }, { passive: true });

  /* ---------------------------------------------------------- home: departures board */
  const board = $('[data-board]');
  const data = JSON.parse($('#projects-data').textContent);
  const ids = Object.keys(data);
  const cols = {};
  $$('[data-col]', board).forEach((f) => { cols[f.dataset.col] = [...f.children]; });
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const put = (c, ch) => { c.textContent = ch === ' ' ? '' : ch; };
  let flipping = 0;
  function flipAll(words, done) {
    const cells = []; let k = 0;
    for (const [col, word] of Object.entries(words)) {
      const row = cols[col];
      const w = word.toUpperCase().padEnd(row.length, ' ').slice(0, row.length);
      row.forEach((c, i) => cells.push([c, w[i], k++]));
    }
    if (still() || document.hidden) { cells.forEach(([c, ch]) => put(c, ch)); if (done) done(); return; }
    let left = cells.length;
    flipping++;
    cells.forEach(([c, ch, idx]) => flicker(c, ch, {
      dur: 220 + idx * 14, step: 60, flip: 110, each: true, chars: A,
      done: () => { if (--left === 0) { flipping--; if (done) done(); } },
    }));
  }
  // a flap flickers under the mouse and lands back on what it showed
  Object.values(cols).flat().forEach((c) => c.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || flipping || still() || c.dataset.busy) return;
    c.dataset.busy = '1';
    flicker(c, c.textContent || ' ', { dur: 170, step: 55, flip: 110, each: true, chars: A, done: () => { delete c.dataset.busy; } });
  }));
  const spin = $('[data-spin]', board);
  const result = $('[data-result]', board);
  const live = $('[data-spin-live]', board);
  $('.fids', board).addEventListener('click', () => spin.click());
  // the page arrives showing the first project, so the first spin lands somewhere else
  let last = board.dataset.first || null, busy = false;
  // Picks never repeat the previous project; extra presses during a spin are ignored.
  function pick() {
    const pool = ids.filter((id) => id !== last);
    const r = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(r);
    return pool[r[0] % pool.length];
  }
  const pickCard = (id) => $$('.pcard').forEach((c) => c.toggleAttribute('data-picked', c.dataset.project === id));
  function renderResult(id) {
    const p = data[id];
    pickCard(id);
    spin.textContent = 'Spin again';
    result.innerHTML = `<span class="sw" style="--c:${p.c}"></span>
      <a class="link" href="${esc(p.href)}" data-event="case_open" data-project="${id}">Case study <span class="ar">→</span></a>`;
    if (!still()) { result.classList.remove('in'); void result.offsetWidth; result.classList.add('in'); }
  }
  const go = (byHand) => {
    if (busy) return;
    busy = true;
    spin.setAttribute('aria-disabled', 'true');
    const id = pick(); last = id;
    const p = data[id];
    live.textContent = 'Spinning…';
    flipAll({ name: p.name, type: p.board[0], status: p.board[1] }, () => {
      renderResult(id);
      live.textContent = `Landed on ${p.name}. ${p.line}`;
      busy = false;
      spin.removeAttribute('aria-disabled');
      if (byHand) track('spin_result', { project: id });
      try { sessionStorage.setItem('spin-last', id); } catch { /* storage may be blocked */ }
    });
  };
  spin.addEventListener('click', () => go(true));
  // the page arrives showing the first project; coming back from a case page keeps the last result instead
  let kept = null;
  try { kept = sessionStorage.getItem('spin-last'); } catch { /* storage may be blocked */ }
  if (kept && data[kept]) {
    last = kept;
    const p = data[kept];
    for (const [col, word] of Object.entries({ name: p.name, type: p.board[0], status: p.board[1] })) {
      const w = word.toUpperCase().padEnd(cols[col].length, ' ');
      cols[col].forEach((c, i) => { c.textContent = w[i] === ' ' ? '' : w[i]; });
    }
    renderResult(kept);
  }
})();
