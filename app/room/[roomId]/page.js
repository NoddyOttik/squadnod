// app/room/[roomId]/page.js
import { auth } from '../../../lib/auth';
import { redirect } from 'next/navigation';
import RoomClient from './RoomClient';

export default async function RoomPage(props) {
  const params = await props.params;
  const roomId = params.roomId;

  const session = await auth();
  if (!session) {
    redirect(`/auth/register?callbackUrl=${encodeURIComponent(`/room/${roomId}`)}`);
  }
  if (!session.user?.name) {
    redirect('/auth/setup');
  }

  return (
    <RoomClient
      roomId={roomId}
      initialName={session.user.name}
    />
  );
}
