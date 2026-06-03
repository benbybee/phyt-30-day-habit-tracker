'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type ActionResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string };

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
    options: { data: { first_name: firstName, last_name: lastName, phone } },
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
          { user_id: userId, first_name: firstName, last_name: lastName, email, phone },
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
