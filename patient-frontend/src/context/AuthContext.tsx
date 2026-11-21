'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export type UserRole = 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  hospitalId?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (name: string, phone: string, pass: string, age?: number, gender?: string) => Promise<void>;
  logout: () => void;
  getDashboardPath: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getDashboardPathForRole = (role: UserRole): string => {
  switch (role) {
    case 'PATIENT':
      return '/app/home';
    case 'RECEPTIONIST':
      return '/dashboard/receptionist';
    case 'DOCTOR':
      return '/dashboard/doctor';
    case 'ADMIN':
      return '/dashboard/admin';
    default:
      return '/login';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (savedUser && token) {
      try {
        const parsed: User = JSON.parse(savedUser);
        setUser(parsed);
        document.cookie = `user_role=${parsed.role}; path=/; max-age=604800; SameSite=Lax`;
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail ? { email: identifier, password } : { phone: identifier, password };
      const res = await api.post('/auth/login', payload);
      const { accessToken, refreshToken, user: userData } = res.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;

      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);

      const targetPath = getDashboardPathForRole(userData.role);
      router.push(targetPath);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      throw err;
    }
  };

  const register = async (name: string, phone: string, password: string, age?: number, gender?: string) => {
    try {
      const res = await api.post('/auth/register', { name, phone, password, age, gender });
      const { accessToken, refreshToken, user: userData } = res.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      document.cookie = `user_role=PATIENT; path=/; max-age=604800; SameSite=Lax`;

      setUser(userData);
      toast.success('Registration successful!');
      router.push('/app/home');
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Registration failed. Phone may already be registered.';
      toast.error(message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.clear();
    document.cookie = 'user_role=; Max-Age=0; path=/;';
    setUser(null);
    toast.info('Logged out successfully');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        getDashboardPath: getDashboardPathForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
