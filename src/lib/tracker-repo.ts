import type { SupabaseClient } from '@supabase/supabase-js';
import { createInitialDays, emptySnapshot, type DayState, type TrackerSnapshot } from './state';
import { TOTAL_DAYS } from './config';

type DbDay = {
  day_number: number;
  fruits: boolean;
  veggies: boolean;
  fiber_spice: boolean;
  other: boolean;
  completed: boolean;
  completed_at: string | null;
};

type DbState = {
  user_id: string;
  other_label: string;
  reward_unlocked: boolean;
  reward_claimed_at: string | null;
  reward_dismissed: boolean;
};

/** Load tracker_state + tracker_days for a user, with sane defaults. */
export async function loadSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<TrackerSnapshot> {
  const [stateRes, daysRes] = await Promise.all([
    supabase
      .from('tracker_state')
      .select('user_id, other_label, reward_unlocked, reward_claimed_at, reward_dismissed')
      .eq('user_id', userId)
      .maybeSingle<DbState>(),
    supabase
      .from('tracker_days')
      .select('day_number, fruits, veggies, fiber_spice, other, completed, completed_at')
      .eq('user_id', userId)
      .order('day_number'),
  ]);

  const empty = emptySnapshot();
  const baseDays = createInitialDays();

  if (daysRes.data && daysRes.data.length > 0) {
    const rowsByDay = new Map<number, DbDay>();
    for (const r of daysRes.data as DbDay[]) {
      rowsByDay.set(r.day_number, r);
    }
    for (let i = 0; i < baseDays.length; i++) {
      const r = rowsByDay.get(baseDays[i].dayNumber);
      if (r) baseDays[i] = dbRowToDay(r);
    }
  }

  const state = stateRes.data as DbState | null;

  return {
    days: baseDays,
    otherLabel: state?.other_label ?? empty.otherLabel,
    rewardUnlocked: state?.reward_unlocked ?? empty.rewardUnlocked,
    rewardClaimedAt: state?.reward_claimed_at ?? empty.rewardClaimedAt,
    rewardDismissed: state?.reward_dismissed ?? empty.rewardDismissed,
  };
}

function dbRowToDay(r: DbDay): DayState {
  return {
    dayNumber: r.day_number,
    fruits: r.fruits,
    veggies: r.veggies,
    fiberSpice: r.fiber_spice,
    other: r.other,
    completed: r.completed,
    completedAt: r.completed_at,
  };
}

function dayToDbRow(userId: string, d: DayState) {
  return {
    user_id: userId,
    day_number: d.dayNumber,
    fruits: d.fruits,
    veggies: d.veggies,
    fiber_spice: d.fiberSpice,
    other: d.other,
    completed: d.completed,
    completed_at: d.completedAt,
  };
}

/** Upsert a single day row. */
export async function saveDay(
  supabase: SupabaseClient,
  userId: string,
  day: DayState,
): Promise<void> {
  await supabase
    .from('tracker_days')
    .upsert(dayToDbRow(userId, day), { onConflict: 'user_id,day_number' });
}

/** Upsert tracker state row. */
export async function saveState(
  supabase: SupabaseClient,
  userId: string,
  snapshot: Pick<
    TrackerSnapshot,
    'otherLabel' | 'rewardUnlocked' | 'rewardClaimedAt' | 'rewardDismissed'
  >,
): Promise<void> {
  await supabase.from('tracker_state').upsert(
    {
      user_id: userId,
      other_label: snapshot.otherLabel,
      reward_unlocked: snapshot.rewardUnlocked,
      reward_claimed_at: snapshot.rewardClaimedAt,
      reward_dismissed: snapshot.rewardDismissed,
    },
    { onConflict: 'user_id' },
  );
}

/** Bulk upsert all 30 days — used by fillAll and the post-load sync. */
export async function saveAllDays(
  supabase: SupabaseClient,
  userId: string,
  days: DayState[],
): Promise<void> {
  if (days.length === 0) return;
  await supabase
    .from('tracker_days')
    .upsert(days.map((d) => dayToDbRow(userId, d)), { onConflict: 'user_id,day_number' });
}

/** Wipe all tracker data for the user (used by Reset demo). */
export async function clearTracker(supabase: SupabaseClient, userId: string): Promise<void> {
  await Promise.all([
    supabase.from('tracker_days').delete().eq('user_id', userId),
    supabase
      .from('tracker_state')
      .upsert(
        {
          user_id: userId,
          other_label: 'Other',
          reward_unlocked: false,
          reward_claimed_at: null,
          reward_dismissed: false,
        },
        { onConflict: 'user_id' },
      ),
  ]);
}

export { TOTAL_DAYS };
