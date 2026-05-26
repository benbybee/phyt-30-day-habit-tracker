/**
 * Admin authorization helpers.
 *
 * The set of admin users is configured via the ADMIN_EMAILS env var
 * (comma-separated, case-insensitive).
 */

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
