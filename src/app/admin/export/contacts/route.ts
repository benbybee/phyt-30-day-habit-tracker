import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';
import { toCsv, csvFilename } from '@/lib/csv';

export const dynamic = 'force-dynamic';

type ContactRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

type TrackerDayRow = { user_id: string; completed: boolean };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const admin = createAdminClient();
  const [contactsRes, daysRes] = await Promise.all([
    admin
      .from('contacts')
      .select('user_id, first_name, last_name, email, phone, created_at')
      .order('created_at', { ascending: false })
      .returns<ContactRow[]>(),
    admin
      .from('tracker_days')
      .select('user_id, completed')
      .returns<TrackerDayRow[]>(),
  ]);

  const contacts = contactsRes.data ?? [];
  const completedByUser = new Map<string, number>();
  for (const d of daysRes.data ?? []) {
    if (d.completed) {
      completedByUser.set(d.user_id, (completedByUser.get(d.user_id) ?? 0) + 1);
    }
  }

  const headers = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'days_completed',
    'signed_up_at',
    'user_id',
  ];

  const rows = contacts.map((c) => [
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    completedByUser.get(c.user_id) ?? 0,
    c.created_at,
    c.user_id,
  ]);

  const csv = toCsv(headers, rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename('phyt-signups')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
