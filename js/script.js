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
    '<a class="chooser-option" href="https://www.linkedin.com/in/mruthulan/" target="_blank" rel="noopener noreferrer" data-contact-action="linkedin">' +
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg>' +
    '<span><b class="chooser-label">Message on LinkedIn <span aria-hidden="true">↗</span></b><span class="chooser-sub">mruthulan</span></span></a>' +
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
    { id: 'x-spin', type: 'Section', title: 'Spin the Build', ctx: 'Let the machine pick one of the six projects', href: HOME + '#spin', c: '#5BE1D8',
      kw: 'spin random pick surprise discover reel machine choose', boost: 15 },
    { id: 's-press', type: 'Section', title: 'Press: Tamil Murasu', ctx: 'MEANT featured in Tamil Murasu, 28 September 2026', href: HOME + '#press', c: '#CDBFA6',
      kw: 'press news newspaper media article featured feature tamil murasu coverage', boost: 15 },
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

    { id: 'q-tm', type: 'Proof', title: 'Tamil Murasu article', ctx: 'The feature, in Tamil, on tamilmurasu.com.sg',
      href: 'https://www.tamilmurasu.com.sg/community/applications-students-using-artificial-intelligence-social-welfare', ext: true, c: '#CDBFA6',
      kw: 'press news article tamil murasu meant newspaper', boost: 5, event: 'press_article_click', project: 'mt' },

    { id: 'l-resume', type: 'Link', title: 'Résumé (PDF)', ctx: 'Opens in a new tab', href: RESUME, ext: true, kw: 'resume cv pdf download', boost: 10, event: 'resume_click' },
    { id: 'l-linkedin', type: 'Link', title: 'LinkedIn profile', ctx: 'linkedin.com/in/mruthulan', href: 'https://www.linkedin.com/in/mruthulan/', ext: true, kw: 'profile connect message', boost: 10 },
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
  const SUGGESTED = ['p-sb', 'p-mt', 'p-bb', 'p-kc', 'p-bx', 'p-lm', 'x-spin', 's-press', 'x-contact', 'l-resume', 's-wins'];
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
  const heroLamp = document.querySelector('.hero-lamp');

  function tone(colour) {
    if (field) field.style.setProperty('--tone', colour || '');
  }

  if (field && !still.matches) {
    // placed on the first frame: reading the viewport size during start-up
    // would force a full layout before the page has even painted
    let ax = 0, ay = 0;
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
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };

    const point = (clientX, clientY) => {
      ax = clientX;
      ay = clientY;
      schedule();
    };

    /* A mouse or pen is followed as it moves. A finger is not: on a phone a
       moving finger is almost always a scroll, and the environment should sit
       still while the reader scrolls. rAF-throttled, transforms only. */
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') point(e.clientX, e.clientY);
    }, { passive: true });

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

    const control = (el) => el.closest && el.closest('a, button, input, select, textarea, label, dialog, [role="button"], .site-header, .spin-lever');

    /* A mouse press answers at once. A touch only counts once the finger
       lifts without having travelled -- a deliberate tap -- so the start of
       a scroll never sets anything moving, and the browser's pointercancel
       (fired the moment it takes the gesture for scrolling) stops it dead. */
    let tap = null;
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        tap = { x: e.clientX, y: e.clientY, t: e.timeStamp, open: !control(e.target) };
        return;
      }
      if (control(e.target)) return;
      point(e.clientX, e.clientY);
      ping(e.clientX, e.clientY);
    }, { passive: true });
    document.addEventListener('pointermove', (e) => {
      if (tap && e.pointerType === 'touch' && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 10) tap = null;
    }, { passive: true });
    document.addEventListener('pointercancel', () => { tap = null; }, { passive: true });
    document.addEventListener('pointerup', (e) => {
      if (!tap || e.pointerType !== 'touch') return;
      const t = tap;
      tap = null;
      if (e.timeStamp - t.t > 600) return;
      point(t.x, t.y);
      if (t.open) ping(t.x, t.y);
    }, { passive: true });

    // On a touch-only device nothing is tied to scrolling: it all holds still.
    const touchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    let scrollFrame = 0;
    if (!touchOnly) window.addEventListener('scroll', () => {
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

  /* --------------------------------------------------- spin the build --- */
  /* Project discovery as a small reel. The Work rows are the one source of
     truth -- name, hook, role, result, colour and link are read from them --
     so the machine can never disagree with the list. One spin at a time,
     never the same project twice running, one transform animation that the
     compositor runs on its own, and the result stays put (across a visit to
     the case page and Back, too) until the next spin. */

  const spinEl = document.querySelector('.spin');
  if (spinEl) {
    const machine = spinEl.querySelector('.spin-machine');
    const win = spinEl.querySelector('.spin-window');
    const reel = spinEl.querySelector('.spin-reel');
    const button = spinEl.querySelector('.spin-button');
    const label = spinEl.querySelector('.spin-button-label');
    const lever = spinEl.querySelector('.spin-lever');
    const stage = spinEl.querySelector('.spin-stage');
    const card = spinEl.querySelector('.spin-card');
    const live = spinEl.querySelector('.spin-live');
    const bursts = Array.from(spinEl.querySelectorAll('.spin-burst i'));
    const cNum = card.querySelector('.spin-card-num span');
    const cSym = card.querySelector('.spin-card-num use');
    const cName = card.querySelector('.spin-card-name');
    const cHook = card.querySelector('.spin-card-hook');
    const cRole = card.querySelector('.spin-card-role dd');
    const cResult = card.querySelector('.spin-card-result');
    const cExplore = card.querySelector('.spin-explore');
    const cProof = card.querySelector('.spin-proof');

    const text = (root, sel) => {
      const el = root && root.querySelector(sel);
      return el ? el.textContent.trim() : '';
    };
    const projects = Array.from(spinEl.querySelectorAll('.spin-list li')).map((li, i) => {
      const link = li.querySelector('a');
      const row = document.getElementById('work-' + li.dataset.id);
      return {
        id: li.dataset.id,
        n: i + 1,
        name: text(row, '.work-name') || link.lastChild.textContent.trim(),
        hook: text(row, '.work-hook'),
        role: text(row, '.role-full'),
        result: text(row, '.work-cell-result .work-v'),
        href: (row || link).getAttribute('href'),
        colour: (row ? row.style.getPropertyValue('--row-acc') : li.style.getPropertyValue('--c')).trim(),
        proofHref: li.dataset.proofHref,
        proofLabel: li.dataset.proofLabel,
        proofExt: li.hasAttribute('data-proof-ext'),
        proofEvent: li.dataset.proofEvent || ''
      };
    });

    // five laps of the six rows: enough travel for any spin, re-based after each
    const N = projects.length;
    const first = Array.from(reel.children);
    const laps = document.createDocumentFragment();
    for (let lap = 1; lap < 5; lap++) first.forEach((row) => laps.appendChild(row.cloneNode(true)));
    reel.appendChild(laps);
    const rows = Array.from(reel.children);

    let pos = N + 2;            // the same picture as the static reel (row 2 on the line)
    let current = -1;           // index of the project on show, -1 before the first spin
    let busy = false, anim = null, fadeTimer = 0, pendingReserve = false, won = null;
    reel.style.setProperty('--pos', String(pos));

    const KEY = 'spin-last';
    const remember = (id) => { try { sessionStorage.setItem(KEY, id); } catch (e) { /* storage blocked */ } };
    const recall = () => { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } };

    // uniform over the projects that are not on show now
    function pick() {
      const pool = projects.map((_, i) => i).filter((i) => i !== current);
      if (window.crypto && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / pool.length) * pool.length;
        do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
        return pool[buf[0] % pool.length];
      }
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function fill(i) {
      const p = projects[i];
      cNum.textContent = 'Project 0' + p.n + ' of 06';
      cSym.setAttribute('href', '#sym-' + p.id);
      cName.textContent = p.name;
      cHook.textContent = p.hook;
      cRole.textContent = p.role;
      cResult.textContent = p.result;
      cProof.innerHTML = esc(p.proofLabel) + ' <span aria-hidden="true">' + (p.proofExt ? '↗' : '→') + '</span>';
    }

    function paint(i) {
      const p = projects[i];
      fill(i);
      spinEl.style.setProperty('--sel', p.colour);
      cExplore.href = p.href;
      cExplore.dataset.project = p.id;
      cExplore.setAttribute('aria-label', 'Explore ' + p.name + ': open the case study');
      cProof.href = p.proofHref;
      if (p.proofExt) { cProof.target = '_blank'; cProof.rel = 'noopener noreferrer'; }
      else { cProof.removeAttribute('target'); cProof.removeAttribute('rel'); }
      if (p.proofEvent) { cProof.dataset.event = p.proofEvent; cProof.dataset.project = p.id; }
      else { delete cProof.dataset.event; delete cProof.dataset.project; }
      card.removeAttribute('aria-hidden');
      spinEl.classList.add('has-result');
      if (won) won.classList.remove('is-won');
      won = rows[pos];
      won.classList.add('is-won');
      if (label.textContent !== 'Spin again') label.textContent = 'Spin again';
    }

    /* The room kept for the result is the tallest of the six cards at this
       width, so no result ever changes the height of the hero. */
    function reserve() {
      if (busy) { pendingReserve = true; return; }
      spinEl.classList.add('is-measuring');
      let tallest = 0;
      projects.forEach((_, i) => { fill(i); tallest = Math.max(tallest, card.offsetHeight); });
      if (current >= 0) fill(current);
      spinEl.classList.remove('is-measuring');
      stage.style.setProperty('--stage-h', Math.ceil(tallest) + 'px');
    }

    function announce(message) {
      live.textContent = '';
      setTimeout(() => { live.textContent = message; }, 60);
    }

    /* Landing is split over two frames so neither is a long task on a slow
       phone: first the reel locks (the part the eye is on), then the card,
       the room's colour and the announcement follow a frame later. */
    function land(i) {
      pos = N + i;                                  // the same row one lap in: an invisible re-base
      reel.style.setProperty('--pos', String(pos));
      if (anim) { anim.cancel(); anim = null; }
      spinEl.classList.remove('is-spinning');
      if (won) won.classList.remove('is-won');
      won = rows[pos];
      won.classList.add('is-won');
      if (!still.matches && win.animate) {
        win.animate([{ transform: 'scale(.985)' }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
        bursts.forEach((line, k) => {
          const a = 'rotate(' + (k * 45) + 'deg) ';
          line.animate([
            { opacity: 0, transform: a + 'translateX(14px) scaleX(.3)' },
            { opacity: 0.95, offset: 0.3 },
            { opacity: 0, transform: a + 'translateX(34px) scaleX(1)' }
          ], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
        });
      }
      const settle = () => {
        paint(i);
        const p = projects[i];
        // the room takes the project's colour for a moment; it only ever adds light
        // (set on the lamp itself: a custom property on the hero would restyle all of it)
        tone(p.colour);
        if (heroLamp) heroLamp.style.setProperty('--lamp', p.colour);
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => {
          if (field && field.style.getPropertyValue('--tone') === p.colour) tone(null);
          if (heroLamp) heroLamp.style.removeProperty('--lamp');
        }, 2400);
        announce('Landed on ' + p.name + '. ' + p.result + '.');
        busy = false;
        spinEl.classList.remove('is-busy');
        button.removeAttribute('aria-disabled');
        if (pendingReserve) { pendingReserve = false; reserve(); }
      };
      if (still.matches) settle();
      else requestAnimationFrame(() => setTimeout(settle, 0));
    }

    function spin(method) {
      if (busy) return;
      busy = true;
      const next = pick();
      current = next;
      remember(projects[next].id);
      track('spin_result', { project_id: projects[next].id, method });
      spinEl.classList.add('is-busy');
      button.setAttribute('aria-disabled', 'true');
      live.textContent = '';
      if (won) { won.classList.remove('is-won'); won = null; }

      if (still.matches || !reel.animate) { land(next); return; }

      const from = pos;                             // somewhere in lap two
      const to = N * 4 + next;                      // lap five: always two full turns or more
      const R = rows[0].offsetHeight;               // the one layout read, before anything moves
      const y = (n) => 'translate3d(0,' + (-n * R).toFixed(1) + 'px,0)';
      spinEl.classList.add('is-spinning');
      anim = reel.animate([
        { transform: y(from), easing: 'cubic-bezier(.4,0,.6,1)' },
        { transform: y(from - 0.14), offset: 0.06, easing: 'cubic-bezier(.3,.4,.3,1)' },
        { transform: y(to + 0.2), offset: 0.86, easing: 'cubic-bezier(.45,0,.25,1)' },
        { transform: y(to) }
      ], { duration: 1400, fill: 'forwards' });
      let done = false;
      const finish = () => { if (!done) { done = true; land(next); } };
      anim.onfinish = finish;
      // a tab in the background can hold the finish event back; never stay stuck
      setTimeout(finish, 2600);
    }

    button.addEventListener('click', () => spin('button'));

    /* The lever: pull it down past halfway, or just click it. Pointer only --
       the button beside it is the same action for keyboard, switch and
       screen-reader users. */
    if (lever) {
      let drag = null;
      const setPull = (v) => lever.style.setProperty('--pull', v.toFixed(3));
      lever.addEventListener('pointerdown', (e) => {
        if (busy || e.button > 0) return;
        const travel = parseFloat(getComputedStyle(spinEl).getPropertyValue('--travel')) || 118;
        drag = { id: e.pointerId, y: e.clientY, travel, pull: 0 };
        lever.setPointerCapture(e.pointerId);
        lever.classList.add('is-held');
        e.preventDefault();
      });
      lever.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        drag.pull = Math.max(0, Math.min(1, (e.clientY - drag.y) / drag.travel));
        setPull(drag.pull);
      });
      const release = (e, cancelled) => {
        if (!drag || e.pointerId !== drag.id) return;
        const pull = drag.pull;
        drag = null;
        lever.classList.remove('is-held');
        if (cancelled || (pull >= 0.04 && pull <= 0.45)) { setPull(0); return; }
        if (pull < 0.04) {
          // a click: the lever gives a short tug of its own
          setPull(0.8);
          setTimeout(() => setPull(0), 170);
        } else {
          setPull(0);
        }
        spin('lever');
      };
      lever.addEventListener('pointerup', (e) => release(e, false));
      lever.addEventListener('pointercancel', (e) => release(e, true));
    }

    // back from a case page without the page cache: the last result, as it was
    const saved = projects.findIndex((p) => p.id === recall());
    if (saved >= 0) {
      current = saved;
      pos = N + saved;
      reel.style.setProperty('--pos', String(pos));
      paint(saved);
      spinEl.style.setProperty('--sel', projects[saved].colour);
    }
    reserve();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);
    let lastWidth = window.innerWidth, resizeTimer = 0;
    window.addEventListener('resize', () => {
      // a phone's toolbar sliding in or out is not a new width
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reserve, 150);
    }, { passive: true });
    spinEl.classList.add('is-live');
  }

  /* ------------------------------------------------ offscreen, paused --- */
  /* Looping animations (the Wins light, the contact beacon, the live dot)
     stop while their section is out of view. */

  if ('IntersectionObserver' in window && !still.matches) {
    const offscreen = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-off', !e.isIntersecting));
    }, { rootMargin: '160px 0px' });
    document.querySelectorAll('main > section, main > nav').forEach((el) => offscreen.observe(el));
  }

  /* ----------------------------------------------------- press viewer --- */
  /* The newspaper opens full screen in a modal dialog: zoom with the
     buttons, + and -, the wheel, a pinch or a double tap, and drag to move
     around. The page object and the button are plain links to the original
     file, so without a dialog (or without this script) they simply open it.
     Nothing is drawn over the page; the controls live in their own bar. */

  const pressLinks = Array.from(document.querySelectorAll('[data-press-open]'));
  if (pressLinks.length && hasDialog) {
    const FULL = pressLinks[0].getAttribute('href');
    const pageImg = document.querySelector('.press-object img');
    const W = 1776, H = 1416;                     // the original file's own size
    let viewer = null, vStage, vImg, vLive, bIn, bOut, bReset;
    let fit = 1, s = 1, x = 0, y = 0, maxS = 3, sw = 0, sh = 0, sl = 0, st = 0;
    const pointers = new Map();
    let pinch = null, pan = null, lastTap = 0, zoomSay = 0, wheelEnd = 0;

    const icon = (d) =>
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';

    function apply() {
      vImg.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
      const zoomed = s > 1.001;
      vStage.classList.toggle('can-pan', zoomed);
      bOut.setAttribute('aria-disabled', String(!zoomed));
      bReset.setAttribute('aria-disabled', String(!zoomed));
      bIn.setAttribute('aria-disabled', String(s >= maxS - 0.001));
    }

    // the page may be dragged only as far as its own edges
    function clamp() {
      const ox = Math.max(0, (W * fit * s - sw) / 2);
      const oy = Math.max(0, (H * fit * s - sh) / 2);
      x = Math.max(-ox, Math.min(ox, x));
      y = Math.max(-oy, Math.min(oy, y));
    }

    // cx, cy: the point to hold still, relative to the stage's centre
    function zoomTo(next, cx, cy) {
      next = Math.max(1, Math.min(maxS, next));
      const k = next / s;
      x = cx - (cx - x) * k;
      y = cy - (cy - y) * k;
      s = next;
      clamp();
      apply();
      clearTimeout(zoomSay);
      zoomSay = setTimeout(() => { vLive.textContent = s > 1.001 ? 'Zoom ' + Math.round(s * 100) + '%' : 'Whole page'; }, 300);
    }

    const local = (clientX, clientY) => [clientX - sl - sw / 2, clientY - st - sh / 2];

    function layout() {
      const box = vStage.getBoundingClientRect();
      sw = box.width; sh = box.height; sl = box.left; st = box.top;
      fit = Math.max(0.05, Math.min((sw - 24) / W, (sh - 24) / H));
      vImg.style.width = (W * fit).toFixed(1) + 'px';
      vImg.style.height = (H * fit).toFixed(1) + 'px';
      vImg.style.marginLeft = (-W * fit / 2).toFixed(1) + 'px';
      vImg.style.marginTop = (-H * fit / 2).toFixed(1) + 'px';
      // far enough in for small Tamil type to be crisp on any screen
      maxS = Math.min(8, Math.max(3, 1.5 / fit));
      s = 1; x = 0; y = 0;
      apply();
    }

    function build() {
      viewer = document.createElement('dialog');
      viewer.className = 'press-viewer';
      viewer.setAttribute('aria-labelledby', 'pv-title');
      viewer.innerHTML =
        '<div class="pv-bar">' +
        '<div class="pv-head"><p class="pv-title" id="pv-title">Tamil Murasu · 28 September 2026 · Page 8</p>' +
        '<p class="pv-hint">Zoom with + and −, the wheel, a pinch or a double tap. Drag to move around.</p></div>' +
        '<div class="pv-tools">' +
        '<button class="pv-btn" type="button" data-zoom="out" aria-label="Zoom out">' + icon('<path d="M5 12h14"/>') + '</button>' +
        '<button class="pv-btn" type="button" data-zoom="in" aria-label="Zoom in">' + icon('<path d="M12 5v14M5 12h14"/>') + '</button>' +
        '<button class="pv-btn" type="button" data-zoom="reset">' + icon('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>') +
        '<span class="pv-btn-text">Reset</span></button>' +
        '<a class="pv-btn" href="' + FULL + '" target="_blank" rel="noopener">' +
        icon('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>') +
        '<span class="pv-btn-text">Open original</span></a>' +
        '<button class="pv-btn pv-close" type="button" aria-label="Close the newspaper viewer">' + closeIcon + '</button>' +
        '</div></div>' +
        '<div class="pv-stage"><img class="pv-img" alt="" draggable="false"></div>' +
        '<p class="sr-only" role="status" aria-live="polite"></p>';
      document.body.appendChild(viewer);
      wireModal(viewer);

      vStage = viewer.querySelector('.pv-stage');
      vImg = viewer.querySelector('.pv-img');
      vLive = viewer.querySelector('[role="status"]');
      bIn = viewer.querySelector('[data-zoom="in"]');
      bOut = viewer.querySelector('[data-zoom="out"]');
      bReset = viewer.querySelector('[data-zoom="reset"]');
      vImg.alt = pageImg ? pageImg.alt : '';
      vImg.addEventListener('error', () => {
        vLive.textContent = 'The page could not be shown here. Use “Open original” to see the file.';
      });
      vImg.src = FULL;

      viewer.querySelector('.pv-close').addEventListener('click', () => closeModal(viewer));
      viewer.querySelector('.pv-tools').addEventListener('click', (e) => {
        const b = e.target.closest('[data-zoom]');
        if (!b || b.getAttribute('aria-disabled') === 'true') return;
        const z = b.dataset.zoom;
        if (z === 'reset') zoomTo(1, 0, 0);
        else zoomTo(z === 'in' ? s * 1.5 : s / 1.5, 0, 0);
      });

      viewer.addEventListener('keydown', (e) => {
        const k = e.key;
        // focus cycles through the viewer's own controls and never leaves it
        if (k === 'Tab') {
          const stops = Array.from(viewer.querySelectorAll('.pv-btn'));
          const at = stops.indexOf(document.activeElement);
          const to = e.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : (at === stops.length - 1 ? 0 : at + 1);
          e.preventDefault();
          stops[to].focus();
          return;
        }
        let handled = true;
        if (k === '+' || k === '=') zoomTo(s * 1.5, 0, 0);
        else if (k === '-' || k === '_') zoomTo(s / 1.5, 0, 0);
        else if (k === '0') zoomTo(1, 0, 0);
        else if (k.startsWith('Arrow') && s > 1.001) {
          const step = 80;
          if (k === 'ArrowLeft') x += step;
          else if (k === 'ArrowRight') x -= step;
          else if (k === 'ArrowUp') y += step;
          else y -= step;
          clamp();
          apply();
        } else handled = false;
        if (handled) e.preventDefault();
      });

      vStage.addEventListener('wheel', (e) => {
        e.preventDefault();
        vStage.classList.add('is-gesture');
        const [cx, cy] = local(e.clientX, e.clientY);
        zoomTo(s * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.06 : 0.0022)), cx, cy);
        clearTimeout(wheelEnd);
        wheelEnd = setTimeout(() => vStage.classList.remove('is-gesture'), 160);
      }, { passive: false });

      /* One finger (or the mouse) drags; two fingers pinch about their
         midpoint; a double tap or double click toggles the whole page and a
         close-up of the spot that was tapped. */
      vStage.addEventListener('pointerdown', (e) => {
        vStage.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, [e.clientX, e.clientY]);
        vStage.classList.add('is-gesture');
        if (pointers.size === 2) {
          const [a, b] = Array.from(pointers.values());
          pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, s };
          pan = null;
        } else if (pointers.size === 1) {
          pan = { px: e.clientX, py: e.clientY, x, y, moved: false };
        }
      });
      vStage.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, [e.clientX, e.clientY]);
        if (pinch && pointers.size >= 2) {
          const [a, b] = Array.from(pointers.values());
          const [cx, cy] = local((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
          zoomTo(pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, cx, cy);
        } else if (pan) {
          const dx = e.clientX - pan.px, dy = e.clientY - pan.py;
          if (Math.abs(dx) + Math.abs(dy) > 6) pan.moved = true;
          if (s > 1.001 && pan.moved) {
            x = pan.x + dx;
            y = pan.y + dy;
            clamp();
            apply();
            vStage.classList.add('is-panning');
          }
        }
      });
      const lift = (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinch = null;
        if (pointers.size === 1) {
          // one finger left after a pinch carries on as a drag, from here
          const [p] = Array.from(pointers.values());
          pan = { px: p[0], py: p[1], x, y, moved: true };
          lastTap = 0;
          return;
        }
        if (pointers.size) return;
        vStage.classList.remove('is-gesture', 'is-panning');
        if (e.type === 'pointerup' && pan && !pan.moved) {
          if (e.timeStamp - lastTap < 330) {
            lastTap = 0;
            const [cx, cy] = local(e.clientX, e.clientY);
            zoomTo(s > 1.001 ? 1 : 2.5, cx, cy);
          } else {
            lastTap = e.timeStamp;
          }
        } else {
          lastTap = 0;
        }
        pan = null;
      };
      vStage.addEventListener('pointerup', lift);
      vStage.addEventListener('pointercancel', lift);
    }

    function openViewer(opener) {
      if (!viewer) build();
      openModal(viewer, opener);
      layout();                                   // the stage has its real size now
      vLive.textContent = '';
      viewer.querySelector('.pv-close').focus();
      track('press_viewer_open');
    }

    window.addEventListener('resize', () => { if (viewer && viewer.open) layout(); }, { passive: true });
    pressLinks.forEach((link) => link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
      e.preventDefault();
      openViewer(link);
    }));
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
      row.addEventListener('pointercancel', off, { passive: true });
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

        wireShotZoom();

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

  /* ------------------------------------------------------- shot zoom --- */
  /* An interface screenshot shrunk into a phone column is a picture of text
     too small to read. Every filled evidence frame opens full size in a
     modal dialog, where the browser's own pinch-zoom works, and Escape or
     the close button hands focus back to the frame. */

  let shotZoom = null;
  function openShot(slot) {
    const img = slot.querySelector('img');
    if (!img || !hasDialog) return;
    if (!shotZoom) {
      shotZoom = document.createElement('dialog');
      shotZoom.className = 'deck-zoom shot-zoom';
      shotZoom.setAttribute('aria-label', 'Image, full size');
      shotZoom.innerHTML =
        '<button class="deck-zoom-close" type="button" aria-label="Close full size">' + closeIcon + '</button>' +
        '<div class="deck-zoom-frame"><img alt=""></div>' +
        '<div class="deck-zoom-bar"><p class="deck-zoom-count mono shot-zoom-cap"></p>' +
        '<button class="deck-zoom-turn mono" type="button" hidden></button></div>';
      document.body.appendChild(shotZoom);
      const turn = shotZoom.querySelector('.deck-zoom-turn');
      turn.addEventListener('click', () => setShotTurn(!shotZoom.classList.contains('is-turned')));
      wireModal(shotZoom);
      shotZoom.querySelector('.deck-zoom-close').addEventListener('click', () => closeModal(shotZoom));
      const frame = shotZoom.querySelector('.deck-zoom-frame');
      frame.addEventListener('click', (e) => { if (e.target === frame) closeModal(shotZoom); });
    }
    const big = shotZoom.querySelector('img');
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    const cap = slot.closest('figure') && slot.closest('figure').querySelector('.media-caption');
    shotZoom.querySelector('.shot-zoom-cap').textContent = cap ? cap.textContent : '';
    // on a portrait phone the long edge of the screen is the useful one
    const upright = window.innerHeight > window.innerWidth * 1.1;
    shotZoom.querySelector('.deck-zoom-turn').hidden = !upright;
    setShotTurn(upright);
    openModal(shotZoom, slot);
    shotZoom.querySelector('.deck-zoom-close').focus();
    track('evidence_fullscreen', { media_id: slot.dataset.media || '' });
  }

  function setShotTurn(on) {
    const turn = shotZoom.querySelector('.deck-zoom-turn');
    const big = shotZoom.querySelector('img');
    shotZoom.classList.toggle('is-turned', on);
    turn.textContent = on ? 'Show upright' : 'Turn sideways';
    turn.setAttribute('aria-pressed', on ? 'true' : 'false');
    // turned, the long edge runs down the screen and the short edge must still fit across it
    const ar = (big.naturalWidth && big.naturalHeight) ? big.naturalWidth / big.naturalHeight : 1.6;
    big.style.width = on ? Math.floor(Math.min(window.innerHeight - 190, (window.innerWidth - 40) * ar)) + 'px' : '';
  }

  function wireShotZoom() {
    document.querySelectorAll('.evidence .media.has-file, .evidence-feature .media.has-file, .award-photos .media.has-file').forEach((slot) => {
      const img = slot.querySelector('img');
      if (!img || slot.dataset.zoom) return;
      slot.dataset.zoom = '1';
      slot.classList.add('is-zoomable');
      slot.setAttribute('role', 'button');
      slot.setAttribute('tabindex', '0');
      slot.setAttribute('aria-label', 'Enlarge: ' + img.alt);
      slot.insertAdjacentHTML('beforeend',
        '<span class="zoom-badge" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M11 8v6M8 11h6"/></svg>' +
        '<span>Enlarge</span></span>');
      slot.addEventListener('click', () => openShot(slot));
      slot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openShot(slot); }
      });
    });
  }

  /* --------------------------------------------------------- galleries --- */
  /* On a phone a group of images is a row you swipe, one frame at ~85% of
     the width with the next one peeking in -- native scrolling and CSS scroll
     snap, nothing moves on its own. The bar adds Previous / Next and a
     counter. Above 640px the same markup keeps its normal layout, and
     without JavaScript the frames simply stack. */

  const chevron = (flip) =>
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'aria-hidden="true"' + (flip ? ' style="transform:rotate(180deg)"' : '') + '><path d="M15 5l-7 7 7 7"/></svg>';

  document.querySelectorAll('[data-gallery]').forEach((el) => {
    const items = Array.from(el.children).filter((c) => c.tagName === 'FIGURE');
    if (items.length < 2) return;
    el.classList.add('gallery');
    const bar = document.createElement('div');
    bar.className = 'gallery-bar';
    bar.innerHTML =
      '<button class="gallery-btn gallery-prev" type="button" aria-label="Previous image">' + chevron(false) + '</button>' +
      '<p class="gallery-count mono" aria-live="polite"><span class="sr-only">Image </span><b class="gallery-now">1</b>' +
      '<span aria-hidden="true"> / </span><span class="sr-only"> of </span>' + items.length + '</p>' +
      '<button class="gallery-btn gallery-next" type="button" aria-label="Next image">' + chevron(true) + '</button>';
    el.after(bar);
    const now = bar.querySelector('.gallery-now');
    const prevB = bar.querySelector('.gallery-prev');
    const nextB = bar.querySelector('.gallery-next');
    let at = 0, frame = 0;
    const pad = () => parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const sync = () => {
      frame = 0;
      const x = el.scrollLeft + pad();
      let best = 0, dist = Infinity;
      items.forEach((it, i) => { const d = Math.abs(it.offsetLeft - x); if (d < dist) { dist = d; best = i; } });
      at = best;
      now.textContent = String(at + 1);
      prevB.disabled = at === 0;
      nextB.disabled = at === items.length - 1;
    };
    const go = (i) => {
      const t = items[Math.max(0, Math.min(items.length - 1, i))];
      el.scrollTo({ left: t.offsetLeft - pad(), behavior: still.matches ? 'instant' : 'smooth' });
    };
    el.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(sync); }, { passive: true });
    prevB.addEventListener('click', () => go(at - 1));
    nextB.addEventListener('click', () => go(at + 1));
    // every gallery starts at its first frame: no layout is read until it scrolls
    prevB.disabled = true;
  });

  /* ------------------------------------------------------ case strip --- */
  /* The phone reading bar on a case page. It appears once the hero has
     scrolled away, carries a thin reading-progress line, and steps aside as
     the bottom navigation comes into view so it never covers the end. */

  const strip = document.querySelector('.case-strip');
  const caseHero = document.querySelector('.case-hero');
  const caseEnd = document.querySelector('.case-next');
  if (strip && caseHero && caseEnd && 'IntersectionObserver' in window) {
    strip.hidden = false;
    const fill = strip.querySelector('.case-strip-progress span');
    let past = false, end = false, pf = 0;
    const show = () => strip.classList.toggle('is-shown', past && !end);
    new IntersectionObserver(([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; show(); }).observe(caseHero);
    new IntersectionObserver(([e]) => { end = e.isIntersecting || e.boundingClientRect.top < 0; show(); },
      { rootMargin: '0px 0px 60px 0px' }).observe(caseEnd);
    const progress = () => {
      pf = 0;
      const span = caseEnd.offsetTop - window.innerHeight;
      const k = span > 0 ? Math.max(0, Math.min(1, window.scrollY / span)) : 1;
      fill.style.transform = 'scaleX(' + k.toFixed(3) + ')';
    };
    window.addEventListener('scroll', () => { if (!pf) pf = requestAnimationFrame(progress); }, { passive: true });
    requestAnimationFrame(progress);
  }

  /* ------------------------------------------------- contact options --- */
  /* On a phone the two routes that always work lead, and the two mail-app
     routes sit one tap away. Above 640px all four simply show. */

  const moreButton = document.querySelector('.chooser-more');
  const morePanel = moreButton && document.getElementById(moreButton.getAttribute('aria-controls'));
  if (moreButton && morePanel) {
    moreButton.addEventListener('click', () => {
      const open = moreButton.getAttribute('aria-expanded') !== 'true';
      moreButton.setAttribute('aria-expanded', String(open));
      morePanel.classList.toggle('is-open', open);
    });
  }

  /* ----------------------------------------------- supplied content --- */
  /* Words only Mruthulan can write live in data/content.json. An entry
     renders only when it is marked ready and actually has text; until then
     its slot stays hidden, so no placeholder wording ever reaches the page. */

  const contentSlots = Array.from(document.querySelectorAll('[data-content]'));
  if (contentSlots.length) {
    fetch('data/content.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!c) return;
        contentSlots.forEach((slot) => {
          const e = c[slot.dataset.content];
          if (e && e.status === 'ready' && typeof e.text === 'string' && e.text.trim()) {
            slot.textContent = e.text.trim();
            slot.hidden = false;
          }
        });
      })
      .catch(() => { /* nothing supplied, nothing shown */ });
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
  /* Content is never hidden waiting for a script: every block is visible in
     the markup and stays visible if this never runs. What scrolls into view
     later gets a short arrival -- a small rise from a softened start -- and
     anything already on screen at load is simply there. Reduced motion
     skips it entirely. */

  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if (reveals.length && !still.matches && 'IntersectionObserver' in window) {
    /* The observer's first report says where each block starts. Anything
       already on screen, or above it, is left exactly as it is; only blocks
       that later scroll in get the arrival. No layout is read here. */
    const reported = new WeakSet();
    const arrive = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const el = e.target;
        if (!reported.has(el)) {
          reported.add(el);
          if (e.isIntersecting || e.boundingClientRect.top < 0) { arrive.unobserve(el); return; }
          return;
        }
        if (!e.isIntersecting) return;
        arrive.unobserve(el);
        el.classList.add('is-arriving');
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => arrive.observe(el));
  }
})();
