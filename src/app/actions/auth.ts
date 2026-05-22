'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSignupNotification } from '@/lib/email';

type ActionResult = { ok: true } | { ok: false; error: string };

function originFromHeaders(host: string | null, proto: string | null) {
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${proto ?? 'https'}://${host}`;
}

export async function sendMagicLink(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'Email is required.' };

  const hdrs = await headers();
  const origin = originFromHeaders(hdrs.get('host'), hdrs.get('x-forwarded-proto'));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: false, // login-only: do not create new accounts here
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim() || null;

  if (!firstName) return { ok: false, error: 'First name is required.' };
  if (!lastName) return { ok: false, error: 'Last name is required.' };
  if (!email) return { ok: false, error: 'Email is required.' };

  const hdrs = await headers();
  const origin = originFromHeaders(hdrs.get('host'), hdrs.get('x-forwarded-proto'));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?welcome=1`,
      shouldCreateUser: true,
      data: { first_name: firstName, last_name: lastName, phone },
    },
  });

  if (error) return { ok: false, error: error.message };

  // Upsert the contact record now (idempotent on user_id). We don't know the
  // user_id yet because they haven't clicked the magic link, but the auth.users
  // row was created by the OTP. We use the admin client to find/insert by email.
  try {
    const admin = createAdminClient();
    const { data: userList } = await admin.auth.admin.listUsers();
    const user = userList?.users.find((u) => u.email === email);

    if (user) {
      await admin
        .from('contacts')
        .upsert(
          {
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
          },
          { onConflict: 'user_id' },
        );

      // Fire-and-forget the BoN notification (don't block signup if it fails).
      sendSignupNotification({
        firstName,
        lastName,
        email,
        phone,
        userId: user.id,
      }).catch((err) => console.error('[signup] notification failed', err));
    }
  } catch (err) {
    console.error('[signup] contact upsert failed', err);
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
