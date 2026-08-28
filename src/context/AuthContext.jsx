import { createContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth.api';

// Exportado para que hooks/useAuth.js pueda consumirlo. El hook vive en su
// propio archivo para no romper el Fast Refresh de Vite (ver comentario ahí).
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const result = await getMe();
        setUser(result.user);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await apiLogin(email, password);
    localStorage.setItem('access_token', result.session.access_token);
    localStorage.setItem('user', JSON.stringify(result.user));
    setToken(result.session.access_token);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignorar errores de logout
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
