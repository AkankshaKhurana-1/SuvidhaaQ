'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading, getDashboardPath } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && user.role !== 'PATIENT') {
        router.push(getDashboardPath(user.role as any));
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router, getDashboardPath]);

  return null;
}
