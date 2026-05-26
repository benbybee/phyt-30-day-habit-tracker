import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminEmail } from '@/lib/admin';
import { signOut } from '@/app/actions/auth';

type ContactRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
};

type FeedbackRow = {
  id: string;
  user_id: string;
  rating: number;
  comments: string | null;
  created_at: string;
};

type TrackerDayRow = {
  user_id: string;
  completed: boolean;
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) notFound();

  const admin = createAdminClient();
  const [contactsRes, feedbackRes, daysRes] = await Promise.all([
    admin
      .from('contacts')
      .select('user_id, first_name, last_name, email, phone, created_at')
      .order('created_at', { ascending: false })
      .returns<ContactRow[]>(),
    admin
      .from('feedback_submissions')
      .select('id, user_id, rating, comments, created_at')
      .order('created_at', { ascending: false })
      .returns<FeedbackRow[]>(),
    admin
      .from('tracker_days')
      .select('user_id, completed')
      .returns<TrackerDayRow[]>(),
  ]);

  const contacts = contactsRes.data ?? [];
  const feedback = feedbackRes.data ?? [];
  const days = daysRes.data ?? [];

  // Per-user completion counts.
  const completedByUser = new Map<string, number>();
  for (const d of days) {
    if (d.completed) {
      completedByUser.set(d.user_id, (completedByUser.get(d.user_id) ?? 0) + 1);
    }
  }

  // Build lookup so feedback rows can show the submitter name/email.
  const contactById = new Map<string, ContactRow>();
  for (const c of contacts) contactById.set(c.user_id, c);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Phyt admin</h1>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <Section
          title="Signups"
          count={contacts.length}
          exportHref="/admin/export/contacts"
        >
          {contacts.length === 0 ? (
            <EmptyState message="No signups yet." />
          ) : (
            <Table headers={['Name', 'Email', 'Phone', 'Days', 'Signed up']}>
              {contacts.map((c) => {
                const completed = completedByUser.get(c.user_id) ?? 0;
                return (
                  <tr key={c.user_id} className="border-t border-slate-100">
                    <Cell>{`${c.first_name} ${c.last_name}`.trim() || '—'}</Cell>
                    <Cell mono>{c.email}</Cell>
                    <Cell>{c.phone ?? '—'}</Cell>
                    <Cell>
                      <span className="tabular-nums">{completed}/30</span>
                    </Cell>
                    <Cell>{formatDate(c.created_at)}</Cell>
                  </tr>
                );
              })}
            </Table>
          )}
        </Section>

        <Section
          title="Feedback"
          count={feedback.length}
          exportHref="/admin/export/feedback"
        >
          {feedback.length === 0 ? (
            <EmptyState message="No feedback submitted yet." />
          ) : (
            <Table headers={['Rating', 'Comments', 'From', 'Submitted']}>
              {feedback.map((f) => {
                const c = contactById.get(f.user_id);
                return (
                  <tr key={f.id} className="border-t border-slate-100">
                    <Cell>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                        {f.rating}/5
                      </span>
                    </Cell>
                    <Cell wrap>{f.comments?.trim() || '—'}</Cell>
                    <Cell>
                      {c ? (
                        <div>
                          <div className="font-medium text-slate-900">
                            {`${c.first_name} ${c.last_name}`.trim() || '—'}
                          </div>
                          <div className="text-xs text-slate-500">{c.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">unknown</span>
                      )}
                    </Cell>
                    <Cell>{formatDate(f.created_at)}</Cell>
                  </tr>
                );
              })}
            </Table>
          )}
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  count,
  exportHref,
  children,
}: {
  title: string;
  count: number;
  exportHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {count.toLocaleString()}
          </span>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
        >
          Export CSV
          <span aria-hidden>↓</span>
        </a>
      </div>
      {children}
    </section>
  );
}

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  children,
  mono,
  wrap,
}: {
  children: React.ReactNode;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <td
      className={`px-5 py-3 align-top text-slate-700 ${mono ? 'font-mono text-xs' : ''} ${wrap ? 'max-w-md whitespace-pre-wrap' : 'whitespace-nowrap'}`}
    >
      {children}
    </td>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-5 py-8 text-center text-sm text-slate-500">{message}</div>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
