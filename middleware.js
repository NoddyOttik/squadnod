// app/middleware.js
import { auth } from '../lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session      = req.auth;
  const isSignedIn   = !!session?.user;
  const hasName      = !!session?.user?.name;

  // ── Signed OUT ────────────────────────────────────────

  if (pathname === '/groups' && !isSignedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  if (pathname.startsWith('/room/') && !isSignedIn) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname === '/auth/setup' && !isSignedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // ── Signed IN, NO display name ────────────────────────

  if (isSignedIn && !hasName && pathname === '/groups') {
    return NextResponse.redirect(new URL('/auth/setup', req.url));
  }

  if (isSignedIn && !hasName && pathname.startsWith('/room/')) {
    const setup = new URL('/auth/setup', req.url);
    setup.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(setup);
  }

  // ── Signed IN, HAS display name ───────────────────────

  if (isSignedIn && hasName && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/groups', req.url));
  }

  if (isSignedIn && hasName && pathname === '/') {
    return NextResponse.redirect(new URL('/groups', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/', '/groups', '/room/:path*', '/auth/:path*'],
};
