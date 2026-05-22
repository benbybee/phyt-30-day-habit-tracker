-- =============================================================================
-- Phyt Habit Tracker — initial schema
-- Run this in Supabase SQL Editor (or via `supabase db push` once linked).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- contacts
-- Lead-capture record created at signup. Pushed to BoN via notification email.
-- ---------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index contacts_email_idx on public.contacts (email);

alter table public.contacts enable row level security;

-- Users can read their own contact record.
create policy "Users can read own contact"
  on public.contacts for select
  using (auth.uid() = user_id);

-- Inserts are done server-side via the service role (signup API route),
-- so no public insert policy is needed. Users can update their own row if we
-- ever want to expose a profile page.
create policy "Users can update own contact"
  on public.contacts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tracker_state
-- Per-user tracker meta (other label, reward state).
-- One row per user.
-- ---------------------------------------------------------------------------
create table public.tracker_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  other_label text not null default 'Other',
  reward_unlocked boolean not null default false,
  reward_claimed_at timestamptz,
  reward_dismissed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.tracker_state enable row level security;

create policy "Users can read own tracker state"
  on public.tracker_state for select
  using (auth.uid() = user_id);

create policy "Users can insert own tracker state"
  on public.tracker_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tracker state"
  on public.tracker_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tracker_days
-- One row per (user, day_number). Stores habit toggles and completion.
-- ---------------------------------------------------------------------------
create table public.tracker_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number int not null check (day_number between 1 and 30),
  fruits boolean not null default false,
  veggies boolean not null default false,
  fiber_spice boolean not null default false,
  other boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, day_number)
);

create index tracker_days_user_idx on public.tracker_days (user_id);

alter table public.tracker_days enable row level security;

create policy "Users can read own tracker days"
  on public.tracker_days for select
  using (auth.uid() = user_id);

create policy "Users can insert own tracker days"
  on public.tracker_days for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tracker days"
  on public.tracker_days for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tracker days"
  on public.tracker_days for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- feedback_submissions
-- Captured from the post-30-day questionnaire in the reward modal.
-- ---------------------------------------------------------------------------
create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comments text,
  created_at timestamptz not null default now()
);

create index feedback_user_idx on public.feedback_submissions (user_id);
create index feedback_created_idx on public.feedback_submissions (created_at desc);

alter table public.feedback_submissions enable row level security;

create policy "Users can read own feedback"
  on public.feedback_submissions for select
  using (auth.uid() = user_id);

create policy "Users can insert own feedback"
  on public.feedback_submissions for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tracker_state_set_updated_at
  before update on public.tracker_state
  for each row
  execute function public.set_updated_at();

create trigger tracker_days_set_updated_at
  before update on public.tracker_days
  for each row
  execute function public.set_updated_at();
