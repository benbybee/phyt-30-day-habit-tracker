'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { updatePassword } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const password = String(formData.get('password') ?? '');
    const confirm = String(formData.get('confirm') ?? '');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result.ok) {
        router.replace('/tracker');
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const inputCls =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-white">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Choose a new password for your account.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              New password
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
            <label htmlFor="confirm" className="text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className={inputCls}
            />
          </div>
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Saving…' : 'Update password'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/login" className="font-medium text-slate-900 underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
