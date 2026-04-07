// app/middleware.js
import { auth } from '../lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isSignedIn = !!req.auth;

  // Protect room routes
  if (pathname.startsWith('/room/') && !isSignedIn) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Protect groups screen
  if (pathname === '/groups' && !isSignedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // Redirect signed-in users away from auth pages
  if (
    pathname.startsWith('/auth/') &&
    isSignedIn &&
    pathname !== '/auth/setup'
  ) {
    return NextResponse.redirect(new URL('/groups', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/room/:path*', '/groups', '/auth/:path*'],
};
