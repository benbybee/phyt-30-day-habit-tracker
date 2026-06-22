'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isReferralSourceKey } from '@/lib/config';

type ActionResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string };

function originFromHeaders(host: string | null, proto: string | null) {
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${proto ?? 'https'}://${host}`;
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email) return { ok: false, error: 'Email is required.' };
  if (!password) return { ok: false, error: 'Password is required.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const password = String(formData.get('password') ?? '');
  const rawSource = String(formData.get('referralSource') ?? '').trim();
  // Only persist a known channel key; anything else is dropped to null.
  const referralSource = isReferralSourceKey(rawSource) ? rawSource : null;

  if (!firstName) return { ok: false, error: 'First name is required.' };
  if (!lastName) return { ok: false, error: 'Last name is required.' };
  if (!email) return { ok: false, error: 'Email is required.' };
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        referral_source: referralSource,
      },
    },
  });

  if (error) return { ok: false, error: error.message };

  // We now have the user id immediately (unlike the old magic-link flow), so
  // persist the contact record straight away. Use the admin client so this also
  // works when email confirmation is enabled and no session exists yet.
  const userId = data.user?.id;
  if (userId) {
    try {
      const admin = createAdminClient();
      await admin
        .from('contacts')
        .upsert(
          {
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            referral_source: referralSource,
          },
          { onConflict: 'user_id' },
        );
    } catch (err) {
      console.error('[signup] contact upsert failed', err);
    }
  }

  // With email confirmation enabled, signUp returns no session until the user
  // confirms. With it disabled, the user is signed in immediately.
  if (!data.session) return { ok: true, needsConfirmation: true };
  return { ok: true };
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Email is required.' };

  const hdrs = await headers();
  const origin = originFromHeaders(hdrs.get('host'), hdrs.get('x-forwarded-proto'));

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Don't leak whether the address exists — report success regardless.
  if (error) console.error('[requestPasswordReset]', error.message);
  return { ok: true };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  // Requires the recovery session established by the email link callback.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Your reset link has expired. Please request a new one.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
