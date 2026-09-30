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

  /* ---------------------------------------------------------- result galleries */
  $$('[data-gal]').forEach((gal) => {
    const shots = $$('.shot', gal), thumbs = $$('[data-thumb]', gal), cap = $('[data-gal-cap]', gal);
    thumbs.forEach((t) => t.addEventListener('click', () => {
      const i = +t.dataset.thumb;
      shots.forEach((sh, k) => sh.toggleAttribute('data-on', k === i));
      thumbs.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      cap.textContent = shots[i].dataset.zoom;
    }));
  });

  /* ---------------------------------------------------------- newspaper magnifier */
  // Mouse and pen only: on touch, a tap opens the full-screen viewer (pinch to zoom there).
  $$('[data-loupe]').forEach((paper) => {
    const lens = $('.loupe', paper), pic = $('img', paper), Z = 2.6;
    // fetch the sharp page before the pointer arrives; until then the lens uses the copy on screen
    new IntersectionObserver(([en], o) => { if (en.isIntersecting) { new Image().src = paper.href; o.disconnect(); } }, { rootMargin: '600px' }).observe(paper);
    const on = (e) => {
      if (e.pointerType === 'touch') return;
      lens.style.backgroundImage = `url("${paper.href}"), url("${pic.currentSrc || pic.src}")`;
      const r = pic.getBoundingClientRect(), pr = paper.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { paper.classList.remove('looking'); return; }
      const lw = lens.offsetWidth;
      lens.style.left = `${e.clientX - pr.left}px`;
      lens.style.top = `${e.clientY - pr.top}px`;
      const size = `${r.width * Z}px ${r.height * Z}px`, pos = `${-(x * Z - lw / 2)}px ${-(y * Z - lw / 2)}px`;
      lens.style.backgroundSize = `${size}, ${size}`;
      lens.style.backgroundPosition = `${pos}, ${pos}`;
      paper.classList.add('looking');
    };
    paper.addEventListener('pointermove', on);
    paper.addEventListener('pointerenter', on);
    paper.addEventListener('pointerleave', () => paper.classList.remove('looking'));
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
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
  const nameBtn = $('[data-name-flip]');
  if (nameBtn) {
    const orders = [['SENTHIL', 'NATHAN', 'MRUTHULAN'], ['MRUTHULAN', 'SENTHIL', 'NATHAN']];
    let flipped = false;
    nameBtn.addEventListener('click', () => {
      flipped = !flipped;
      const words = orders[flipped ? 1 : 0];
      nameBtn.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${[...w].map((ch) => `<span class="t">${ch}</span>`).join('')}</span>`).join('');
      if (!still()) {
        $$('.t', nameBtn).forEach((t, i) => {
          const final = t.textContent;
          t.style.animationDelay = `${i * 28}ms`;
          t.classList.add('f');
          let n = 0;
          const spinT = setInterval(() => {
            if (++n > 3 + (i % 5)) { clearInterval(spinT); t.textContent = final; return; }
            t.textContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.random() * 26 | 0];
          }, 45);
        });
      }
      nameBtn.setAttribute('aria-pressed', String(flipped));
      nameBtn.setAttribute('aria-label', flipped ? 'Flip my name back to Senthil Nathan Mruthulan' : 'Flip my name to Mruthulan Senthil Nathan');
    });
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
    if (hit && hit.offsetWidth) { ink.style.opacity = 1; ink.style.width = hit.offsetWidth + 'px'; ink.style.transform = `translateX(${hit.offsetLeft}px)`; }
    else ink.style.opacity = 0;
  }
  const secObs = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    mark(e.target.dataset.sec);
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-sec]').forEach((s) => secObs.observe(s));
  addEventListener('scroll', () => { if (scrollY < 200) mark(null); }, { passive: true });

  /* ---------------------------------------------------------- home: work preview */
  const rows = $('[data-rows]');
  const pv = $('[data-pv]');
  const pvSw = $('[data-pv-sw]'), pvCap = $('[data-pv-cap]');
  function showRow(row) {
    rows.classList.add('live');
    $$('.row', rows).forEach((r) => r.toggleAttribute('data-on', r === row));
    $$('[data-id]', pv).forEach((c) => c.toggleAttribute('data-on', c.dataset.id === row.dataset.id));
    pvSw.style.setProperty('--c', row.style.getPropertyValue('--c'));
    pvCap.textContent = row.dataset.caption;
  }
  const rowObs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) showRow(e.target); }), { rootMargin: '-45% 0px -50% 0px' });
  $$('.row', rows).forEach((r) => { rowObs.observe(r); r.addEventListener('focusin', () => showRow(r)); });
  // leaving the list upwards restores the calm state
  new IntersectionObserver(([e]) => { if (!e.isIntersecting && e.boundingClientRect.top > 0) rows.classList.remove('live'); }).observe(rows);

  /* ---------------------------------------------------------- home: departures board */
  const board = $('[data-board]');
  const data = JSON.parse($('#projects-data').textContent);
  const ids = Object.keys(data);
  board.hidden = false;
  const cols = {};
  $$('[data-col]', board).forEach((f) => { f.innerHTML = '<span></span>'.repeat(+f.dataset.n); cols[f.dataset.col] = [...f.children]; });
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const put = (c, ch) => {
    c.textContent = ch === ' ' ? '' : ch;
    if (!still()) { c.classList.remove('f'); void c.offsetWidth; c.classList.add('f'); }
  };
  function flipAll(words, done) {
    const jobs = []; let k = 0;
    for (const [col, word] of Object.entries(words)) {
      const cells = cols[col];
      const w = word.toUpperCase().padEnd(cells.length, ' ').slice(0, cells.length);
      cells.forEach((c, i) => jobs.push([c, w[i], k++]));
    }
    if (still() || document.hidden) { jobs.forEach(([c, ch]) => put(c, ch)); if (done) done(); return; }
    let n = 0; const t0 = performance.now();
    jobs.forEach(([c, ch, idx]) => {
      const stop = t0 + 260 + idx * 26;
      const t = setInterval(() => {
        if (performance.now() >= stop) { clearInterval(t); put(c, ch); if (++n === jobs.length && done) done(); }
        else put(c, A[Math.random() * A.length | 0]);
      }, 60);
    });
  }
  const idle = { name: 'SIX PROJECTS', type: '', status: 'PRESS SPIN' };
  let shown = false;
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting && !shown) { shown = true; o.disconnect(); flipAll(idle); }
  }, { threshold: 0.6 }).observe($('.fids', board));

  const spin = $('[data-spin]', board);
  const result = $('[data-result]', board);
  const live = $('[data-spin-live]', board);
  $('.fids', board).addEventListener('click', () => spin.click());
  let last = null, busy = false;
  // Picks never repeat the previous project; extra presses during a spin are ignored.
  function pick() {
    const pool = ids.filter((id) => id !== last);
    const r = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(r);
    return pool[r[0] % pool.length];
  }
  function renderResult(id) {
    const p = data[id];
    const ext = /^https?:/.test(p.proofHref) ? ' target="_blank" rel="noopener noreferrer"' : '';
    result.innerHTML = `<span class="sw" style="--c:${p.c}"></span>
      <div><span class="k">${esc(p.type)}</span><h3 class="nm cn">${esc(p.name)}</h3><p>${esc(p.line)}</p></div>
      <p><span class="k">My role</span>${esc(p.role)}</p>
      <p><span class="k">Result</span>${esc(p.result)}</p>
      <div class="links"><a class="link" href="${esc(p.href)}" data-event="case_open" data-project="${id}">Explore project <span class="ar">→</span></a><a class="link muted" href="${esc(p.proofHref)}"${ext} data-event="${p.proofEvent}" data-project="${id}">${esc(p.proof)}</a></div>`;
    if (!still()) { result.classList.remove('in'); void result.offsetWidth; result.classList.add('in'); }
  }
  spin.addEventListener('click', () => {
    if (busy) return;
    busy = true; shown = true;
    spin.setAttribute('aria-disabled', 'true');
    const id = pick(); last = id;
    const p = data[id];
    live.textContent = 'Spinning…';
    flipAll({ name: p.name, type: p.board[0], status: p.board[1] }, () => {
      renderResult(id);
      live.textContent = `Landed on ${p.name}. ${p.line}`;
      busy = false;
      spin.removeAttribute('aria-disabled');
      track('spin_result', { project: id });
      try { sessionStorage.setItem('spin-last', id); } catch { /* storage may be blocked */ }
    });
  });
  // coming back from a case page keeps the last result on the board
  try {
    const kept = sessionStorage.getItem('spin-last');
    if (kept && data[kept]) {
      last = kept; shown = true;
      const p = data[kept];
      for (const [col, word] of Object.entries({ name: p.name, type: p.board[0], status: p.board[1] })) {
        const w = word.toUpperCase().padEnd(cols[col].length, ' ');
        cols[col].forEach((c, i) => { c.textContent = w[i] === ' ' ? '' : w[i]; });
      }
      renderResult(kept);
    }
  } catch { /* storage may be blocked */ }
})();
