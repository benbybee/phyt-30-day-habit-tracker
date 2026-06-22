export const DEFAULT_PROMO_CODE = 'PHYT30';
// Legacy alias — fallback code when no referral source is recorded.
export const DISCOUNT_CODE = DEFAULT_PROMO_CODE;
export const DISCOUNT_URL = 'https://balanceofnature.com/shop';
export const TOTAL_DAYS = 30;

// "How did you connect with Balance of Nature?" — each signup channel maps to
// the promo code that user sees when they finish the challenge. Single source
// of truth: the dropdown, the stored value, and the reward code all derive from
// here. `key` is the stable value persisted on the contact (don't rename it);
// `label` is the human-facing option text.
export const REFERRAL_SOURCES = [
  { key: 'team_friends_family', label: 'Team Member Friends and Family', code: 'TEAM30' },
  { key: 'golf_tournament', label: 'Applied Underwriters Golf Tournament', code: 'GOLF30' },
  { key: 'red_cross_donation', label: 'American Red Cross Donation', code: 'DONATION30' },
] as const;

export type ReferralSourceKey = (typeof REFERRAL_SOURCES)[number]['key'];

export function isReferralSourceKey(value: unknown): value is ReferralSourceKey {
  return REFERRAL_SOURCES.some((s) => s.key === value);
}

export function promoCodeForSource(sourceKey?: string | null): string {
  return REFERRAL_SOURCES.find((s) => s.key === sourceKey)?.code ?? DEFAULT_PROMO_CODE;
}

export function labelForSource(sourceKey?: string | null): string {
  return REFERRAL_SOURCES.find((s) => s.key === sourceKey)?.label ?? '';
}

export const CATEGORY_COLORS = {
  fruits: '#c0392b',
  veggies: '#3aa856',
  fiberSpice: '#3B48AA',
  other: '#e67e22',
} as const;

export const STORAGE_KEY = 'phyt-tracker-v1';
