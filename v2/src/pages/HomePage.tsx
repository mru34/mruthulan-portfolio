import { Hero } from '../components/Hero';
import { WorkSection } from '../components/WorkSection';
import { WinsStrip } from '../components/WinsStrip';
import { AboutSection } from '../components/AboutSection';
import { ContactSection } from '../components/ContactSection';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function HomePage() {
  useDocumentMeta(
    'Mruthulan — Developer & Builder',
    'Senthil Nathan Mruthulan is a Singapore-based developer building useful software for real people. Explore SignalBridge, MEANT and three hackathon wins.',
  );

  return (
    <main id="main">
      <Hero />
      <WorkSection />
      <WinsStrip />
      <AboutSection />
      <ContactSection />
    </main>
  );
}
