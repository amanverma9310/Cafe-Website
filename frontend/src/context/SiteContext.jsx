import { createContext, useContext, useMemo } from 'react';
import { siteApi } from '../services/index.js';
import { useAsync } from '../hooks/useAsync.js';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const { data, error, loading, reload } = useAsync(() => siteApi.bootstrap(), []);
  const value = useMemo(() => ({ settings: data?.settings, business: data?.business, hours: data?.hours, error, loading, reload }), [data, error, loading, reload]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>');
  return ctx;
};
