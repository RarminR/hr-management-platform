import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check for admin routes
    if (path.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Check for HR routes
    if (path.startsWith('/hr') && !['admin', 'hr'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Check for sensitive routes (medical, financial)
    if (path.includes('/medical') || path.includes('/financial')) {
      if (!['admin', 'hr'].includes(token?.role as string)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/employees/:path*',
    '/departments/:path*',
    '/admin/:path*',
    '/hr/:path*',
    '/reports/:path*',
    '/api/employees/:path*',
    '/api/departments/:path*',
    '/api/admin/:path*',
    '/api/hr/:path*',
  ],
};