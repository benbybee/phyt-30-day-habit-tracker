'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { requestPasswordReset } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  };

  const inputCls =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-white">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm font-medium text-emerald-900">Check your email</p>
              <p className="mt-1 text-xs text-emerald-700">
                If an account exists for that address, we sent a link to reset your
                password.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
