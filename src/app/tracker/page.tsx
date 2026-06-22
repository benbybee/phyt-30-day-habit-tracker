import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadSnapshot } from '@/lib/tracker-repo';
import { promoCodeForSource } from '@/lib/config';
import TrackerClient from './TrackerClient';

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Safety net: proxy.ts also enforces auth, but never trust a single layer.
  if (!user) redirect('/login');

  const [snapshot, contactRes] = await Promise.all([
    loadSnapshot(supabase, user.id),
    supabase
      .from('contacts')
      .select('first_name, referral_source')
      .eq('user_id', user.id)
      .maybeSingle<{ first_name: string; referral_source: string | null }>(),
  ]);

  return (
    <TrackerClient
      userId={user.id}
      userEmail={user.email ?? ''}
      firstName={contactRes.data?.first_name ?? undefined}
      promoCode={promoCodeForSource(contactRes.data?.referral_source)}
      initialSnapshot={snapshot}
    />
  );
}
