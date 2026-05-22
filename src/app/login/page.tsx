'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { sendMagicLink } from '@/app/actions/auth';

export default function LoginPage() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await sendMagicLink(formData);
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(180deg, #7a9bbd 0%, #ffffff 60%)' }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to your tracker</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm font-medium text-emerald-900">Check your email</p>
              <p className="mt-1 text-xs text-emerald-700">
                We sent you a sign-in link. It expires in 1 hour.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Use a different email
            </button>
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
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Sending…' : 'Send sign-in link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-slate-900 underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
