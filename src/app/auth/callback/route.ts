import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSignupNotification } from '@/lib/email';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/tracker';
  const welcome = searchParams.get('welcome') === '1';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`);
  }

  // First-time signup: ensure the contacts record exists and fire the
  // notification email. (The signup server action attempts this too, but the
  // user may have signed up from a different device than the one clicking the
  // link — this is the reliable place to handle it.)
  if (welcome) {
    try {
      const admin = createAdminClient();
      const meta = (data.user.user_metadata ?? {}) as {
        first_name?: string;
        last_name?: string;
        phone?: string | null;
      };

      // Check if we've already notified for this user.
      const { data: existing } = await admin
        .from('contacts')
        .select('id, notified_at, first_name, last_name, phone')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!existing) {
        await admin.from('contacts').insert({
          user_id: data.user.id,
          first_name: meta.first_name ?? '',
          last_name: meta.last_name ?? '',
          email: data.user.email!,
          phone: meta.phone ?? null,
        });
      }

      if (!existing?.notified_at) {
        await sendSignupNotification({
          firstName: meta.first_name ?? existing?.first_name ?? '',
          lastName: meta.last_name ?? existing?.last_name ?? '',
          email: data.user.email!,
          phone: meta.phone ?? existing?.phone ?? null,
          userId: data.user.id,
        });

        await admin
          .from('contacts')
          .update({ notified_at: new Date().toISOString() })
          .eq('user_id', data.user.id);
      }
    } catch (err) {
      // Don't block login if notification plumbing fails.
      console.error('[auth/callback] welcome notification failed', err);
    }
  }

  // Redirect to wherever the user was trying to go (or /tracker).
  const safeNext = next.startsWith('/') ? next : '/tracker';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
