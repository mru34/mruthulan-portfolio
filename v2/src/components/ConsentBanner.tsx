import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, loadAnalytics, setConsent, type ConsentChoice } from '../lib/analytics';

/** Same copy and behavior as the current site's analytics banner — shown until a choice is saved. */
export function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice>(() => getConsent());

  useEffect(() => {
    if (choice === 'allow') loadAnalytics();
  }, [choice]);

  if (choice !== null) return null;

  function allow() {
    setConsent('allow');
    setChoice('allow');
  }

  function deny() {
    setConsent('deny');
    setChoice('deny');
  }

  return (
    <section className="analytics-banner" aria-label="Analytics choice">
      <div className="analytics-banner-copy">
        <strong>Help me improve this site?</strong>
        <p>
          With your permission, Google Analytics will show me which pages people visit and their
          approximate location, referral source and device.{' '}
          <Link to="/privacy">Privacy details</Link>
        </p>
      </div>
      <div className="analytics-banner-actions">
        <button type="button" className="analytics-allow" onClick={allow}>
          Allow analytics
        </button>
        <button type="button" className="analytics-deny" onClick={deny}>
          No thanks
        </button>
      </div>
    </section>
  );
}
