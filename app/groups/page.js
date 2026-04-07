// app/groups/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Groups() {
  const router              = useRouter();
  const { data: session }   = useSession();
  const [rooms, setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError]   = useState('');

  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      setLoading(false);
      return;
    }
    if (!session.user.name) {
      router.push('/auth/setup');
      return;
    }
    fetchRooms();
  }, [session, router]);

  async function fetchRooms() {
    const res  = await fetch('/api/rooms');
    const data = await res.json();
    setRooms(data.rooms ?? []);
    setLoading(false);
  }

  async function handleCreateRoom() {
    const res  = await fetch('/api/rooms', { method: 'POST' });
    const data = await res.json();
    if (data.roomId) router.push(`/room/${data.roomId}`);
  }

  async function handleJoinRoom() {
    const code = roomCode.trim().toLowerCase();
    if (!code) { setError('Enter a room code'); return; }

    const res  = await fetch(`/api/rooms/${code}/join`, { method: 'POST' });
    const data = await res.json();

    if (data.error) { setError(data.error); return; }
    router.push(`/room/${code}`);
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-10 max-w-sm mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-3xl font-extrabold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Squad
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Rooms list */}
      <div className="flex flex-col gap-3 mb-6">
        {rooms.length === 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm">No rooms yet.</p>
            <p className="text-zinc-600 text-xs mt-1">
              Create one or join with a code.
            </p>
          </div>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => router.push(`/room/${room.id}`)}
              className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl px-5 py-4 text-left transition-all active:scale-[0.98]"
            >
              <p
                className="font-bold text-white text-base"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {room.name}
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                {room.member_count} {room.member_count === 1 ? 'member' : 'members'}
                {' · '}
                {room.id}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleCreateRoom}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm transition-all"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          + Create new room
        </button>

        {!showJoin ? (
          <button
            onClick={() => setShowJoin(true)}
            className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 font-semibold py-3.5 rounded-xl text-sm transition-all"
          >
            Join with a code
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              className={`
                w-full bg-zinc-900 rounded-xl px-4 py-3.5 text-white
                placeholder-zinc-600 focus:outline-none transition-all
                ${error
                  ? 'ring-2 ring-red-500'
                  : 'ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500'
                }
              `}
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value); setError(''); }}
              maxLength={10}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs px-1">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowJoin(false); setRoomCode(''); setError(''); }}
                className="flex-1 bg-zinc-800 text-zinc-400 font-semibold py-3 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}
