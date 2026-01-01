'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, getAuthToken, removeAuthToken } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

export type AuthStatus = 'loading' | 'onboarding' | 'locked' | 'authenticated';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  status: AuthStatus;
  isAuthenticated: boolean;
  userName: string | null;
  completeOnboarding: (name: string) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  lock: () => void;
  setPin: (pin: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const profile = await authAPI.getProfileStatus();
      setUserName(profile.userName);

      if (!profile.hasUser) {
        setStatus('onboarding');
        setUser(null);
        setLoading(false);
        return;
      }

      if (profile.hasPin) {
        const token = getAuthToken();
        if (!token) {
          setStatus('locked');
          setUser(null);
          setLoading(false);
          return;
        }
        try {
          const me = await authAPI.getMe();
          setUser(me);
          setStatus('authenticated');
        } catch {
          removeAuthToken();
          setStatus('locked');
          setUser(null);
        }
        setLoading(false);
        return;
      }

      // Pas de PIN : ouvrir session automatiquement
      try {
        const session = await authAPI.desktopSession();
        setUser(session.user);
        setStatus('authenticated');
      } catch {
        setStatus('locked');
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur checkAuth:', error);
      setStatus('onboarding');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (name: string) => {
    const { user: newUser } = await authAPI.setup(name);
    setUser(newUser);
    setUserName(newUser.name);
    setStatus('authenticated');
  };

  const unlock = async (pin: string) => {
    const { user: u } = await authAPI.verifyPin(pin);
    setUser(u);
    setStatus('authenticated');
  };

  const lock = () => {
    removeAuthToken();
    setUser(null);
    setStatus('locked');
  };

  const setPin = async (pin: string) => {
    await authAPI.setPin(pin);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setStatus('onboarding');
    setUserName(null);
  };

  const refreshUser = async () => {
    try {
      const me = await authAPI.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) setUser({ ...user, ...userData });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        status,
        isAuthenticated: status === 'authenticated',
        userName,
        completeOnboarding,
        unlock,
        lock,
        setPin,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
