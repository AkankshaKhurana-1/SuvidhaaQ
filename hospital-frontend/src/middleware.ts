import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('user_role')?.value;

  const roleDashboardMap: Record<string, string> = {
    RECEPTIONIST: '/dashboard/receptionist',
    DOCTOR: '/dashboard/doctor',
    ADMIN: '/dashboard/admin',
  };

  // If trying to access dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/dashboard/receptionist') && role !== 'RECEPTIONIST') {
      const target = roleDashboardMap[role] || '/login';
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname.startsWith('/dashboard/doctor') && role !== 'DOCTOR') {
      const target = roleDashboardMap[role] || '/login';
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
      const target = roleDashboardMap[role] || '/login';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // Redirect /login or root / if already logged in as staff
  if (pathname === '/login' && role && roleDashboardMap[role]) {
    return NextResponse.redirect(new URL(roleDashboardMap[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
