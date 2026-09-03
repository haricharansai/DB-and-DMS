import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: UserRole; phone?: string; businessName?: string }) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('marketnexus_jwt_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('marketnexus_jwt_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.data && res.data.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session expired or invalid token, logging out demo user');
          // Auto fallback to demo buyer
          await autoLoginDemoBuyer();
        }
      } else {
        // Automatically start with demo buyer for smooth exploration
        await autoLoginDemoBuyer();
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const autoLoginDemoBuyer = async () => {
    try {
      const res = await authAPI.switchRole('buyer');
      if (res.data.token && res.data.user) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('marketnexus_jwt_token', res.data.token);
      }
    } catch (e) {
      console.error('Failed auto login', e);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authAPI.login(credentials);
    if (res.data.token && res.data.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('marketnexus_jwt_token', res.data.token);
      setIsAuthModalOpen(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role?: UserRole; phone?: string; businessName?: string }) => {
    const res = await authAPI.register(data);
    if (res.data.token && res.data.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('marketnexus_jwt_token', res.data.token);
      setIsAuthModalOpen(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('marketnexus_jwt_token');
  };

  const switchRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await authAPI.switchRole(role);
      if (res.data.token && res.data.user) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('marketnexus_jwt_token', res.data.token);
      }
    } catch (err) {
      console.error('Failed to switch role', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
