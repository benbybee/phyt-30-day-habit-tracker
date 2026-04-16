import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEY, TOTAL_DAYS } from './config';

export type HabitItem = 'fruits' | 'veggies' | 'fiberSpice';

export type DayState = {
  dayNumber: number;
  fruits: boolean;
  veggies: boolean;
  fiberSpice: boolean;
  completed: boolean;
  completedAt: string | null;
};

export type TrackerState = {
  days: DayState[];
  rewardUnlocked: boolean;
  rewardClaimedAt: string | null;

  toggleItem: (day: number, item: HabitItem) => void;
  submitDay: (day: number) => void;
  reset: () => void;
};

export function createInitialDays(): DayState[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => ({
    dayNumber: i + 1,
    fruits: false,
    veggies: false,
    fiberSpice: false,
    completed: false,
    completedAt: null,
  }));
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set) => ({
      days: createInitialDays(),
      rewardUnlocked: false,
      rewardClaimedAt: null,

      toggleItem: (day, item) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === day && !d.completed ? { ...d, [item]: !d[item] } : d
          ),
        })),

      submitDay: (day) =>
        set((state) => {
          const target = state.days.find((d) => d.dayNumber === day);
          if (!target) return state;
          if (target.completed) return state;
          if (!(target.fruits && target.veggies && target.fiberSpice)) return state;

          const nowIso = new Date().toISOString();
          const nextDays = state.days.map((d) =>
            d.dayNumber === day ? { ...d, completed: true, completedAt: nowIso } : d
          );
          const completedCount = nextDays.filter((d) => d.completed).length;
          const nextRewardUnlocked = completedCount >= TOTAL_DAYS;

          return {
            days: nextDays,
            rewardUnlocked: nextRewardUnlocked,
            rewardClaimedAt:
              nextRewardUnlocked && !state.rewardClaimedAt ? nowIso : state.rewardClaimedAt,
          };
        }),

      reset: () =>
        set({
          days: createInitialDays(),
          rewardUnlocked: false,
          rewardClaimedAt: null,
        }),
    }),
    { name: STORAGE_KEY }
  )
);
