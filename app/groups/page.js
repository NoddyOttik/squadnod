// app/groups/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f4ff]';

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
      <main className="flex items-center justify-center min-h-dvh bg-transparent pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))]">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" aria-hidden />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-transparent px-5 py-10 pt-[max(1.25rem,var(--safe-top))] pb-[max(1.25rem,var(--safe-bottom))] max-w-lg mx-auto w-full">

      {/* Header — glass pill bar */}
      <div className="flex items-center justify-between gap-3 mb-8 rounded-full border border-white/55 bg-white/45 px-4 py-3 shadow-md shadow-slate-900/5 backdrop-blur-xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm border border-white/60">
            🎮
          </span>
          <h1
            className="text-xl font-extrabold text-slate-900 truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Squad
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-slate-600 text-xs font-medium truncate max-w-[7rem]">
            {session?.user?.name}
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/auth/register' })}
            className={`text-xs font-semibold text-slate-700 hover:text-slate-900 px-2 py-1.5 rounded-full hover:bg-white/50 transition-colors ${focus}`}
          >
            Sign out
          </button>
        </div>
      </div>

      <p className="text-slate-600 text-sm mb-6 -mt-2">
        Jump back into a room or start a new one for your squad.
      </p>

      {/* Rooms list */}
      <div className="flex flex-col gap-3 mb-6">
        {rooms.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/55 bg-white/40 p-8 text-center shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <p className="text-slate-700 text-sm font-medium">No rooms yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Create one or join with a code.
            </p>
          </div>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => router.push(`/room/${room.id}`)}
              className={`w-full rounded-[1.5rem] border border-white/55 bg-white/50 hover:bg-white/70 px-5 py-4 text-left transition-all active:scale-[0.99] shadow-md shadow-slate-900/5 backdrop-blur-md ${focus}`}
            >
              <p
                className="font-bold text-slate-900 text-base"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {room.name}
              </p>
              <p className="text-slate-600 text-xs mt-1 font-medium">
                {room.member_count} {room.member_count === 1 ? 'member' : 'members'}
                {' · '}
                <span className="tabular-nums">{room.id}</span>
              </p>
            </button>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleCreateRoom}
          className={`w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold py-3.5 rounded-full text-sm transition-all shadow-lg shadow-slate-900/20 ${focus}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          + Create new room
        </button>

        {!showJoin ? (
          <button
            type="button"
            onClick={() => setShowJoin(true)}
            className={`w-full bg-white/55 border border-white/70 hover:bg-white/75 text-slate-800 font-semibold py-3.5 rounded-full text-sm transition-all shadow-md backdrop-blur-sm ${focus}`}
          >
            Join with a code
          </button>
        ) : (
          <div className="rounded-[1.5rem] border border-white/55 bg-white/45 p-4 flex flex-col gap-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
            <input
              className={`
                w-full rounded-full px-4 py-3.5 text-slate-900 placeholder:text-slate-500
                bg-white/85 border border-white/70 shadow-inner focus:outline-none transition-all ${focus}
                ${error ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#f5f8ff]' : ''}
              `}
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value); setError(''); }}
              maxLength={10}
              autoFocus
            />
            {error && <p className="text-red-700 text-xs font-medium px-1">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowJoin(false); setRoomCode(''); setError(''); }}
                className={`flex-1 bg-white/70 text-slate-700 font-semibold py-3 rounded-full text-sm border border-white/60 hover:bg-white transition-all ${focus}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoinRoom}
                className={`flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-full text-sm transition-all shadow-md ${focus}`}
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
