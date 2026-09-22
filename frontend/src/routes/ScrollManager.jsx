import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to top on navigation; honour #hash anchors even when their section loads asynchronously. */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    let tries = 0;
    const id = decodeURIComponent(hash.slice(1));
    const timer = setInterval(() => {
      const el = document.getElementById(id);
      tries += 1;
      if (el) { el.scrollIntoView({ block: 'start' }); clearInterval(timer); }
      else if (tries > 30) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);
  return null;
}
