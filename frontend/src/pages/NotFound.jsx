import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo.jsx';
import { buttonClass } from '../components/common/CtaLink.jsx';

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-[70svh] place-items-center px-5 text-center">
      <Seo title="Page not found" noindex path="/404" />
      <div>
        <p className="font-display text-8xl text-accent">404</p>
        <h1 className="display mt-4 text-5xl">This table <em>isn’t set.</em></h1>
        <p className="mx-auto mt-5 max-w-md text-muted">The page you’re looking for has moved or never existed. Let’s get you back to the menu.</p>
        <div className="mt-8 flex justify-center gap-3"><Link to="/" className={buttonClass('primary')}>Home</Link><Link to="/menu" className={buttonClass('secondary')}>View menu</Link></div>
      </div>
    </main>
  );
}
