'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  guestLogin: () => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 初始化时检查认证状态（只在客户端执行）
    const initAuth = async () => {
      try {
        if (!isClient) {
          setLoading(false);
          return;
        }

        const storedUser = localStorage.getItem('auth_user');
        const token = localStorage.getItem('auth_token');

        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          // 验证token是否仍然有效
          const isValid = await authService.isTokenValid();
          if (!isValid) {
            // Token无效，清除本地存储
            authService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        if (isClient) {
          authService.logout();
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isClient]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });

      if (response.status === 'success') {
        setUser(response.data.user);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: '网络错误，请稍后重试' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authService.register({ username, email, password });

      if (response.status === 'success') {
        setUser(response.data.user);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: '网络错误，请稍后重试' };
    }
  };

  const guestLogin = async () => {
    try {
      const response = await authService.guestLogin();

      if (response.status === 'success') {
        setUser(response.data.user);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: '网络错误，请稍后重试' };
    }
  };

  const logout = () => {
    if (isClient) {
      authService.logout();
    }
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      await authService.refreshUser();
      setUser(authService.getUser());
    } catch (error) {
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    guestLogin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
