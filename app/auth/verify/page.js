// app/auth/verify/page.js
export default function Verify() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 pt-[max(2rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))] bg-transparent">
      <div className="w-full max-w-sm text-center flex flex-col gap-6 rounded-[1.75rem] border border-white/55 bg-white/50 px-6 py-10 shadow-xl shadow-slate-900/10 backdrop-blur-xl">

        <div>
          <div className="text-5xl mb-4" aria-hidden>📬</div>
          <h1
            className="text-2xl font-extrabold text-slate-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Check your email
          </h1>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            We sent a link to your email. Open it on this device to finish signing in.
            If you&apos;re new, you&apos;ll set your display name next. The link expires in 24 hours.
          </p>
        </div>

        <p className="text-slate-600 text-xs">
          Didn't get it? Check your spam folder, or{' '}
          <a
            href="/auth/signin"
            className="text-indigo-700 font-semibold hover:text-indigo-900 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-600 focus-visible:ring-offset-2 focus-visible:rounded-sm"
          >
            try again
          </a>
          .
        </p>

      </div>
    </main>
  );
}
