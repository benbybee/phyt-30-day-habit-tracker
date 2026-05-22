import { Resend } from 'resend';

type SignupNotification = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  userId: string;
};

export async function sendSignupNotification(payload: SignupNotification) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.BON_NOTIFICATION_EMAIL;

  if (!apiKey || !from || !to) {
    console.warn('[email] Resend not configured — skipping signup notification.');
    return;
  }

  const resend = new Resend(apiKey);
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #0f172a;">New Phyt Tracker signup</h2>
      <p style="margin: 0 0 24px; color: #475569;">A new user just registered for the 30-day habit tracker.</p>
      <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 14px; color: #0f172a;">
        <tr><td style="padding: 8px 0; color: #64748b; width: 120px;">Name</td><td style="padding: 8px 0;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;">${escapeHtml(payload.email)}</td></tr>
        ${payload.phone ? `<tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0;">${escapeHtml(payload.phone)}</td></tr>` : ''}
        <tr><td style="padding: 8px 0; color: #64748b;">User ID</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${escapeHtml(payload.userId)}</td></tr>
      </table>
    </div>
  `;

  const recipients = to.split(',').map((s) => s.trim()).filter(Boolean);

  await resend.emails.send({
    from,
    to: recipients,
    subject: `New Phyt Tracker signup — ${fullName}`,
    html,
    replyTo: payload.email,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
