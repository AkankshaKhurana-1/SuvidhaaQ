'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export type StaffRole = 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  role: 'PATIENT' | StaffRole;
  hospitalId?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  getDashboardPath: (role: StaffRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getDashboardPath = (role: StaffRole): string => {
    switch (role) {
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'RECEPTIONIST' || parsed.role === 'DOCTOR' || parsed.role === 'ADMIN') {
          setUser(parsed);
          document.cookie = `user_role=${parsed.role}; path=/; max-age=604800; SameSite=Lax`;
        } else {
          // Patient tried opening hospital app
          localStorage.clear();
          document.cookie = 'user_role=; Max-Age=0; path=/;';
        }
      } catch (e) {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = res.data.data;

      // Enforcement: Patient logging in on hospital app
      if (userData.role === 'PATIENT') {
        toast.error('Patient account detected. Please use the Patient Portal instead.');
        return;
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      document.cookie = `user_role=${userData.role}; path=/; max-age=604800; SameSite=Lax`;

      setUser(userData);
      toast.success(`Welcome, ${userData.name}!`);

      const targetPath = getDashboardPath(userData.role as StaffRole);
      router.push(targetPath);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Login failed. Please check your staff credentials.';
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
