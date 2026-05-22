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

  const snapshot = await loadSnapshot(supabase, user.id);

  return (
    <TrackerClient
      userId={user.id}
      userEmail={user.email ?? ''}
      initialSnapshot={snapshot}
    />
  );
}
