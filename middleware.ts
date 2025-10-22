import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const sessionCookie = request.cookies.get('sb-session')?.value;

  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/confirm-email';
  const isPublicPage = isAuthPage || pathname === '/api/health' || pathname.startsWith('/api/auth');

  if (isPublicPage) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
