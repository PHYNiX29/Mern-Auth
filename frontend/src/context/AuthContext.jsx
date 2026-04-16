import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pt_user')) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('pt_token', token);
    localStorage.setItem('pt_user', JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    setLoading(true);
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token, user: userData } = res.data;
    localStorage.setItem('pt_token', token);
    localStorage.setItem('pt_user', JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('pt_token');
    localStorage.removeItem('pt_user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
