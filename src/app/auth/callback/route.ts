import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

  // First-time signup arriving via a different device than the one that
  // submitted the form. Ensure the contacts row exists.
  if (welcome) {
    try {
      const admin = createAdminClient();
      const meta = (data.user.user_metadata ?? {}) as {
        first_name?: string;
        last_name?: string;
        phone?: string | null;
      };

      const { data: existing } = await admin
        .from('contacts')
        .select('id')
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
    } catch (err) {
      console.error('[auth/callback] contact backfill failed', err);
    }
  }

  const safeNext = next.startsWith('/') ? next : '/tracker';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
