import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * On every route change (but not the initial load — that would steal focus from the skip-link
 * before the user gets a chance to tab to it): jump to an in-page hash target if the URL has one
 * (e.g. nav links to "/#work" from another page), otherwise scroll to top and focus the new
 * page's heading — standard SPA fix so keyboard/screen-reader users land somewhere sensible
 * after navigating.
 */
export function RouteEffects() {
  const location = useLocation();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const heading = document.querySelector('[data-route-heading]');
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);

  return null;
}
