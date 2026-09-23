import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { visitApi } from '../services/index.js';

/** Records one page view per route change on the public site. Best-effort: never blocks or surfaces errors. */
export function useVisitTracker() {
  const { pathname } = useLocation();
  const last = useRef(null);
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    visitApi.record(pathname).catch(() => {});
  }, [pathname]);
}
