// app/api/rooms/[roomId]/join/route.js
import { auth } from '../../../../../lib/auth';
import pool from '../../../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(req, context) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const roomId = params.roomId;

  // Check room exists
  const { rows } = await pool.query(
    'SELECT id FROM rooms WHERE id = $1',
    [roomId]
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'Room not found. Check the code and try again.' },
      { status: 404 }
    );
  }

  // Upsert membership — safe to call even if already a member
  await pool.query(
    `
    INSERT INTO memberships (user_id, room_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, room_id) DO NOTHING
  `,
    [session.user.id, roomId]
  );

  return NextResponse.json({ success: true });
}
