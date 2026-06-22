'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { signUp } from '@/app/actions/auth';

export default function SignupPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.needsConfirmation) {
        setSent(true);
      } else {
        router.replace('/tracker');
        router.refresh();
      }
    });
  };

  const inputCls =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-8 bg-white"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bon-logo.png"
            alt="Balance of Nature"
            className="mx-auto mb-5 h-auto w-44"
          />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            30-Day Whole Health System Supplement Journey Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-600">Create your tracker account</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-sm font-medium text-emerald-900">Check your email</p>
              <p className="mt-1 text-xs text-emerald-700">
                We sent you a link to confirm your account. Once confirmed, you can sign
                in.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  className={inputCls}
                />
              </div>
            </div>
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
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Phone <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 555 5555"
                className={inputCls}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
