import { Header } from './components/Header';
import { Hero } from './components/Hero';

export default function App() {
  return (
    <>
      <div className="bg-grid" aria-hidden="true"></div>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
      </main>
    </>
  );
}
