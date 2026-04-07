// app/auth/setup/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Setup() {
  const router        = useRouter();
  const { update } = useSession();
  const [name, setName]           = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter a display name to continue'); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters'); return; }

    setLoading(true);

    const res = await fetch('/api/user/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!res.ok) {
      setLoading(false);
      setError('Something went wrong. Try again.');
      return;
    }

    // Refresh the session so the name is available immediately
    await update({ name: trimmed });
    router.push('/groups');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12 bg-zinc-950">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="text-center">
          <h1
            className="text-5xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Squad
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            One last thing — what should we call you?
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest text-zinc-500"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Display name
            </label>
            <input
              className={`
                w-full bg-zinc-900 rounded-xl px-4 py-3.5 text-white
                placeholder-zinc-600 focus:outline-none transition-all
                ${error
                  ? 'ring-2 ring-red-500 bg-red-950/20'
                  : 'ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500'
                }
              `}
              style={{ fontFamily: 'var(--font-body)' }}
              placeholder="What should people call you?"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              maxLength={20}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
            />
            {error && (
              <p className="text-red-400 text-xs leading-snug">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all
              ${loading
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white'
              }
            `}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {loading ? 'Saving...' : "Let's go"}
          </button>
        </form>

      </div>
    </main>
  );
}
