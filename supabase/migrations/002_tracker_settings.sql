-- =============================================================================
-- Tracker settings: allow users to disable the Fiber & Spice habit.
-- =============================================================================

alter table public.tracker_state
  add column if not exists fiber_spice_enabled boolean not null default true;
