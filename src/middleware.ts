import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Public routes - always accessible (exact match)
  const publicRoutes = [
    '/', '/login', '/register', '/search', '/about', '/contact',
    '/upcoming-trips', '/destinations', '/trending', '/inspiration',
    '/experiences', '/explore', '/group-trips', '/blog',
    '/terms', '/privacy', '/corporate-trip', '/forgot-password',
    '/wishlist',
  ];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Public route prefixes - any path starting with these
  const publicPrefixes = [
    '/explore/',       // /explore/{state}, /explore/{state}/{category}
    '/experiences/',   // /experiences/{category}
    '/destinations/',  // /destinations/{id}
    '/guides/',        // /guides/{slug}
    '/trips/',         // /trips/{slug}
    '/group-trips/',   // /group-trips/{state}
    '/blog/',          // /blog/{slug}
    '/book/',          // booking pages
    '/reset-password/',// password reset
  ];
  const isPublicPrefix = publicPrefixes.some(prefix => pathname.startsWith(prefix));

  const isApiRoute = pathname.startsWith('/api/');
  const isStaticFile = pathname.startsWith('/_next/') || pathname.includes('.');

  if (isStaticFile || isApiRoute) {
    return NextResponse.next();
  }

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next();
  }

  // Protected routes - require login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const role = token.role as string;

  // Admin routes
  if (pathname.startsWith('/dashboard/admin')) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Super admin routes
  if (pathname.startsWith('/dashboard/super-admin')) {
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Guide Manager routes
  if (pathname.startsWith('/dashboard/guide-manager')) {
    if (role !== 'GUIDE_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Guide routes (must come after guide-manager check)
  if (pathname.startsWith('/dashboard/guide') && !pathname.startsWith('/dashboard/guide-manager')) {
    if (role !== 'GUIDE' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // UI Manager routes
  if (pathname.startsWith('/dashboard/ui-manager')) {
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Customer routes
  if (pathname.startsWith('/dashboard/customer')) {
    if (role !== 'CUSTOMER' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
