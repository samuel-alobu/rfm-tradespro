import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// ============================================
// Protected Routes Configuration
// ============================================

const protectedRoutes = [
  '/dashboard',
  '/deposit',
  '/withdraw',
  '/cold-storage',
  '/investing',
  '/assets',
  '/copy-trading',
  '/markets',
  '/trade',
  '/connect-wallet',
  '/subscribe',
  '/signals',
  '/stake',
  '/referrals',
  '/real-estate',
  '/settings',
];

const adminRoutes = ['/admin'];

const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Routes that bypass maintenance mode
const maintenanceBypassRoutes = [
  '/maintenance',
  '/admin',
  '/api/admin',
  '/api/auth',
  '/api/status',
  '/login',
];

// ============================================
// Middleware Function
// ============================================

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === 'admin' || req.auth?.user?.role === 'super_admin';
  const user = req.auth?.user as { email?: string; emailVerified?: boolean; status?: string } | undefined;

  const pathname = nextUrl.pathname;

  // Check maintenance mode for non-bypass routes
  const shouldBypassMaintenance = maintenanceBypassRoutes.some(route => pathname.startsWith(route));
  
  if (!shouldBypassMaintenance && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    try {
      // Check maintenance status via internal API call
      const statusResponse = await fetch(`${nextUrl.origin}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        if (data.maintenance) {
          return NextResponse.redirect(new URL('/maintenance', nextUrl));
        }
      }
    } catch (error) {
      // If status check fails, allow request to proceed
      console.error('Maintenance check failed:', error);
    }
  }

  // Check if the path is an admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Check if the path is an auth route (login, register, etc.)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Admin routes - require admin role
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(pathname), nextUrl));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(pathname), nextUrl));
    }

    // Check if email is verified
    if (!user?.emailVerified) {
      const verifyUrl = new URL('/verify-email', nextUrl);
      verifyUrl.searchParams.set('pending', 'true');
      if (user?.email) {
        verifyUrl.searchParams.set('email', user.email);
      }
      return NextResponse.redirect(verifyUrl);
    }

    // Check if account is active
    if (user?.status !== 'active') {
      return NextResponse.redirect(new URL('/account-pending', nextUrl));
    }

    return NextResponse.next();
  }

  // Auth routes - redirect to dashboard if already logged in
  if (isAuthRoute) {
    if (isLoggedIn && user?.emailVerified && user?.status === 'active') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

// ============================================
// Middleware Config
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
