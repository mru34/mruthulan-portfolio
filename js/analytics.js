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
    banner.innerHTML = '<div class="analytics-banner-copy"><strong>Help me improve this site?</strong><p>With your permission, Google Analytics will show me which pages people visit and their approximate location, referral source and device. <a href="privacy.html">Privacy details</a></p></div><div class="analytics-banner-actions"><button type="button" class="analytics-allow">Allow analytics</button><button type="button" class="analytics-deny">No thanks</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('.analytics-allow').addEventListener('click', () => {
      saveChoice('allow');
      banner.remove();
      loadAnalytics();
    });
    banner.querySelector('.analytics-deny').addEventListener('click', () => {
      saveChoice('deny');
      banner.remove();
      if (document.querySelector('script[data-portfolio-analytics]')) window.location.reload();
    });
  }

  const currentChoice = choice();
  updateStatus(currentChoice);
  if (currentChoice === 'allow') loadAnalytics();
  else if (currentChoice !== 'deny') showChoice();

  document.querySelector('#analytics-change')?.addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ }
    updateStatus(null);
    showChoice();
  });
})();
