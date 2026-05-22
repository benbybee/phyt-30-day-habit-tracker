'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { useTrackerStore, type DayState } from '@/lib/state';
import {
  clearTracker,
  saveAllDays,
  saveDay,
  saveState,
} from '@/lib/tracker-repo';

type Props = { userId: string };

/**
 * Subscribes to Zustand store changes and persists them to Supabase.
 * Store initialization happens in the parent (TrackerClient) so selectors
 * are populated on first render — this only handles writes.
 */
export function TrackerSync({ userId }: Props) {
  useEffect(() => {
    const supabase = createClient();
    let labelTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useTrackerStore.subscribe((state, prev) => {
      // Day-level diffs.
      const dayChanges: DayState[] = [];
      for (let i = 0; i < state.days.length; i++) {
        const next = state.days[i];
        const before = prev.days[i];
        if (!dayEquals(next, before)) dayChanges.push(next);
      }

      // Heuristic: if more than 10 days changed at once, it's reset/fillAll → bulk.
      const fullReplace = dayChanges.length > 10;

      if (fullReplace) {
        const allEmpty = state.days.every(
          (d) => !d.completed && !d.fruits && !d.veggies && !d.fiberSpice && !d.other,
        );
        if (allEmpty) {
          void clearTracker(supabase, userId);
        } else {
          void saveAllDays(supabase, userId, state.days);
        }
      } else if (dayChanges.length > 0) {
        for (const d of dayChanges) {
          void saveDay(supabase, userId, d);
        }
      }

      // Reward state changes — write immediately.
      const rewardChanged =
        state.rewardUnlocked !== prev.rewardUnlocked ||
        state.rewardClaimedAt !== prev.rewardClaimedAt ||
        state.rewardDismissed !== prev.rewardDismissed;

      if (rewardChanged) {
        void saveState(supabase, userId, {
          otherLabel: state.otherLabel,
          rewardUnlocked: state.rewardUnlocked,
          rewardClaimedAt: state.rewardClaimedAt,
          rewardDismissed: state.rewardDismissed,
        });
      }

      // otherLabel changes — debounce so we don't write on every keystroke.
      if (state.otherLabel !== prev.otherLabel) {
        if (labelTimer) clearTimeout(labelTimer);
        labelTimer = setTimeout(() => {
          void saveState(supabase, userId, {
            otherLabel: state.otherLabel,
            rewardUnlocked: state.rewardUnlocked,
            rewardClaimedAt: state.rewardClaimedAt,
            rewardDismissed: state.rewardDismissed,
          });
        }, 600);
      }
    });

    return () => {
      unsubscribe();
      if (labelTimer) clearTimeout(labelTimer);
    };
  }, [userId]);

  return null;
}

function dayEquals(a: DayState, b: DayState) {
  return (
    a.dayNumber === b.dayNumber &&
    a.fruits === b.fruits &&
    a.veggies === b.veggies &&
    a.fiberSpice === b.fiberSpice &&
    a.other === b.other &&
    a.completed === b.completed &&
    a.completedAt === b.completedAt
  );
}
