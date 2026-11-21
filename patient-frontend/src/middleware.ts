import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('user_role')?.value;

  const roleDashboardMap: Record<string, string> = {
    PATIENT: '/app/home',
    RECEPTIONIST: '/dashboard/receptionist',
    DOCTOR: '/dashboard/doctor',
    ADMIN: '/dashboard/admin',
  };

  // 1. Patient app protection
  if (pathname.startsWith('/app')) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== 'PATIENT') {
      const target = roleDashboardMap[role] || '/login';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // 2. Staff dashboard protection
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

  // 3. Redirect /login or /register if already authenticated
  if ((pathname === '/login' || pathname === '/register') && role && roleDashboardMap[role]) {
    return NextResponse.redirect(new URL(roleDashboardMap[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/dashboard/:path*', '/login', '/register'],
};
