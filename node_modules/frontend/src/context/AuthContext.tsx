import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthSession } from '../types';
import { authApi, LoginDto, RegisterDto } from '../services/authApi';
import apiClient from '../api/client';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(apiClient.getToken()));

  const initAuth = useCallback(async () => {
    const token = apiClient.getToken();
    if (!token) return;

    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setSession({
        user: currentUser,
        token,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        apiClient.removeToken();
      }
      console.error('Unable to restore the CreatorAI session.', error);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setSession(null);
    };

    window.addEventListener('creatorai:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('creatorai:unauthorized', handleUnauthorized);
    };
  }, [initAuth]);

  const login = async (credentials: LoginDto) => {
    setIsLoading(true);
    try {
      const newSession = await authApi.login(credentials);
      setSession(newSession);
      setUser(newSession.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDto) => {
    setIsLoading(true);
    try {
      const newSession = await authApi.register(data);
      setSession(newSession);
      setUser(newSession.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setSession(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const updated = await authApi.getCurrentUser();
      setUser(updated);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
