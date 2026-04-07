// app/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { getOrCreateMemberKey } from '../lib/memberKey';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f4ff]';

function Field({ name, label, value, onChange, placeholder, error, maxLength, autoFocus }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className="text-xs font-semibold uppercase tracking-widest text-slate-700"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </label>
      )}
      <input
        name={name}
        className={`
          w-full rounded-full px-4 py-3.5 text-slate-900 transition-all
          placeholder:text-slate-500 bg-white/70 backdrop-blur-md border border-white/60 shadow-sm
          ${focusRing}
          ${error
            ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#f0f4ff]'
            : ''
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
      {error && <p className="text-red-700 text-xs font-medium leading-snug">{error}</p>}
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-xl shadow-md border border-white/60 backdrop-blur-md"
              aria-hidden
            >
              🎮
            </span>
            <div>
              <h1
                className="text-2xl font-extrabold tracking-tight text-slate-900"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                SquadNod
              </h1>
              <p className="text-sm text-slate-600">Chat, trivia, and more with your squad</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 sm:max-w-[12rem] sm:text-right">
            Lobby chat, trivia rounds, and game chat in one place.
          </p>
        </header>

        <section className="text-center sm:text-left">
          <p className="mb-3 inline-flex items-center justify-center rounded-full bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-800 border border-white/70 shadow-sm backdrop-blur-sm">
            Real-time · multiplayer
          </p>
          <p
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Fun games with your squad
          </p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-700">
            Create a room, share the code, and play trivia while you chat—right in the browser.
          </p>
        </section>

        <form
          className="flex flex-col gap-5 rounded-[1.75rem] border border-white/55 bg-white/50 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-xl"
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

          <div className="flex gap-1.5 p-1.5 bg-white/50 rounded-full border border-white/60 shadow-inner backdrop-blur-sm">
            {['create', 'join'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); clearErrors(); }}
                className={`
                  flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${focusRing}
                  ${mode === m
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              w-full py-3.5 rounded-full text-sm font-bold tracking-wide transition-all ${focusRing}
              ${loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white shadow-lg shadow-slate-900/20'
              }
            `}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? 'Connecting...' : mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>

        {mode === 'create' && (
          <p className="text-center text-sm leading-relaxed text-slate-600 sm:text-left">
            After creating, share your room code with friends so they can join.
          </p>
        )}

        {mode === 'join' && (
          <p className="text-center text-sm leading-relaxed text-slate-600 sm:text-left">
            Ask your host for the room code—it is shown in their SquadNod lobby.
          </p>
        )}

      </div>
    </main>
  );
}
