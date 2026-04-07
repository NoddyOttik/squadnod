// app/api/user/setup/route.js
import { auth } from '../../../../lib/auth';
import pool from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await req.json();
  const trimmed  = name?.trim();

  if (!trimmed || trimmed.length < 2) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  await pool.query(
    'UPDATE users SET name = $1 WHERE id = $2',
    [trimmed, session.user.id]
  );

  return NextResponse.json({ success: true });
}
