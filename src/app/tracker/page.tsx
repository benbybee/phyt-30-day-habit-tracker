import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadSnapshot } from '@/lib/tracker-repo';
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
      .select('first_name')
      .eq('user_id', user.id)
      .maybeSingle<{ first_name: string }>(),
  ]);

  return (
    <TrackerClient
      userId={user.id}
      userEmail={user.email ?? ''}
      firstName={contactRes.data?.first_name ?? undefined}
      initialSnapshot={snapshot}
    />
  );
}
