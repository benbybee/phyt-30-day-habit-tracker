// Server-only Klaviyo client. Reads KLAVIYO_API_KEY from the environment and
// must never be imported into a client component.
//
// On marketing opt-in we do two things, each independently and resiliently:
//   1. Create-or-update the profile, stamping the "Habit Tracker Opt-In"
//      property so every opt-in — brand new or an existing contact — lands in
//      the Klaviyo segment built on that property.
//   2. Subscribe the profile to the Master List (single opt-in) with email
//      marketing consent.
// Failures are logged and swallowed: a Klaviyo outage must never block signup,
// and the durable consent record already lives in Supabase (contacts.marketing_opt_in).

const KLAVIYO_BASE = 'https://a.klaviyo.com';
// Klaviyo pins behavior to a dated revision; override via env if it ever needs bumping.
const KLAVIYO_REVISION = process.env.KLAVIYO_API_REVISION || '2026-04-15';
const MASTER_LIST_ID = process.env.KLAVIYO_MASTER_LIST_ID || 'WnZs4Z';
const CUSTOM_SOURCE = '30-Day Habit Tracker';
const OPT_IN_PROPERTY = 'Habit Tracker Opt-In';
const OPT_IN_DATE_PROPERTY = 'Habit Tracker Opt-In Date';
const REFERRAL_PROPERTY = 'Referral Source';

export type KlaviyoContact = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  /** Human-readable "How did you connect?" label, stored as a Klaviyo property. */
  referralSource?: string | null;
};

function klaviyoHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    revision: KLAVIYO_REVISION,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

/**
 * Normalize a free-text phone to E.164, or null if we can't be confident.
 * Signup phone is optional free text; omitting a doubtful number is safer than
 * sending one Klaviyo rejects (which would 400 the whole profile call).
 */
export function toE164(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) return cleaned;
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function profileAttributes(c: KlaviyoContact) {
  const phone = toE164(c.phone);
  const properties: Record<string, unknown> = {
    [OPT_IN_PROPERTY]: true,
    [OPT_IN_DATE_PROPERTY]: new Date().toISOString(),
  };
  if (c.referralSource) properties[REFERRAL_PROPERTY] = c.referralSource;
  return {
    email: c.email,
    ...(c.firstName ? { first_name: c.firstName } : {}),
    ...(c.lastName ? { last_name: c.lastName } : {}),
    ...(phone ? { phone_number: phone } : {}),
    properties,
  };
}

/** Create the profile, or patch it (merging the opt-in property) if it exists. */
async function upsertProfile(apiKey: string, c: KlaviyoContact): Promise<void> {
  const attributes = profileAttributes(c);
  const createRes = await fetch(`${KLAVIYO_BASE}/api/profiles`, {
    method: 'POST',
    headers: klaviyoHeaders(apiKey),
    body: JSON.stringify({ data: { type: 'profile', attributes } }),
  });
  if (createRes.status === 201) return;

  if (createRes.status === 409) {
    const body = await createRes.json().catch(() => null);
    const id = body?.errors?.[0]?.meta?.duplicate_profile_id;
    if (!id) throw new Error('Klaviyo 409 without duplicate_profile_id');
    const patchRes = await fetch(`${KLAVIYO_BASE}/api/profiles/${id}`, {
      method: 'PATCH',
      headers: klaviyoHeaders(apiKey),
      body: JSON.stringify({ data: { type: 'profile', id, attributes } }),
    });
    if (!patchRes.ok) throw new Error(`Klaviyo profile patch failed: ${patchRes.status}`);
    return;
  }

  const text = await createRes.text().catch(() => '');
  throw new Error(`Klaviyo profile create failed: ${createRes.status} ${text.slice(0, 300)}`);
}

/** Subscribe the profile to the Master List with email marketing consent. */
async function subscribeToMasterList(apiKey: string, email: string): Promise<void> {
  const res = await fetch(`${KLAVIYO_BASE}/api/profile-subscription-bulk-create-jobs`, {
    method: 'POST',
    headers: klaviyoHeaders(apiKey),
    body: JSON.stringify({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: CUSTOM_SOURCE,
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email,
                  subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
                },
              },
            ],
          },
        },
        relationships: { list: { data: { type: 'list', id: MASTER_LIST_ID } } },
      },
    }),
  });
  if (res.status !== 202) {
    const text = await res.text().catch(() => '');
    throw new Error(`Klaviyo subscribe failed: ${res.status} ${text.slice(0, 300)}`);
  }
}

async function runStep(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`[klaviyo] ${label} failed`, err);
  }
}

/**
 * Mirror a marketing opt-in to Klaviyo. Never throws — the caller (signup
 * action) awaits it so the calls finish before the serverless function returns,
 * but a failure only logs. The two steps run independently so one failing does
 * not prevent the other.
 */
export async function syncMarketingOptIn(contact: KlaviyoContact): Promise<void> {
  const apiKey = process.env.KLAVIYO_API_KEY;
  if (!apiKey) {
    console.error('[klaviyo] KLAVIYO_API_KEY is not set; skipping marketing sync');
    return;
  }
  if (!contact.email) {
    console.error('[klaviyo] missing email; skipping marketing sync');
    return;
  }
  await runStep('profile upsert', () => upsertProfile(apiKey, contact));
  await runStep('Master List subscribe', () => subscribeToMasterList(apiKey, contact.email));
}
