import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { setAuthToken, clearAuthToken } from '../utils/authGuard';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = localStorage.getItem('current_user');
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      // Query Supabase for user
      const { data, error: supabaseError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (supabaseError || !data) {
        throw new Error('Email ou senha incorretos');
      }

      if (data.status === 'pending') {
        throw new Error('Sua conta aguarda aprovação de um gestor.');
      }

      if (data.status === 'blocked') {
        throw new Error('Sua conta foi bloqueada.');
      }

      const userData: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password ?? '',
        department: data.department ?? undefined,
        role: data.role,
        status: data.status ?? 'active',
        permissions: data.permissions ?? undefined,
        canDeleteApproved: data.canDeleteApproved ?? undefined,
        createdAt: (data.created_at ?? data.createdAt ?? new Date().toISOString()) as string,
      };

      // Store user in localStorage
      localStorage.setItem('current_user', JSON.stringify(userData));
      
      // Store auth token for sub-apps
      setAuthToken(userData.id, userData.email, userData.name);
      
      setUser(userData);
      setError(null);
    } catch (err: any) {
      const message = err.message || 'Erro ao fazer login. Tente novamente.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('current_user');
      clearAuthToken();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
