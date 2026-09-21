import { useState } from 'react';
import { Hero } from '../components/Hero';
import { WorkSection } from '../components/WorkSection';
import { WinsStrip } from '../components/WinsStrip';
import { AboutSection } from '../components/AboutSection';
import { ContactSection } from '../components/ContactSection';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { PROJECTS } from '../data/projects';
import { track } from '../lib/analytics';

export function HomePage() {
  useDocumentMeta(
    'Mruthulan — Developer & Builder',
    'Senthil Nathan Mruthulan is a Singapore-based developer building useful software for real people. Explore SignalBridge, MEANT and two hackathon wins.',
  );

  const [activeId, setActiveId] = useState(PROJECTS[0].id);

  function select(id: string, surface: 'hero' | 'work') {
    setActiveId(id);
    track('project_select', { project_id: id, surface });
  }

  return (
    <main id="main">
      <Hero activeId={activeId} onSelect={(id) => select(id, 'hero')} />
      <WorkSection activeId={activeId} onSelect={(id) => select(id, 'work')} />
      <WinsStrip />
      <AboutSection />
      <ContactSection />
    </main>
  );
}
