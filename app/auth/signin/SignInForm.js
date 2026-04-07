// app/auth/signin/SignInForm.js
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignInForm() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const searchParams          = useSearchParams();
  const callbackUrl           = searchParams.get('callbackUrl') || '/groups';

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Enter your email to continue'); return; }

    setLoading(true);
    setError('');

    const res = await signIn('resend', {
      email: trimmed,
      callbackUrl,
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      setError('Something went wrong. Try again.');
      return;
    }

    window.location.href = '/auth/verify';
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">

      <div className="text-center">
        <h1
          className="text-5xl font-extrabold tracking-tight text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Squad
        </h1>
        <p className="text-zinc-500 text-sm mt-2">
          Chat and play games with friends
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
            Your email
          </label>
          <input
            type="email"
            className={`
              w-full bg-zinc-900 rounded-xl px-4 py-3.5 text-white
              placeholder-zinc-600 focus:outline-none transition-all
              ${error
                ? 'ring-2 ring-red-500 bg-red-950/20'
                : 'ring-1 ring-zinc-800 focus:ring-2 focus:ring-indigo-500'
              }
            `}
            style={{ fontFamily: 'var(--font-body)' }}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoFocus
            autoComplete="email"
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
          {loading ? 'Sending...' : 'Send me a link'}
        </button>
      </form>

      <p className="text-center text-zinc-600 text-xs leading-relaxed">
        We'll email you a magic link — no password needed.
      </p>

    </div>
  );
}
