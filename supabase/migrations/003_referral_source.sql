-- =============================================================================
-- Add referral source to contacts.
-- Captures "How did you connect with Balance of Nature?" from signup. Drives the
-- promo code shown when the user finishes the 30-day challenge. Stores the stable
-- key (e.g. 'golf_tournament'); code mapping lives in src/lib/config.ts.
-- =============================================================================
alter table public.contacts
  add column if not exists referral_source text;
