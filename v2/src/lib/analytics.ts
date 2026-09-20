// Ported from the current site's js/analytics.js — same storage key and GA4 ID, so a
// returning visitor's existing consent choice still applies after the redesign.

const MEASUREMENT_ID = 'G-FSK2WF40K9';
const STORAGE_KEY = 'mruthulan-analytics-choice';

export type ConsentChoice = 'allow' | 'deny' | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getConsent(): ConsentChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'allow' || value === 'deny' ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: 'allow' | 'deny'): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Storage may be unavailable. */
  }
  if (value === 'allow') loadAnalytics();
}

export function clearConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}

export function loadAnalytics(): void {
  if (document.querySelector('script[data-portfolio-analytics]')) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.dataset.portfolioAnalytics = 'true';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

/** Only sends an event when the visitor has opted in. Never send names, emails or free text. */
export function track(event: string, params?: Record<string, string | number | boolean>): void {
  if (getConsent() !== 'allow' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}
