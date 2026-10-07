import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('spendscope_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('spendscope_user');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('spendscope_token'));

  const clearSession = () => {
    localStorage.removeItem('spendscope_token');
    localStorage.removeItem('spendscope_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const persist = (payload) => {
    localStorage.setItem('spendscope_token', payload.access_token);
    localStorage.setItem('spendscope_user', JSON.stringify(payload.user));
    setToken(payload.access_token);
    setUser(payload.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    persist(data);
    return data;
  };

  const logout = () => clearSession();

  const value = useMemo(() => ({ user, token, login, register, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
