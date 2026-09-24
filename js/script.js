(() => {
  'use strict';

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EMAIL = 'mruthulansenthilnathan@gmail.com';
  const RESUME = 'assets/Senthil-Nathan-Mruthulan-Resume.pdf';
  const isHome = document.body.dataset.page === 'home';
  const HOME = isHome ? '' : 'index.html';
  const header = document.querySelector('.site-header');
  const hasDialog = typeof HTMLDialogElement === 'function';

  /* -------------------------------------------------------- analytics --- */
  /* Consent-first: gtag only exists once the visitor has allowed analytics.
     Nothing here ever sends free text -- search sends the id of the result
     that was opened, never the query. */

  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }
  document.addEventListener('click', (event) => {
    const el = event.target.closest && event.target.closest('[data-event]');
    if (!el) return;
    track(el.dataset.event, {
      link_id: el.getAttribute('href') || '',
      project_id: el.dataset.project || ''
    });
  });

  /* ---------------------------------------------------------- helpers --- */

  const headerBottom = () => (header ? header.getBoundingClientRect().bottom : 0);

  function scrollTo(target, instant) {
    if (!target) return;
    target.scrollIntoView({
      block: 'start',
      behavior: instant || still.matches ? 'instant' : 'smooth'
    });
  }

  // focus follows the eye, so the keyboard carries on from the same place
  const NATURALLY_FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';
  function focusOn(target) {
    if (!target) return;
    /* Only headings and sections need a tabindex to receive focus. Adding one
       to something already focusable -- a work row is a link -- would set it
       to -1 and drop it out of the tab order for good. */
    if (!target.matches(NATURALLY_FOCUSABLE)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  function findHash(hash) {
    if (!hash || hash.length < 2) return null;
    try { return document.querySelector(hash); } catch (e) { return null; }
  }

  /* One overlay at a time holds the page still. A counter, so the menu and a
     dialog opened from it never unlock each other early. */
  let locks = 0;
  function lock() { if (locks++ === 0) document.documentElement.classList.add('is-locked'); }
  function unlock() { if (locks > 0 && --locks === 0) document.documentElement.classList.remove('is-locked'); }

  const heading = () => document.querySelector('.case-title, #hero-title, main h1, main h2');

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
      const target = location.hash === '#top' ? null : findHash(location.hash);
      if (target) {
        openAwardFor(target);
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
      scrollTo(document.body, true);
      focusOn(heading());
    };
    // after layout, and again once webfonts have settled the page height
    requestAnimationFrame(land);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(land);
  }

  /* Go to a fragment on this page: native hash (so history and Back behave),
     then make sure the target really is in view below the header and has
     focus. An award row opens as it is reached. */
  function goToHash(hash) {
    if (hash === '#top') {
      if (location.hash !== hash) history.pushState(null, '', hash);
      window.scrollTo({ top: 0, behavior: still.matches ? 'instant' : 'smooth' });
      focusOn(heading());
      return;
    }
    const target = findHash(hash);
    if (!target) return;
    openAwardFor(target);
    if (location.hash !== hash) history.pushState(null, '', hash);
    requestAnimationFrame(() => { scrollTo(target, false); focusOn(target); });
  }

  /* An in-page link has the same problem when embedded: the browser scrolls
     the fragment into view inside the frame, but the frame itself stays put.
     The default is left to run -- so the hash, history and Back all behave
     natively -- and the target is then nudged into view. */
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (link.hasAttribute('data-contact-open')) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2) return;
    if (hash === '#top') { event.preventDefault(); goToHash(hash); return; }
    const target = findHash(hash);
    if (!target) return;
    openAwardFor(target);
    requestAnimationFrame(() => { scrollTo(target, false); focusOn(target); });
  });

  /* Focus must never land behind the sticky bar. Browsers scroll a focused
     element into view, but not always clear of a sticky header, so this
     nudges it the rest of the way. */
  document.addEventListener('focusin', (event) => {
    const el = event.target;
    if (!header || !el || !el.getBoundingClientRect || header.contains(el) || el.closest('dialog')) return;
    // keyboard focus only: a click already put the pointer where the reader is looking
    try { if (!el.matches(':focus-visible')) return; } catch (e) { /* older engines: guard every focus */ }
    requestAnimationFrame(() => {
      const box = el.getBoundingClientRect();
      const hb = headerBottom();
      if (box.top < hb + 4 && box.bottom > 0) window.scrollBy({ top: box.top - hb - 16, behavior: 'instant' });
    });
  });

  /* ------------------------------------------------------------ header --- */

  if (header && 'IntersectionObserver' in window) {
    // stuck: a sentinel at the very top of the page leaves the viewport
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(([e]) => header.classList.toggle('is-stuck', !e.isIntersecting))
      .observe(sentinel);

    // the section being read, marked in the nav
    const navLinks = Array.from(header.querySelectorAll('.main-nav a[data-section]'));
    const sections = navLinks.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
    if (sections.length) {
      const visible = new Set();
      const mark = () => {
        // the latest section to reach the upper band is the one being read
        const current = sections.filter((s) => visible.has(s)).pop();
        navLinks.forEach((a) => {
          if (current && a.dataset.section === current.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      };
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
        mark();
      // a fixed band below the bar: no layout read while the page is starting
      }, { rootMargin: '-80px 0px -55% 0px' });
      sections.forEach((s) => spy.observe(s));
    }
  }

  /* ------------------------------------------------------------- menu --- */
  /* On a phone the nav is a panel under the bar. While it is open the page
     underneath is inert and still, a tap outside or Escape closes it, and
     choosing a link closes it without jumping the page back to the top. */

  const menuButton = document.querySelector('.menu-button');
  const mainNav = document.querySelector('.main-nav');
  let scrim = null;

  function setInert(on) {
    ['main', '.site-footer', '.analytics-banner'].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.inert = on;
    });
  }

  function setMenu(open, returnFocus) {
    if (!menuButton || !mainNav || !header) return;
    const isOpen = header.classList.contains('menu-open');
    if (open === isOpen) return;
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      scrim = document.createElement('div');
      scrim.className = 'nav-scrim';
      scrim.addEventListener('click', () => setMenu(false, true));
      header.after(scrim);
      lock();
      setInert(true);
    } else {
      if (scrim) scrim.remove();
      scrim = null;
      unlock();
      setInert(false);
      if (returnFocus) menuButton.focus();
    }
  }

  if (menuButton && mainNav) {
    menuButton.addEventListener('click', () =>
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    mainNav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('menu-open')) setMenu(false, true);
    });
    window.matchMedia('(min-width: 941px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ----------------------------------------------------------- dialogs --- */
  /* Every overlay is a native modal <dialog>: it sits in the top layer, the
     page behind it is inert, Escape closes it and focus stays inside. This
     adds the page lock, a tap-outside close and focus going back to the
     control that opened it. */

  function openModal(dialog, opener) {
    if (!hasDialog || dialog.open) return;
    dialog._opener = opener || document.activeElement;
    dialog._restore = true;
    if (header && header.classList.contains('menu-open')) setMenu(false);
    dialog.showModal();
    dialog._held = true;
    lock();
  }
  /* Cleanup runs here, synchronously, rather than waiting on the dialog's
     `close` event, which some embedded browsers deliver late or not at all.
     `close` still calls it, for any path that closes the dialog natively. */
  function settle(dialog) {
    if (!dialog._held) return;
    dialog._held = false;
    unlock();
    const back = dialog._opener;
    if (dialog._restore && back && back.isConnected && back.focus) back.focus();
  }
  function closeModal(dialog, restoreFocus) {
    dialog._restore = restoreFocus !== false;
    if (dialog.open) dialog.close();
    settle(dialog);
  }
  function wireModal(dialog) {
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeModal(dialog);
    });
    dialog.addEventListener('close', () => settle(dialog));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeModal(dialog);
    });
  }

  const closeIcon =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';

  /* ------------------------------------------------------------ toast --- */

  let toast = null, toastTimer = 0;
  function say(message) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = '';
    // cleared first and refilled a beat later, so a repeat is announced again
    setTimeout(() => {
      toast.textContent = message;
      toast.classList.add('is-on');
    }, 40);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  }

  /* ---------------------------------------------------------- contact --- */
  /* A mailto: link does nothing at all for a visitor with no mail app set
     up, so every contact point offers four routes: copy the address (works
     everywhere), Gmail compose, the default mail app, and LinkedIn. */

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through to the older route */ }
    // Safari-era fallback: a selected, off-screen field and execCommand.
    const back = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
    // inside an open dialog, so it is not inert
    (document.querySelector('dialog[open]') || document.body).appendChild(field);
    field.focus();
    field.select();
    field.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    field.remove();
    if (back && back.focus) back.focus({ preventScroll: true });
    return ok;
  }

  function selectAddress(scope) {
    const node = scope && scope.querySelector('.chooser-email');
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  async function copyEmail(button) {
    const chooser = button.closest('[data-chooser]');
    const status = chooser && chooser.querySelector('.chooser-status');
    const ok = await copyText(EMAIL);
    track('contact_copy_email', { copied: ok ? 'yes' : 'no' });
    let message;
    if (ok) {
      message = 'Email copied: ' + EMAIL;
    } else {
      selectAddress(chooser);
      message = 'Copy was blocked here. The address is selected — press Ctrl+C, or long-press to copy.';
    }
    if (status) {
      status.textContent = '';
      setTimeout(() => { status.textContent = message; }, 40);
    } else {
      say(ok ? 'Email copied' : EMAIL);
    }
    const label = button.querySelector('.chooser-label') || button;
    if (!label.dataset.idle) label.dataset.idle = label.textContent;
    if (ok) {
      label.textContent = button.classList.contains('footer-copy') ? 'Copied ✓' : 'Email copied ✓';
      button.classList.add('is-done');
      clearTimeout(button._t);
      button._t = setTimeout(() => {
        label.textContent = label.dataset.idle;
        button.classList.remove('is-done');
      }, 2600);
    }
  }

  const CONTACT_EVENTS = { gmail: 'contact_open_gmail', mail: 'contact_open_mail_app', linkedin: 'contact_open_linkedin' };
  document.addEventListener('click', (event) => {
    const el = event.target.closest && event.target.closest('[data-contact-action]');
    if (!el) return;
    const action = el.dataset.contactAction;
    if (action === 'copy') { event.preventDefault(); copyEmail(el); return; }
    if (CONTACT_EVENTS[action]) track(CONTACT_EVENTS[action]);
    const dialog = el.closest('dialog');
    if (dialog && action !== 'mail') closeModal(dialog);
  });

  const GMAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + EMAIL + '&su=Portfolio%20enquiry';
  const chooserHTML =
    '<div class="chooser" data-chooser>' +
    '<p class="chooser-address"><span class="mono">Email</span><span class="chooser-email">' + EMAIL + '</span></p>' +
    '<div class="chooser-options">' +
    '<button class="chooser-option is-primary" type="button" data-contact-action="copy">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>' +
    '<span><b class="chooser-label">Copy email address</b><span class="chooser-sub">Paste it into any mail app</span></span></button>' +
    '<a class="chooser-option" href="' + GMAIL.replace(/&/g, '&amp;') + '" target="_blank" rel="noopener noreferrer" data-contact-action="gmail">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>' +
    '<span><b class="chooser-label">Open Gmail compose <span aria-hidden="true">↗</span></b><span class="chooser-sub">Pre-addressed, in a new tab</span></span></a>' +
    '<a class="chooser-option" href="mailto:' + EMAIL + '?subject=Portfolio%20enquiry" data-contact-action="mail">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 4h16v12H8l-4 4z"/></svg>' +
    '<span><b class="chooser-label">Open default mail app</b><span class="chooser-sub">Outlook, Apple Mail and the like</span></span></a>' +
    '<a class="chooser-option" href="https://www.linkedin.com/in/senthil-nathan-mruthulan" target="_blank" rel="noopener noreferrer" data-contact-action="linkedin">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg>' +
    '<span><b class="chooser-label">Message on LinkedIn <span aria-hidden="true">↗</span></b><span class="chooser-sub">senthil-nathan-mruthulan</span></span></a>' +
    '</div><p class="chooser-status" role="status" aria-live="polite"></p></div>';

  let contactDialog = null;
  function openContact(opener) {
    if (!hasDialog) { location.href = HOME + '#contact'; return; }
    if (!contactDialog) {
      contactDialog = document.createElement('dialog');
      contactDialog.className = 'sheet';
      contactDialog.setAttribute('aria-labelledby', 'contact-sheet-title');
      contactDialog.innerHTML =
        '<div class="sheet-box"><div class="sheet-head"><div>' +
        '<p class="mono">Four ways to reach me</p>' +
        '<h2 class="dsp" id="contact-sheet-title" style="margin-top:10px">Contact Mruthulan</h2></div>' +
        '<button class="sheet-close" type="button" aria-label="Close">' + closeIcon + '</button></div>' +
        chooserHTML + '</div>';
      document.body.appendChild(contactDialog);
      wireModal(contactDialog);
      contactDialog.querySelector('.sheet-close').addEventListener('click', () => closeModal(contactDialog));
    }
    const status = contactDialog.querySelector('.chooser-status');
    if (status) status.textContent = '';
    openModal(contactDialog, opener);
    const first = contactDialog.querySelector('[data-contact-action="copy"]');
    if (first) first.focus();
    track('contact_chooser_open');
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest && event.target.closest('[data-contact-open]');
    if (!trigger || !hasDialog || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    if (header && header.classList.contains('menu-open')) setMenu(false);
    openContact(trigger.closest('.main-nav') && menuButton && window.innerWidth <= 940 ? menuButton : trigger);
  });

  /* ----------------------------------------------------------- search --- */
  /* A static index of everything worth finding. No network request, no
     external service, and the query itself is never recorded anywhere. */

  const P = (id, title, ctx, href, c, kw) => ({ id, type: 'Project', title, ctx, href, c, kw, boost: 45, event: 'case_open', project: id.slice(2) });
  const INDEX = [
    P('p-sb', 'SignalBridge', 'Consent-led youth support · SP InnovateDash 2026 champion', 'signalbridge.html', '#5BE1D8',
      'discord consent innovatedash sp youth handoff children society fastapi postgresql nextjs next api integrations automated tests testing edge cases champion hackathon'),
    P('p-mt', 'MEANT', 'AAC communication assistant · Dell InnovateFest, S$3,000', 'meant.html', '#FFB661',
      'aac tts text to speech singaporean voice dell innovatefest spd accessibility on-device offline ai ui ux presenting runner up prize'),
    P('p-bb', 'Better Call Bhai', 'Live booking site for a barber shop', 'better-call-bhai.html', '#FF8095',
      'barber booking bookings client live website frontend deployment render html css javascript whatsapp appointments shipped'),
    P('p-kc', 'KnowCad', 'AI knowledge retrieval · Autodesk AI+ML champion', 'knowcad.html', '#AC93FF',
      'autodesk retrieval rag private repo ai ml machine learning customer service copilot co-pilot hackathon champion knowledge'),
    P('p-bx', 'Boss Breaker', 'Full-stack wellness game · API, database and game logic', 'boss-breaker.html', '#A4EC76',
      'api database mysql sql node nodejs backend full-stack fullstack game wellness coursework github javascript server'),
    P('p-lm', 'Loomy', 'Social thrifting concept · 30+ user interviews', 'loomy.html', '#84B6FF',
      'thrifting interviews user research deck pitch prototype fashion sustainability product design community'),

    { id: 'x-contact', type: 'Contact', title: 'Contact Mruthulan', ctx: 'Copy my email, open Gmail or your mail app, or LinkedIn', action: 'contact', c: '#5BE1D8',
      kw: 'email mail gmail message hire reach inbox', boost: 30 },
    { id: 'x-copy', type: 'Contact', title: 'Copy address to clipboard', ctx: EMAIL, action: 'copy', c: '#5BE1D8',
      kw: 'email copy clipboard address', boost: 25 },

    { id: 's-work', type: 'Section', title: 'Work', ctx: 'All six projects, with my role and the result on each', href: HOME + '#work', kw: 'projects portfolio builds case studies', boost: 15 },
    { id: 's-wins', type: 'Section', title: 'Wins', ctx: 'Three hackathon awards in 2026', href: HOME + '#wins', kw: 'awards hackathons prizes champion recognition', boost: 15 },
    { id: 's-about', type: 'Section', title: 'About', ctx: 'How I work: ship it, build for constraints, test it, present it', href: HOME + '#about', kw: 'about me bio intro approach looking internship', boost: 15 },
    { id: 's-creds', type: 'Section', title: 'Credentials', ctx: 'Diploma in IT at Singapore Polytechnic, and student leadership', href: HOME + '#credentials',
      kw: 'education diploma singapore polytechnic sp school study leadership class chairman youth harmony acer secretary', boost: 15 },
    { id: 's-contact', type: 'Section', title: 'Contact section', ctx: 'The end of the home page, with every way to reach me', href: HOME + '#contact', kw: 'reach', boost: 15 },

    { id: 'a-sp', type: 'Award', title: 'SP InnovateDash 2026', ctx: 'Champion · with SignalBridge', href: HOME + '#win-sp', c: '#F2C97E', kw: 'award champion hackathon signalbridge winner first', boost: 10 },
    { id: 'a-dell', type: 'Award', title: 'Dell InnovateFest 2026', ctx: 'Second runner-up · S$3,000 prize · with MEANT', href: HOME + '#win-dell', c: '#F2C97E', kw: 'award prize runner up 3000 meant national final', boost: 10 },
    { id: 'a-ad', type: 'Award', title: 'Autodesk Singapore AI+ML Hackathon 2026', ctx: 'Champion · with KnowCad', href: HOME + '#win-autodesk', c: '#F2C97E', kw: 'award champion hackathon knowcad winner first', boost: 10 },

    { id: 'q-sp', type: 'Proof', title: 'SP InnovateDash post', ctx: 'My LinkedIn post about SignalBridge’s win', href: 'https://lnkd.in/p/dCBs22kx', ext: true, c: '#F2C97E', kw: 'linkedin post proof signalbridge', boost: 5, event: 'proof_post_click', project: 'sb' },
    { id: 'q-dell', type: 'Proof', title: 'Dell InnovateFest post', ctx: 'My LinkedIn post about MEANT at the national final', href: 'https://lnkd.in/p/dZQiUX3z', ext: true, c: '#F2C97E', kw: 'linkedin post proof meant', boost: 5, event: 'proof_post_click', project: 'mt' },
    { id: 'q-ad', type: 'Proof', title: 'Autodesk hackathon post', ctx: 'My LinkedIn post about KnowCad’s win', href: 'https://lnkd.in/p/dQW9Pg_v', ext: true, c: '#F2C97E', kw: 'linkedin post proof knowcad', boost: 5, event: 'proof_post_click', project: 'kc' },

    { id: 'l-resume', type: 'Link', title: 'Résumé (PDF)', ctx: 'Opens in a new tab', href: RESUME, ext: true, kw: 'resume cv pdf download', boost: 10, event: 'resume_click' },
    { id: 'l-linkedin', type: 'Link', title: 'LinkedIn profile', ctx: 'linkedin.com/in/senthil-nathan-mruthulan', href: 'https://www.linkedin.com/in/senthil-nathan-mruthulan', ext: true, kw: 'profile connect message', boost: 10 },
    { id: 'l-github', type: 'Link', title: 'GitHub', ctx: 'github.com/mru34', href: 'https://github.com/mru34', ext: true, kw: 'code repositories repos source', boost: 10 },
    { id: 'l-deck', type: 'Link', title: 'Loomy pitch deck', ctx: 'Ten slides, readable full screen', href: 'loomy.html#deck', kw: 'slides pitch deck presentation', boost: 10 },
    { id: 'l-privacy', type: 'Link', title: 'Privacy and analytics', ctx: 'How analytics works, and your choice', href: 'privacy.html', kw: 'privacy cookies analytics consent data', boost: 10 },
    { id: 'l-home', type: 'Link', title: 'Home', ctx: 'The top of the home page', href: HOME + '#top', kw: 'top start index', boost: 10 },

    { id: 'k-js', type: 'Skill', title: 'JavaScript', ctx: 'Web · Better Call Bhai, Boss Breaker', href: HOME + '#toolkit', kw: 'js web frontend', boost: 0 },
    { id: 'k-html', type: 'Skill', title: 'HTML and CSS', ctx: 'Web · Better Call Bhai', href: HOME + '#toolkit', kw: 'html css web frontend', boost: 0 },
    { id: 'k-node', type: 'Skill', title: 'Node.js', ctx: 'Web and backend · Boss Breaker', href: HOME + '#toolkit', kw: 'node nodejs backend server', boost: 0 },
    { id: 'k-py', type: 'Skill', title: 'Python', ctx: 'Backend and data', href: HOME + '#toolkit', kw: 'backend', boost: 0 },
    { id: 'k-fastapi', type: 'Skill', title: 'FastAPI', ctx: 'Backend · SignalBridge', href: HOME + '#toolkit', kw: 'python api backend', boost: 0 },
    { id: 'k-sql', type: 'Skill', title: 'SQL and PostgreSQL', ctx: 'Data · SignalBridge (PostgreSQL), Boss Breaker (MySQL)', href: HOME + '#toolkit', kw: 'database db postgres mysql data', boost: 0 },
    { id: 'k-java', type: 'Skill', title: 'Java', ctx: 'Backend and data', href: HOME + '#toolkit', kw: 'backend', boost: 0 },
    { id: 'k-git', type: 'Skill', title: 'Git', ctx: 'Practice · version control on every project', href: HOME + '#toolkit', kw: 'github version control', boost: 0 },
    { id: 'k-test', type: 'Skill', title: 'Automated testing', ctx: 'Practice · SignalBridge’s handoff tests', href: HOME + '#toolkit', kw: 'tests testing qa edge cases', boost: 0 },
    { id: 'k-deploy', type: 'Skill', title: 'Deployment', ctx: 'Practice · Better Call Bhai on Render', href: HOME + '#toolkit', kw: 'deploy hosting render ship shipped', boost: 0 }
  ];
  const SUGGESTED = ['p-sb', 'p-mt', 'p-bb', 'p-kc', 'p-bx', 'p-lm', 'x-contact', 'l-resume', 's-wins'];
  const TRY = ['AAC', 'barber', 'Autodesk', 'Discord', 'Java', 'résumé'];

  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9$]+/g, ' ').trim();
  INDEX.forEach((item) => {
    item._t = norm(item.title);
    item._tw = item._t.split(' ');
    item._k = norm(item.kw || '');
    item._kw = item._k.split(' ').filter(Boolean);
    item._c = norm(item.ctx || '');
  });

  // one edit apart: tolerates a single typo in a word of four or more letters
  function nearly(a, b) {
    if (a.length < 4 || Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  function scoreToken(item, t) {
    let best = 0;
    for (const w of item._tw) {
      if (w === t) best = Math.max(best, 80);
      else if (w.startsWith(t)) best = Math.max(best, 60);
    }
    if (!best && item._t.includes(t)) best = 40;
    for (const w of item._kw) {
      if (w === t) best = Math.max(best, 50);
      else if (w.startsWith(t)) best = Math.max(best, 35);
    }
    if (!best && item._k.includes(t)) best = 20;
    if (!best && item._c.includes(t)) best = 10;
    if (!best && (item._tw.some((w) => nearly(t, w)) || item._kw.some((w) => nearly(t, w)))) best = 8;
    return best;
  }

  function search(query) {
    const q = norm(query);
    if (!q) return SUGGESTED.map((id) => INDEX.find((i) => i.id === id));
    const tokens = q.split(' ');
    let out = [];
    INDEX.forEach((item, n) => {
      let total = 0, fuzzy = false;
      for (const t of tokens) {
        const s = scoreToken(item, t);
        if (!s) return;
        if (s === 8) fuzzy = true;
        total += s;
      }
      if (item._t === q) total += 40;
      out.push({ item, score: total + (item.boost || 0), n, fuzzy });
    });
    // a near-miss only helps when nothing matched as typed
    if (out.some((r) => !r.fuzzy)) out = out.filter((r) => !r.fuzzy);
    out.sort((a, b) => b.score - a.score || a.n - b.n);
    return out.slice(0, 9).map((r) => r.item);
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  let palette = null, pInput, pList, pEmpty, pGroup, pLive, results = [], sel = 0, liveTimer = 0;

  function buildPalette() {
    palette = document.createElement('dialog');
    palette.className = 'palette';
    palette.setAttribute('aria-label', 'Search the site');
    const touch = window.matchMedia('(hover: none)').matches;
    palette.innerHTML =
      '<div class="palette-box">' +
      '<div class="palette-field">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>' +
      '<input class="palette-input" type="search" role="combobox" aria-expanded="true" aria-controls="palette-list" ' +
      'aria-autocomplete="list" aria-label="Search projects, skills, awards and pages" ' +
      'placeholder="Search the portfolio" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">' +
      '<button class="palette-esc" type="button" aria-label="Close search">' + (touch ? 'Close' : 'Esc') + '</button>' +
      '</div>' +
      '<div class="palette-body">' +
      '<p class="mono palette-group" id="palette-group">Suggested</p>' +
      '<ul class="palette-list" id="palette-list" role="listbox" aria-labelledby="palette-group"></ul>' +
      '<div class="palette-empty" hidden></div>' +
      '</div>' +
      '<p class="mono palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></p>' +
      '<p class="sr-only" role="status" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(palette);
    wireModal(palette);
    pInput = palette.querySelector('.palette-input');
    pList = palette.querySelector('.palette-list');
    pEmpty = palette.querySelector('.palette-empty');
    pGroup = palette.querySelector('.palette-group');
    pLive = palette.querySelector('[role="status"]');

    palette.querySelector('.palette-esc').addEventListener('click', () => closeModal(palette));
    pInput.addEventListener('input', render);
    pInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { move(1); event.preventDefault(); }
      else if (event.key === 'ArrowUp') { move(-1); event.preventDefault(); }
      else if (event.key === 'Home' && event.ctrlKey) { select(0); event.preventDefault(); }
      else if (event.key === 'End' && event.ctrlKey) { select(results.length - 1); event.preventDefault(); }
      else if (event.key === 'Enter') { event.preventDefault(); if (results[sel]) activate(results[sel]); }
    });
    pList.addEventListener('pointermove', (event) => {
      const li = event.target.closest('.palette-opt');
      if (li && event.pointerType === 'mouse') select(Number(li.dataset.i), true);
    });
    pList.addEventListener('click', (event) => {
      const li = event.target.closest('.palette-opt');
      if (li) activate(results[Number(li.dataset.i)]);
    });
    pEmpty.addEventListener('click', (event) => {
      const b = event.target.closest('button[data-q]');
      if (!b) return;
      pInput.value = b.dataset.q;
      render();
      pInput.focus();
    });
  }

  function render() {
    const q = pInput.value;
    results = search(q);
    pGroup.textContent = q.trim() ? 'Results' : 'Suggested';
    pList.innerHTML = results.map((item, i) =>
      '<li class="palette-opt" role="option" id="pal-opt-' + i + '" data-i="' + i + '" aria-selected="false"' +
      (item.c ? ' style="--opt-c:' + item.c + '"' : '') + '>' +
      '<span class="palette-type">' + item.type + '</span>' +
      '<span class="palette-text"><span class="palette-title">' + esc(item.title) + '</span>' +
      '<span class="palette-ctx">' + esc(item.ctx) + '</span></span>' +
      '<span class="palette-go" aria-hidden="true">' + (item.ext ? '↗' : '→') + '</span></li>').join('');
    const none = !results.length;
    pList.hidden = none;
    pGroup.hidden = none;
    pEmpty.hidden = !none;
    if (none) {
      pEmpty.innerHTML = '<p>Nothing matches “' + esc(q.trim()) + '”. Try a project, a tool or an event:</p>' +
        TRY.map((t) => '<button type="button" data-q="' + t + '">' + t + '</button>').join('');
      pInput.removeAttribute('aria-activedescendant');
    } else {
      select(0);
    }
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      pLive.textContent = none ? 'No results' : results.length + (results.length === 1 ? ' result' : ' results');
    }, 350);
  }

  function select(i, fromPointer) {
    if (!results.length) return;
    sel = (i + results.length) % results.length;
    pList.querySelectorAll('.palette-opt').forEach((li, n) => li.setAttribute('aria-selected', String(n === sel)));
    const li = pList.querySelector('#pal-opt-' + sel);
    pInput.setAttribute('aria-activedescendant', 'pal-opt-' + sel);
    if (li && !fromPointer) li.scrollIntoView({ block: 'nearest' });
  }
  const move = (d) => select(sel + d);

  function openLink(href, external) {
    const a = document.createElement('a');
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function activate(item) {
    if (!item) return;
    track('search_result_open', { result_id: item.id });
    if (item.event) track(item.event, { link_id: item.href || '', project_id: item.project || '' });
    const opener = palette._opener;
    if (item.action === 'contact') { closeModal(palette, false); openContact(opener); return; }
    if (item.action === 'copy') {
      closeModal(palette);
      copyText(EMAIL).then((ok) => {
        track('contact_copy_email', { copied: ok ? 'yes' : 'no' });
        say(ok ? 'Email copied' : 'Copy was blocked — the address is ' + EMAIL);
      });
      return;
    }
    if (item.ext) { closeModal(palette); openLink(item.href, true); return; }
    const hashAt = item.href.indexOf('#');
    const samePage = item.href.startsWith('#');
    if (samePage) { closeModal(palette, false); goToHash(item.href.slice(hashAt)); return; }
    closeModal(palette, false);
    openLink(item.href, false);
  }

  function openSearch(opener, method) {
    if (!hasDialog) return;
    if (!palette) buildPalette();
    pInput.value = '';
    render();
    openModal(palette, opener);
    pInput.focus();
    track('search_open', { method });
  }

  const searchButton = document.querySelector('.search-button');
  if (searchButton) {
    if (!hasDialog) searchButton.hidden = true;
    else searchButton.addEventListener('click', () => openSearch(searchButton, 'button'));
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const kbd = searchButton.querySelector('.search-kbd');
    if (kbd && mac) kbd.textContent = '⌘K';
    if (mac) searchButton.setAttribute('aria-keyshortcuts', 'Meta+K /');
  }

  document.addEventListener('keydown', (event) => {
    if (!hasDialog) return;
    const k = event.key;
    if ((k === 'k' || k === 'K') && (event.ctrlKey || event.metaKey) && !event.altKey) {
      event.preventDefault();
      if (palette && palette.open) closeModal(palette);
      else if (!document.querySelector('dialog[open]')) openSearch(searchButton || document.activeElement, 'shortcut');
      return;
    }
    if (k === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const t = event.target;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (typing || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      openSearch(searchButton || document.activeElement, 'shortcut');
    }
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
  const system = document.querySelector('.system');
  let overSystem = false;

  function tone(colour) {
    if (field) field.style.setProperty('--tone', colour || '');
  }

  if (field && !still.matches) {
    // placed on the first frame: reading the viewport size during start-up
    // would force a full layout before the page has even painted
    let ax = 0, ay = 0;
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
      /* Over the constellation the art holds still, so a node never slides
         away from the pointer that is reaching for it. */
      if (heroEl && !overSystem) {
        const box = heroEl.getBoundingClientRect();
        hx = Math.max(-0.6, Math.min(0.6, (clientX - box.left) / box.width - 0.5));
        hy = Math.max(-0.6, Math.min(0.6, (clientY - box.top) / box.height - 0.5));
      }
      schedule();
    };

    if (system) {
      system.addEventListener('pointerenter', () => { overSystem = true; });
      system.addEventListener('pointerleave', () => { overSystem = false; });
    }

    /* A mouse hovers, a finger drags -- pointermove covers both, so a tablet
       gets the same response as a laptop instead of a still picture. It is
       rAF-throttled and writes only transforms, so a scroll-drag costs a
       couple of composited frames. */
    window.addEventListener('pointermove', (e) => point(e.clientX, e.clientY), { passive: true });
    if (heroEl) {
      heroEl.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        if (t) point(t.clientX, t.clientY);
      }, { passive: true });
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
      if (e.target.closest && e.target.closest('a, button, input, select, textarea, label, dialog, [role="button"], .site-header')) return;
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

    requestAnimationFrame(() => {
      ax = window.innerWidth / 2;
      ay = window.innerHeight * 0.42;
      draw();
    });
  }

  // long passages dim the aura behind them
  const calm = Array.from(document.querySelectorAll('[data-calm]'));
  if (field && calm.length && 'IntersectionObserver' in window) {
    const reading = new Set();
    const calmSpy = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? reading.add(e.target) : reading.delete(e.target)));
      field.classList.toggle('is-calm', reading.size > 0);
    }, { rootMargin: '-35% 0px -35% 0px' });
    calm.forEach((el) => calmSpy.observe(el));
  }

  /* ---------------------------------------------------- constellation --- */
  /* One node per project. Hover or focus previews it in the readout; a click
     or tap selects it, lights its connections and tints the room; the
     readout's link is the deliberate second step that opens the case. */

  if (system) {
    const nodes = Array.from(system.querySelectorAll('.node'));
    const links = Array.from(system.querySelectorAll('.sys-links path'));
    const rings = Array.from(system.querySelectorAll('.sys-rings circle'));
    const idle = system.querySelector('.readout-idle');
    const card = system.querySelector('.readout-card');
    const rNum = system.querySelector('.readout-num');
    const rName = system.querySelector('.readout-name');
    const rResult = system.querySelector('.readout-result');
    const rOpen = system.querySelector('.readout-open');
    const rRow = system.querySelector('.readout-row');
    let selected = null;

    const show = (node) => {
      const id = node ? node.dataset.node : null;
      system.classList.toggle('has-sel', !!id);
      links.forEach((p) => p.classList.toggle('is-lit', !!id && p.dataset.link.split(' ').includes(id)));
      rings.forEach((r) => r.classList.toggle('is-sel', r.dataset.node === id));
      if (!id) {
        if (idle) idle.hidden = false;
        if (card) card.hidden = true;
        if (heroEl) heroEl.style.removeProperty('--lamp');
        tone(null);
        return;
      }
      const c = node.style.getPropertyValue('--c').trim();
      system.style.setProperty('--sel', c);
      if (heroEl) heroEl.style.setProperty('--lamp', c);
      tone(c);
      if (idle) idle.hidden = true;
      if (card) card.hidden = false;
      const n = nodes.indexOf(node) + 1;
      rNum.textContent = 'Project 0' + n + ' of 06';
      rName.textContent = node.dataset.name;
      rResult.textContent = node.dataset.result;
      rOpen.href = node.dataset.href;
      rOpen.dataset.project = id;
      rOpen.setAttribute('aria-label', 'Open the ' + node.dataset.name + ' case study');
      rRow.href = '#work-' + id;
      rRow.setAttribute('aria-label', 'Find ' + node.dataset.name + ' in the work list');
    };

    const choose = (node) => {
      selected = node === selected ? null : node;
      nodes.forEach((n) => n.setAttribute('aria-pressed', String(n === selected)));
      show(selected);
    };

    nodes.forEach((node, i) => {
      node.setAttribute('aria-label', node.dataset.name + ', project ' + (i + 1) + ' of 6');
      node.tabIndex = i === 0 ? 0 : -1;
      node.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(node); });
      node.addEventListener('focus', () => show(node));
      node.addEventListener('click', () => choose(node));
      node.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        let to = null;
        if (step) to = nodes[(i + step + nodes.length) % nodes.length];
        else if (e.key === 'Home') to = nodes[0];
        else if (e.key === 'End') to = nodes[nodes.length - 1];
        else if (e.key === 'Escape' && selected) { choose(selected); return; }
        if (!to) return;
        e.preventDefault();
        nodes.forEach((n) => { n.tabIndex = n === to ? 0 : -1; });
        to.focus();
      });
    });
    const group = system.querySelector('.nodes');
    group.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') show(selected); });
    // the preview holds while focus moves on to the readout's own links
    system.addEventListener('focusout', (e) => {
      if (!system.contains(e.relatedTarget)) show(selected);
    });
  }

  /* ------------------------------------------------------- award rows --- */
  /* A click, tap or Enter opens a row's photographs and proof. One row at a
     time, and the page settles so the heading and the first photo are both
     in view below the header. */

  const awards = Array.from(document.querySelectorAll('.award-item'));

  function setAward(item, open) {
    const head = item.querySelector('.award-head');
    item.classList.toggle('is-open', open);
    if (head) head.setAttribute('aria-expanded', String(open));
  }

  // layout position, ignoring any reveal transform still in flight
  function pageTop(el) {
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  }

  function keepInView(item) {
    const head = item.querySelector('.award-head');
    const fig = item.querySelector('.award-photos figure');
    if (!head) return;
    const hb = headerBottom();
    const top = pageTop(head) - window.scrollY;
    const bottom = top + (pageTop(fig || item) - pageTop(head)) + (fig || item).offsetHeight;
    let dy = 0;
    if (top < hb + 8) dy = top - hb - 12;
    else if (bottom > window.innerHeight - 12) dy = Math.min(bottom - window.innerHeight + 24, top - hb - 12);
    if (Math.abs(dy) > 4) window.scrollTo({ top: window.scrollY + dy, behavior: still.matches ? 'instant' : 'smooth' });
  }

  function openAwardFor(target) {
    const item = target && target.closest && target.closest('.award-item');
    if (!item) return;
    awards.forEach((other) => setAward(other, other === item));
  }

  awards.forEach((item) => {
    const head = item.querySelector('.award-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      awards.forEach((other) => { if (other !== item) setAward(other, false); });
      setAward(item, open);
      tone(open ? 'var(--gold)' : null);
      // measured at once: reading layout here settles the collapse above first
      if (open) keepInView(item);
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
     only place a real file is named; nothing about it is shown on the page.
     The manifest carries each file's real size, so the frame takes its final
     shape before the image arrives and nothing shifts when it does. */

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
            if (entry.width && entry.height) {
              node.width = entry.width;
              node.height = entry.height;
            }
            if (!node.getAttribute('src')) return;
          }

          if (entry.focal) node.style.objectPosition = entry.focal;

          /* An award photo is never cropped: the frame takes the file's own
             aspect ratio, and the figure's flex ratio is set to match, so a
             pair sits at one height with proportional widths. Anything that
             would otherwise be cut -- a face at the edge, the award, the
             event text on a screen -- simply stays in frame. */
          const shape = (w, h) => {
            if (!w || !h) return;
            slot.style.aspectRatio = w + ' / ' + h;
            const pair = slot.closest('.award-photos figure');
            if (pair) pair.style.flexGrow = (w / h).toFixed(4);
          };
          if (slot.closest('.award-photos')) {
            shape(entry.width, entry.height);
            node.addEventListener('load', () => shape(node.naturalWidth, node.naturalHeight));
          }

          node.addEventListener('error', () => {
            node.remove();
            slot.classList.remove('has-file');
            slot.style.aspectRatio = '';
          });
          slot.insertBefore(node, slot.firstChild);
          slot.classList.add('has-file');
        });

        /* A frame that is still waiting says so, once per block. The note is
           written into the page so it is there without JavaScript too, and
           removed here the moment every frame in that block has a file. */
        document.querySelectorAll('.evidence-pending').forEach((note) => {
          const block = note.closest('.evidence-feature');
          if (!block) return;
          const empty = block.querySelectorAll('[data-media]:not(.has-file)').length;
          if (!empty) note.remove();
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

  const arrowSvg = (flip) =>
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'aria-hidden="true"' + (flip ? ' style="transform:rotate(180deg)"' : '') + '><path d="M15 5l-7 7 7 7"/></svg>';

  document.querySelectorAll('.deck').forEach((deckEl) => {
    const slides = Array.from(deckEl.querySelectorAll('.deck-slide'));
    const prev = deckEl.querySelector('.deck-prev');
    const next = deckEl.querySelector('.deck-next');
    const now = deckEl.querySelector('.deck-now');
    const live = deckEl.querySelector('.deck-live');
    if (slides.length < 2 || !prev || !next) return;

    let at = 0;
    deckEl.classList.add('is-live');

    let lightbox = null, zoomImg, zoomCount, zoomPrev, zoomNext, zoomTurn, zoomLive;

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
      if (lightbox && lightbox.open) {
        paintZoom(announce);
        // closing returns focus to the slide now showing, not a hidden one
        if (slides.includes(lightbox._opener)) lightbox._opener = slides[at];
      }
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

    // a swipe, read along whichever axis the slide's own left-right runs
    function swipe(el, turned) {
      let sx = 0, sy = 0, down = false;
      el.addEventListener('touchstart', (event) => {
        const t = event.touches[0];
        sx = t.clientX; sy = t.clientY; down = true;
      }, { passive: true });
      el.addEventListener('touchend', (event) => {
        if (!down) return;
        down = false;
        const t = event.changedTouches[0];
        let dx = t.clientX - sx;
        let dy = t.clientY - sy;
        if (turned && turned()) { const k = dx; dx = dy; dy = k; }
        if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.6) {
          el._swiped = true;
          show(at + (dx < 0 ? 1 : -1), true);
        }
      }, { passive: true });
    }

    const stage = deckEl.querySelector('.deck-stage');
    if (stage) swipe(stage);

    /* On a phone a 16:9 slide is too small to read in the column, so tapping
       it opens a full-screen view: a modal dialog with its own previous and
       next, arrow keys, a swipe, a slide count, and Escape or the close
       button returning focus to where you were. */
    const portrait = () => window.innerHeight > window.innerWidth * 1.1;

    function setTurn(on) {
      lightbox.classList.toggle('is-turned', on);
      zoomTurn.textContent = on ? 'Show upright' : 'Turn sideways';
      zoomTurn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    function paintZoom(announce) {
      const img = slides[at].querySelector('img');
      if (!img) return;
      zoomImg.src = img.currentSrc || img.src;
      zoomImg.alt = img.alt;
      zoomCount.textContent = 'Slide ' + (at + 1) + ' / ' + slides.length;
      zoomPrev.disabled = at === 0;
      zoomNext.disabled = at === slides.length - 1;
      if (announce) zoomLive.textContent = 'Slide ' + (at + 1) + ' of ' + slides.length + '. ' + img.alt;
    }

    function buildZoom() {
      lightbox = document.createElement('dialog');
      lightbox.className = 'deck-zoom';
      lightbox.setAttribute('aria-label', (deckEl.getAttribute('aria-label') || 'Slides') + ', full screen');
      lightbox.innerHTML =
        '<button class="deck-zoom-close" type="button" aria-label="Close full screen">' + closeIcon + '</button>' +
        '<div class="deck-zoom-frame"><img alt=""></div>' +
        '<div class="deck-zoom-bar">' +
        '<div class="deck-zoom-nav">' +
        '<button class="deck-btn deck-zoom-prev" type="button" aria-label="Previous slide">' + arrowSvg(false) + '</button>' +
        '<button class="deck-btn deck-zoom-next" type="button" aria-label="Next slide">' + arrowSvg(true) + '</button>' +
        '</div>' +
        '<p class="deck-zoom-count mono"></p>' +
        '<button class="deck-zoom-turn mono" type="button" hidden></button></div>' +
        '<p class="sr-only" role="status" aria-live="polite"></p>';
      document.body.appendChild(lightbox);
      wireModal(lightbox);
      zoomImg = lightbox.querySelector('img');
      zoomCount = lightbox.querySelector('.deck-zoom-count');
      zoomPrev = lightbox.querySelector('.deck-zoom-prev');
      zoomNext = lightbox.querySelector('.deck-zoom-next');
      zoomTurn = lightbox.querySelector('.deck-zoom-turn');
      zoomLive = lightbox.querySelector('[role="status"]');
      lightbox.querySelector('.deck-zoom-close').addEventListener('click', () => closeModal(lightbox));
      zoomPrev.addEventListener('click', () => show(at - 1, true));
      zoomNext.addEventListener('click', () => show(at + 1, true));
      zoomTurn.addEventListener('click', () => setTurn(!lightbox.classList.contains('is-turned')));
      lightbox.addEventListener('keydown', (event) => {
        const back = event.key === 'ArrowLeft' || (lightbox.classList.contains('is-turned') && event.key === 'ArrowUp');
        const fwd = event.key === 'ArrowRight' || (lightbox.classList.contains('is-turned') && event.key === 'ArrowDown');
        if (!back && !fwd) return;
        event.preventDefault();
        show(at + (fwd ? 1 : -1), true);
      });
      const frame = lightbox.querySelector('.deck-zoom-frame');
      swipe(frame, () => lightbox.classList.contains('is-turned'));
      // a tap on the empty frame, beside the slide, closes like the backdrop
      frame.addEventListener('click', (e) => {
        if (frame._swiped) { frame._swiped = false; return; }
        if (e.target === frame) closeModal(lightbox);
      });
    }

    function openZoom() {
      if (!hasDialog) return;
      if (!lightbox) buildZoom();
      paintZoom(false);
      zoomTurn.hidden = !portrait();
      setTurn(portrait());
      // back to the slide itself if the deck was opened by a tap on it
      const from = deckEl.contains(document.activeElement) ? document.activeElement : slides[at];
      openModal(lightbox, from);
      lightbox.querySelector('.deck-zoom-close').focus();
      track('deck_fullscreen', { slide: at + 1 });
    }

    if (stage) {
      stage.style.cursor = 'zoom-in';
      stage.addEventListener('click', (e) => {
        if (stage._swiped) { stage._swiped = false; return; }   // a swipe is not a tap
        if (e.target.closest('button')) return;
        openZoom();
      });
    }
    // a slide is a real control now, so it needs to be reachable and announced
    slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (!img) return;
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('role', 'button');
      slide.setAttribute('aria-label', 'Open slide full screen: ' + img.alt);
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openZoom(); }
      });
    });

    show(0, false);
  });

  /* ---------------------------------------------------------- reveals --- */

  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if (reveals.length) {
    if (still.matches || typeof IntersectionObserver !== 'function') {
      reveals.forEach((el) => el.classList.add('is-in'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          observer.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });
      reveals.forEach((el) => observer.observe(el));
    }
  }
})();
