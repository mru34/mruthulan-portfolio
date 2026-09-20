import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clearConsent, getConsent, loadAnalytics, setConsent, type ConsentChoice } from '../lib/analytics';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

function statusText(choice: ConsentChoice): string {
  if (choice === 'allow') return 'Analytics is on for this browser.';
  if (choice === 'deny') return 'Analytics is off for this browser.';
  return 'No choice saved yet.';
}

export function PrivacyPage() {
  useDocumentMeta(
    'Privacy & analytics — Mruthulan',
    "How analytics works on Mruthulan's portfolio and how to change your choice.",
  );

  const [choice, setChoice] = useState<ConsentChoice>(() => getConsent());

  function change() {
    clearConsent();
    setChoice(null);
  }

  function allow() {
    setConsent('allow');
    setChoice('allow');
    loadAnalytics();
  }

  function deny() {
    setConsent('deny');
    setChoice('deny');
  }

  return (
    <main id="main">
      <div className="shell privacy-page">
        <Link className="case-back" to="/">
          ← Back to the portfolio
        </Link>
        <p className="kicker">Privacy / Analytics</p>
        <h1 tabIndex={-1} data-route-heading>
          A simple choice about <em>analytics.</em>
        </h1>
        <p className="privacy-lead">
          This portfolio uses Google Analytics 4 only when you choose &ldquo;Allow analytics.&rdquo; It
          helps me understand which work people read and how they find the site.
        </p>

        <section>
          <h2>What is measured</h2>
          <p>
            Google Analytics may collect page views, approximate geographic location, referral
            source, browser and device information, and interactions such as outbound clicks. It
            uses cookies or similar browser identifiers. I use aggregate reports to improve the
            site; I do not ask you to create an account here.
          </p>
        </section>

        <section>
          <h2>Your choice</h2>
          <p>
            The analytics script does not load until you opt in. Your choice is saved in this
            browser so you are not asked on every page. If you decline, the site still works
            normally. You can change your choice below at any time.
          </p>
          {choice === null ? (
            <div className="analytics-banner-actions" style={{ marginBottom: 16 }}>
              <button type="button" className="analytics-allow" onClick={allow}>
                Allow analytics
              </button>
              <button type="button" className="analytics-deny" onClick={deny}>
                No thanks
              </button>
            </div>
          ) : (
            <>
              <p id="analytics-status" aria-live="polite">
                {statusText(choice)}
              </p>
              <button type="button" onClick={change}>
                Change analytics choice ↗
              </button>
            </>
          )}
        </section>

        <section>
          <h2>More information</h2>
          <p>
            Analytics data is processed by Google. Read{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google&rsquo;s privacy policy ↗
            </a>{' '}
            for details. For questions about this site, email{' '}
            <a href="mailto:mruthulansenthilnathan@gmail.com">mruthulansenthilnathan@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
