import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { toCsv, csvFilename } from '@/lib/csv';
import {
  DIGEST_FROM,
  DIGEST_RECIPIENT,
  labelForSource,
  promoCodeForSource,
} from '@/lib/config';

export const dynamic = 'force-dynamic';

type ContactRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  referral_source: string | null;
  created_at: string;
};

type TrackerDayRow = { user_id: string; completed: boolean };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  // Only Vercel Cron (which sends Authorization: Bearer <CRON_SECRET>) — or
  // someone holding the secret — may trigger this.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('[weekly-digest] RESEND_API_KEY is not set');
    return new NextResponse('Email not configured', { status: 500 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - WEEK_MS);

  const admin = createAdminClient();
  const [contactsRes, daysRes] = await Promise.all([
    admin
      .from('contacts')
      .select('user_id, first_name, last_name, email, phone, referral_source, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .returns<ContactRow[]>(),
    admin.from('tracker_days').select('user_id, completed').returns<TrackerDayRow[]>(),
  ]);

  if (contactsRes.error) {
    console.error('[weekly-digest] contacts query failed', contactsRes.error);
    return new NextResponse('Query failed', { status: 500 });
  }

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
    'connection_source',
    'promo_code',
    'days_completed',
    'signed_up_at',
    'user_id',
  ];
  const rows = contacts.map((c) => [
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    labelForSource(c.referral_source),
    promoCodeForSource(c.referral_source),
    completedByUser.get(c.user_id) ?? 0,
    c.created_at,
    c.user_id,
  ]);

  const csv = toCsv(headers, rows);
  const csvBase64 = Buffer.from(csv, 'utf-8').toString('base64');

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const count = contacts.length;
  const range = `${fmt(since)} – ${fmt(now)}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: DIGEST_FROM,
      to: [DIGEST_RECIPIENT],
      subject: `Phyt weekly signups — ${count} new (${range})`,
      html:
        `<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;">` +
        `<strong>${count}</strong> new signup${count === 1 ? '' : 's'} between ${range}.` +
        `<br />The full list is attached as a CSV.</p>`,
      attachments: [
        { filename: csvFilename('phyt-weekly-signups'), content: csvBase64 },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[weekly-digest] Resend send failed', res.status, detail);
    return new NextResponse('Send failed', { status: 502 });
  }

  return NextResponse.json({ ok: true, count });
}
