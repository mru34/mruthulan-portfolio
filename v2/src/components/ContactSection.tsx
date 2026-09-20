import { track } from '../lib/analytics';

export function ContactSection() {
  return (
    <section className="contact-section" id="contact" aria-labelledby="contact-title">
      <div className="shell">
        <p className="kicker">04 / Say hello</p>
        <h2 id="contact-title">Have something worth building?</h2>
        <p>Open to internships, collaborations and ambitious ideas.</p>
        <a
          className="contact-link"
          href="mailto:mruthulansenthilnathan@gmail.com"
          onClick={() => track('contact_click')}
        >
          Let&rsquo;s talk ↗
        </a>
      </div>
    </section>
  );
}
