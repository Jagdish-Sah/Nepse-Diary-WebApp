import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './src/lib/session';

const PUBLIC_PATHS = ['/login', '/favicon.ico'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, images, Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // If user is not logged in and requesting a protected page (not /login, not /api)
  if (!session && !isPublic && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', req.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and visiting /login, redirect to /
  if (session && pathname === '/login') {
    const homeUrl = new URL('/', req.nextUrl);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
