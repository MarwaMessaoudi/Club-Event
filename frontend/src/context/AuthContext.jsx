import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, firstName, lastName, role }
  const [accessToken, setAccessToken] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);
  const tokenRef = useRef(null);
  tokenRef.current = accessToken;

  // 1. Attach interceptors once
  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      // Don't attach access token to refresh itself (it uses cookie)
      if (tokenRef.current && !config.url.includes('auth/refresh')) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });

    const resId = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        // Only retry non-auth requests once, to avoid infinite loop
        if (
          err.response?.status === 401 &&
          !original._retry &&
          !original.url.includes('auth/')
        ) {
          original._retry = true;
          try {
            const { data } = await api.post('/auth/refresh');
            setAccessToken(data.accessToken);
            setUser(data.user);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(original);
          } catch (e) {
            setUser(null);
            setAccessToken(null);
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, []);

  // 2. Restore session on F5 using HttpOnly cookie
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // no valid cookie -> stay logged out, normal
      } finally {
        setBootLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (payload) => {
    // payload = { email, password, firstName, lastName } - NEVER send role
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        bootLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}