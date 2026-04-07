// app/auth/signin/SignInForm.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f4ff]';

export default function SignInForm() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const searchParams          = useSearchParams();
  const callbackUrl           = searchParams.get('callbackUrl') || '/groups';

  async function handleSubmit(e) {
    e.preventDefault();
  
    console.log("🚀 HANDLE SUBMIT FIRED");
  
    const trimmed = email.trim().toLowerCase();

    setLoading(true);
    setError('');

    await signIn('email', {
      email: trimmed,
      callbackUrl: '/auth/verify',
    });

    if (res?.error) {
      setLoading(false);
      setError('Something went wrong. Try again.');
      return;
    }
  }

  const registerHref =
    callbackUrl && callbackUrl !== '/groups'
      ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/auth/signin';

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 text-2xl shadow-md border border-white/60 backdrop-blur-md">
          🎮
        </div>
        <p
          className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Welcome back
        </p>
        <h1
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Sign in to Squad
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Enter the email you used when you signed up — we&apos;ll send you a magic link.
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
            Your email
          </label>
          <input
            type="email"
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
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoFocus
            autoComplete="email"
          />
          {error && (
            <p className="text-red-700 text-xs font-medium leading-snug">{error}</p>
          )}
        </div>

        <button
  type="button"
  onClick={() => {
    console.log("🔥 BUTTON CLICKED");

    signIn("resend", {
      email: "onodnarb@gmail.com",
      callbackUrl: "/auth/verify",
    });
  }}
>
  Test Sign In
</button>
      </form>

      <p className="text-center text-slate-600 text-xs leading-relaxed">
        We&apos;ll email you a magic link — no password needed.
      </p>

      <p className="text-center text-slate-600 text-sm">
        New to Squad?{' '}
        <Link
          href={registerHref}
          className="font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2 rounded-sm"
        >
          Create an account
        </Link>
      </p>

    </div>
  );
}
