// app/auth/verify/page.js
export default function Verify() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 bg-zinc-950">
      <div className="w-full max-w-sm text-center flex flex-col gap-6">

        <div>
          <div className="text-5xl mb-4">📬</div>
          <h1
            className="text-2xl font-extrabold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Check your email
          </h1>
          <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
            We sent a sign-in link to your email address.
            Tap it to continue — it expires in 24 hours.
          </p>
        </div>

        <p className="text-zinc-600 text-xs">
          Didn't get it? Check your spam folder, or{' '}
          <a href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 underline">
            try again
          </a>
          .
        </p>

      </div>
    </main>
  );
}
