'use client';

import { useAuth, StaffRole } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RoleGuardProps {
  allowedRoles: StaffRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isLoading, getDashboardPath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!allowedRoles.includes(user.role as StaffRole)) {
        toast.error("You don't have access to that page.");
        const correctPath = getDashboardPath(user.role as StaffRole);
        router.push(correctPath);
      }
    }
  }, [user, isLoading, allowedRoles, router, getDashboardPath, pathname]);

  if (isLoading || !user || !allowedRoles.includes(user.role as StaffRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
