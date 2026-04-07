// app/auth/setup/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f4ff]';

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

    await update({ name: trimmed });
    router.push('/groups');
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 pt-[max(2.5rem,var(--safe-top))] pb-[max(2.5rem,var(--safe-bottom))] bg-transparent">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-2xl shadow-md border border-white/60 backdrop-blur-md">
            ✨
          </div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Squad
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            One last thing — what should we call you?
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[1.75rem] border border-white/55 bg-white/50 p-6 sm:p-7 flex flex-col gap-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest text-slate-700"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Display name
            </label>
            <input
              className={`
                w-full rounded-full px-4 py-3.5 text-slate-900 transition-all
                placeholder:text-slate-500 bg-white/80 border border-white/70 shadow-inner
                ${focus}
                ${error
                  ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#f0f4ff]'
                  : ''
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
              <p className="text-red-700 text-xs font-medium leading-snug">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3.5 rounded-full text-sm font-bold tracking-wide transition-all shadow-lg shadow-slate-900/15 ${focus}
              ${loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white'
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
