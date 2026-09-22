import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '../services/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', admin: null });

  useEffect(() => {
    let alive = true;
    authApi.me()
      .then((d) => alive && setState({ status: 'authed', admin: d.admin }))
      .catch(() => alive && setState({ status: 'guest', admin: null }));
    return () => { alive = false; };
  }, []);

  // Any 401 from an admin call means the session expired: drop back to the login screen.
  useEffect(() => {
    const onExpired = () => setState((s) => {
      if (s.status === 'authed') toast.error('Your session has expired. Please sign in again.');
      return { status: 'guest', admin: null };
    });
    window.addEventListener('agama:unauthorized', onExpired);
    return () => window.removeEventListener('agama:unauthorized', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await authApi.login({ email, password });
    setState({ status: 'authed', admin: d.admin });
  }, []);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setState({ status: 'guest', admin: null }); }
  }, []);
  const setAdmin = useCallback((admin) => setState({ status: 'authed', admin }), []);

  const value = useMemo(() => ({ ...state, login, logout, setAdmin }), [state, login, logout, setAdmin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
