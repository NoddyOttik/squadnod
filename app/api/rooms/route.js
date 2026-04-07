// app/api/rooms/route.js
import { auth } from '../../../lib/auth';
import pool from '../../../lib/db';
import { NextResponse } from 'next/server';

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await pool.query(
    `
    SELECT
      r.id,
      r.name,
      r.created_at,
      COUNT(m2.user_id)::int AS member_count
    FROM rooms r
    JOIN memberships m ON m.room_id = r.id AND m.user_id = $1
    LEFT JOIN memberships m2 ON m2.room_id = r.id
    GROUP BY r.id, r.name, r.created_at
    ORDER BY r.created_at DESC
  `,
    [session.user.id]
  );

  return NextResponse.json({ rooms: rows });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roomId   = generateRoomId();
  const roomName = `${session.user.name}'s Room`;

  await pool.query(
    'INSERT INTO rooms (id, name, created_by) VALUES ($1, $2, $3)',
    [roomId, roomName, session.user.id]
  );

  await pool.query(
    'INSERT INTO memberships (user_id, room_id) VALUES ($1, $2)',
    [session.user.id, roomId]
  );

  return NextResponse.json({ roomId, roomName });
}
