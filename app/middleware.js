// app/middleware.js
import { auth } from '../lib/auth';
import { NextResponse } from 'next/server';

/** Display name step is required after email; must be at least 2 chars (matches /api/user/setup). */
function hasDisplayName(session) {
  const n = session?.user?.name?.trim?.() ?? '';
  return n.length >= 2;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isSignedIn = !!session;
  const named = hasDisplayName(session);

  // ── Guests ─────────────────────────────────────────────
  if (!isSignedIn) {
    if (pathname === '/auth/setup') {
      return NextResponse.redirect(new URL('/auth/register', req.url));
    }
    if (pathname.startsWith('/room/')) {
      const registerUrl = new URL('/auth/register', req.url);
      registerUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(registerUrl);
    }
    if (pathname === '/groups') {
      return NextResponse.redirect(new URL('/auth/register', req.url));
    }
    return NextResponse.next();
  }

  // ── Signed in, no display name yet (after magic link, before /groups) ──
  if (!named) {
    if (pathname === '/auth/setup') {
      return NextResponse.next();
    }
    // Cannot skip ahead to groups, rooms, or other auth marketing pages
    if (
      pathname === '/groups' ||
      pathname.startsWith('/room/') ||
      pathname.startsWith('/auth/register') ||
      pathname.startsWith('/auth/signin') ||
      pathname === '/auth/verify'
    ) {
      return NextResponse.redirect(new URL('/auth/setup', req.url));
    }
    return NextResponse.next();
  }

  // ── Signed in with display name: auth screens → groups ──
  if (pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/groups', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/room/:path*', '/groups', '/auth/:path*'],
};
