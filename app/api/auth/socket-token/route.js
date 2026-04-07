// app/api/auth/socket-token/route.js
import { auth } from '../../../../lib/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Returns the Auth.js session JWT for the Socket.io handshake.
 * The cookie is httpOnly; the client fetches this over HTTPS with credentials.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jar = await cookies();
  const token =
    jar.get('authjs.session-token')?.value ??
    jar.get('__Secure-authjs.session-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No session token' }, { status: 401 });
  }

  return NextResponse.json({ token });
}
