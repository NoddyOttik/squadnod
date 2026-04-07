// app/auth/signin/page.js
import { Suspense } from 'react';
import SignInForm from './SignInForm';

function SignInFallback() {
  return (
    <div className="w-full max-w-sm flex flex-col gap-8 items-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SignIn() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12 bg-zinc-950">
      <Suspense fallback={<SignInFallback />}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
