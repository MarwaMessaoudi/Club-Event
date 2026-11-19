import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { api } from '../../../lib/http/client';
import { authApi, refreshSession } from '../api/auth.api';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, firstName, lastName, role }
  const [accessToken, setAccessToken] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  // Ref mirror so interceptors always read the latest token
  // without being re-registered on every login.
  const tokenRef = useRef(null);
  tokenRef.current = accessToken;

  const applySession = useCallback((data) => {
    tokenRef.current = data.accessToken;   // <- sync
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setUser(null);
    setAccessToken(null);
  }, []);

  // ---- Interceptors (attached exactly once) ----
  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      if (tokenRef.current && !config.url?.includes('/auth/')) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });

    const resId = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;

        if (
          error.response?.status === 401 &&
          !original?._retry &&
          !original?.url?.includes('/auth/') // never refresh for login/refresh failures
        ) {
          original._retry = true;
          try {
            // Shared with bootstrap: parallel 401s trigger ONE refresh
            const data = await refreshSession();
            applySession(data);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(original);
          } catch {
            clearSession(); // refresh cookie dead → force re-login
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [applySession, clearSession]);

  // ---- Bootstrap: restore session from the HttpOnly cookie ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await refreshSession(); // StrictMode-safe: one request only
        if (!cancelled) applySession(data);
      } catch {
        // No valid cookie → stays logged out, normal
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    applySession(data);
  };

  const register = async (payload) => {
    // payload = { email, password, firstName, lastName } — role is NEVER sent
    const data = await authApi.register(payload);
    applySession(data);
  };

  const logout = async () => {
    try {
      await authApi.logout(); // backend nulls the DB hash + clears cookie
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        bootLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setUser, // for profile updates
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}