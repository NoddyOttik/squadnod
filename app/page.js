// app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { getOrCreateMemberKey } from '../lib/memberKey';

function Field({ name, label, value, onChange, placeholder, error, maxLength, autoFocus }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className="text-xs font-semibold uppercase tracking-widest text-violet-200/95"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </label>
      )}
      <input
        name={name}
        className={`
          w-full rounded-xl px-4 py-3.5 text-white transition-all
          placeholder:text-zinc-500 focus:outline-none
          ${error
            ? 'ring-2 ring-red-500 bg-red-950/20'
            : 'bg-black/35 ring-1 ring-white/10 focus:ring-2 focus:ring-violet-400'
          }
        `}
        style={{ fontFamily: 'var(--font-body)' }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength ?? 30}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      {error && <p className="text-red-400 text-xs leading-snug">{error}</p>}
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [name, setName]           = useState('');
  const [roomCode, setRoomCode]   = useState('');
  const [nameError, setNameError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [mode, setMode]           = useState('create');

  function clearErrors() {
    setNameError('');
    setRoomError('');
  }

  function validateNameStr(trimmed) {
    if (!trimmed) { setNameError('Enter a name to continue'); return false; }
    if (trimmed.length < 2) { setNameError('Name must be at least 2 characters'); return false; }
    return true;
  }

  function saveSession(playerName, roomId) {
    sessionStorage.setItem('playerName', playerName.trim());
    sessionStorage.setItem('roomId', roomId);
  }

  function runCreate(playerName) {
    setLoading(true);
    const socket = getSocket();
  
    socket.emit('room:create', { playerName }, (createRes) => {
      if (!createRes?.roomId) {
        setLoading(false);
        setNameError('Failed to create room');
        return;
      }
  
      const { roomId } = createRes;
  
      socket.emit(
        'room:join',
        { roomId, playerName, memberKey: getOrCreateMemberKey() },
        (res) => {
          if (res?.error) {
            setLoading(false);
            setNameError(res.message ?? 'Something went wrong');
            return;
          }
  
          saveSession(playerName, roomId);
  
          // 👇 IMPORTANT: prevent race condition
          setTimeout(() => {
            router.push(`/room/${roomId}`);
          }, 120);
        }
      );
    });
  }

  function runJoin(playerName, code) {
    setLoading(true);
    const socket = getSocket();

    socket.emit(
      'room:join',
      { roomId: code, playerName, memberKey: getOrCreateMemberKey() },
      (res) => {
        if (res.error === 'name_taken') {
          setLoading(false);
          setNameError(res.message);
          return;
        }
        if (res.error) {
          setLoading(false);
          setRoomError('Room not found. Check the code and try again.');
          return;
        }
        saveSession(playerName, code);
        router.push(`/room/${code}`);
      }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    const form = e.currentTarget;
    const nameVal = (form.elements.namedItem('playerName')?.value ?? '').trim();
    const codeVal = (form.elements.namedItem('roomCode')?.value ?? '').trim().toLowerCase();

    setName(nameVal);
    setRoomCode(codeVal);
    clearErrors();

    if (!validateNameStr(nameVal)) return;

    if (mode === 'join') {
      if (!codeVal) { setRoomError('Enter a room code'); return; }
      runJoin(nameVal, codeVal);
    } else {
      runCreate(nameVal);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 pt-[max(2.5rem,var(--safe-top))] pb-[max(2.5rem,var(--safe-bottom))]">
      <div className="w-full max-w-md flex flex-col gap-8">

        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-xl ring-1 ring-fuchsia-400/30"
              aria-hidden
            >
              🎮
            </span>
            <div>
              <h1
                className="text-2xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                SquadNod
              </h1>
              <p className="text-sm text-violet-200/85">Chat, trivia, and more with your squad</p>
            </div>
          </div>

          <p className="text-sm text-violet-200/85 sm:max-w-[12rem] sm:text-right">
            Lobby chat, trivia rounds, and game chat in one place.
          </p>
        </header>

        <section className="text-center sm:text-left">
          <p className="mb-3 inline-flex items-center justify-center rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-100 ring-1 ring-amber-400/35">
            Real-time · multiplayer
          </p>
          <p
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Fun games with your squad
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-violet-100/90">
            Create a room, share the code, and play trivia while you chat—right in the browser.
          </p>
        </section>

        <form
          className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
          onSubmit={handleSubmit}
        >
          <Field
            name="playerName"
            label="Your name"
            value={name}
            onChange={(v) => { setName(v); setNameError(''); }}
            placeholder="What should we call you?"
            error={nameError}
            autoFocus
            maxLength={20}
          />

          <div className="flex gap-2 p-1 bg-black/30 rounded-xl ring-1 ring-white/10">
            {['create', 'join'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); clearErrors(); }}
                className={`
                  flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${mode === m
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-900/40'
                    : 'text-zinc-500 hover:text-violet-100'
                  }
                `}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {m === 'create' ? 'New Room' : 'Join Room'}
              </button>
            ))}
          </div>

          {mode === 'join' && (
            <Field
              name="roomCode"
              label="Room code"
              value={roomCode}
              onChange={(v) => { setRoomCode(v); setRoomError(''); }}
              placeholder="Enter code"
              error={roomError}
              maxLength={10}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all
              ${loading
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] text-white'
              }
            `}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? 'Connecting...' : mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>

        {mode === 'create' && (
          <p className="text-center text-sm leading-relaxed text-violet-200/80 sm:text-left">
            After creating, share your room code with friends so they can join.
          </p>
        )}

        {mode === 'join' && (
          <p className="text-center text-sm leading-relaxed text-violet-200/80 sm:text-left">
            Ask your host for the room code—it is shown in their SquadNod lobby.
          </p>
        )}

      </div>
    </main>
  );
}
