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

  if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  const rawId = session.user.id;
  const userId =
    typeof rawId === 'number'
      ? rawId
      : Number.parseInt(String(rawId), 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const result = await pool.query(
    'UPDATE users SET name = $1 WHERE id = $2',
    [trimmed, userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
