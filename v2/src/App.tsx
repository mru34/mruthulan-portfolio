import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ConsentBanner } from './components/ConsentBanner';
import { RouteEffects } from './components/RouteEffects';
import { HomePage } from './pages/HomePage';
import { CasePage } from './pages/CasePage';
import { PrivacyPage } from './pages/PrivacyPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-grid" aria-hidden="true"></div>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <RouteEffects />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/work/:slug" element={<CasePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        {/* Fallback for any hosting context where the app isn't served at the domain root
            (e.g. a preview hosted under its own sub-path) — without this, <Routes> renders
            nothing when the current pathname doesn't exactly match "/", while Header/Footer
            (siblings of <Routes>) still render, producing a "nav and footer but no content" page. */}
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
      <ConsentBanner />
    </BrowserRouter>
  );
}
