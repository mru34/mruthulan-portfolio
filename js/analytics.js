// Load analytics only after the visitor has opted in.
(() => {
  const measurementId = 'G-FSK2WF40K9';
  const storageKey = 'mruthulan-analytics-choice';

  function choice() {
    try { return localStorage.getItem(storageKey); } catch { return null; }
  }

  function saveChoice(value) {
    try { localStorage.setItem(storageKey, value); } catch { /* Storage may be unavailable. */ }
    updateStatus(value);
  }

  function updateStatus(value) {
    const status = document.querySelector('#analytics-status');
    if (status) status.textContent = value === 'allow' ? 'Analytics is on for this browser.' : value === 'deny' ? 'Analytics is off for this browser.' : 'No choice saved yet.';
  }

  function loadAnalytics() {
    if (document.querySelector('script[data-portfolio-analytics]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.dataset.portfolioAnalytics = 'true';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  function showChoice() {
    if (document.querySelector('.analytics-banner')) return;
    const banner = document.createElement('section');
    banner.className = 'analytics-banner';
    banner.setAttribute('aria-label', 'Analytics choice');
    // Two equal buttons: the choice is the visitor's, so neither is dressed up as the answer.
    banner.innerHTML = '<p>Allow Google Analytics? <a href="privacy.html">What it collects</a></p><div class="analytics-banner-actions"><button type="button" class="analytics-allow">Yes</button><button type="button" class="analytics-deny">No</button></div>';
    document.body.appendChild(banner);
    // room under the footer so the bar never covers its links while it is up
    document.documentElement.style.setProperty('--consent-h', `${banner.offsetHeight}px`);
    document.documentElement.classList.add('has-consent-prompt');
    const dismiss = () => {
      banner.remove();
      document.documentElement.classList.remove('has-consent-prompt');
    };
    banner.querySelector('.analytics-allow').addEventListener('click', () => {
      saveChoice('allow');
      dismiss();
      loadAnalytics();
    });
    banner.querySelector('.analytics-deny').addEventListener('click', () => {
      saveChoice('deny');
      dismiss();
      if (document.querySelector('script[data-portfolio-analytics]')) window.location.reload();
    });
  }

  /* The first screen is the introduction, so the question waits until the visitor
     scrolls into the page (on the privacy page it is the point, so it shows at once).
     Nothing is loaded until they answer yes. */
  function askWhenReady() {
    if (document.querySelector('#analytics-change')) { showChoice(); return; }
    const onScroll = () => {
      if (window.scrollY < 240) return;
      window.removeEventListener('scroll', onScroll);
      showChoice();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const currentChoice = choice();
  updateStatus(currentChoice);
  if (currentChoice === 'allow') loadAnalytics();
  else if (currentChoice !== 'deny') askWhenReady();

  document.querySelector('#analytics-change')?.addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
    updateStatus(null);
    showChoice();
  });
})();
