import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';
import { toCsv, csvFilename } from '@/lib/csv';

export const dynamic = 'force-dynamic';

type FeedbackRow = {
  id: string;
  user_id: string;
  rating: number;
  comments: string | null;
  created_at: string;
};

type ContactRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const admin = createAdminClient();
  const [feedbackRes, contactsRes] = await Promise.all([
    admin
      .from('feedback_submissions')
      .select('id, user_id, rating, comments, created_at')
      .order('created_at', { ascending: false })
      .returns<FeedbackRow[]>(),
    admin
      .from('contacts')
      .select('user_id, first_name, last_name, email')
      .returns<ContactRow[]>(),
  ]);

  const feedback = feedbackRes.data ?? [];
  const contactById = new Map<string, ContactRow>();
  for (const c of contactsRes.data ?? []) contactById.set(c.user_id, c);

  const headers = [
    'rating',
    'comments',
    'first_name',
    'last_name',
    'email',
    'submitted_at',
    'feedback_id',
    'user_id',
  ];

  const rows = feedback.map((f) => {
    const c = contactById.get(f.user_id);
    return [
      f.rating,
      f.comments,
      c?.first_name ?? '',
      c?.last_name ?? '',
      c?.email ?? '',
      f.created_at,
      f.id,
      f.user_id,
    ];
  });

  const csv = toCsv(headers, rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename('phyt-feedback')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
