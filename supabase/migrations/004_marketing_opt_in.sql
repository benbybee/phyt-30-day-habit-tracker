-- =============================================================================
-- Add marketing opt-in to contacts.
-- Captures explicit consent from the signup checkbox ("I agree to receive
-- marketing, education and update emails from Balance of Nature"). This is the
-- durable, local source of truth for consent — the signup flow also mirrors it
-- to Klaviyo (upsert profile tagged with the "Habit Tracker Opt-In" property +
-- subscribe to the Master List), but a Klaviyo outage must never lose the record.
-- Additive and idempotent; safe to run against production.
-- =============================================================================
alter table public.contacts
  add column if not exists marketing_opt_in boolean not null default false;

alter table public.contacts
  add column if not exists marketing_opt_in_at timestamptz;
