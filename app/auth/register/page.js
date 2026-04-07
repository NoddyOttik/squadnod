// app/auth/register/page.js
import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

function RegisterFallback() {
  return (
    <div className="w-full max-w-sm flex flex-col gap-8 items-center py-12">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 pt-[max(2.5rem,var(--safe-top))] pb-[max(2.5rem,var(--safe-bottom))] bg-transparent">
      <Suspense fallback={<RegisterFallback />}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
