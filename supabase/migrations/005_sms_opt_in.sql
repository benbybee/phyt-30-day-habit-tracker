-- =============================================================================
-- Add SMS marketing opt-in to contacts.
-- Captures explicit SMS consent from the signup SMS section (opt-in checkbox +
-- mobile number + TCPA disclosure acknowledgement). Durable local record of SMS
-- consent; the signup flow also mirrors it to Klaviyo (phone on the same profile
-- as the email + SMS marketing consent). Additive and idempotent.
-- =============================================================================
alter table public.contacts
  add column if not exists sms_opt_in boolean not null default false;

alter table public.contacts
  add column if not exists sms_opt_in_at timestamptz;
