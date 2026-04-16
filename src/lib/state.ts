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
  rewardDismissed: boolean;

  toggleItem: (day: number, item: HabitItem) => void;
  setDayItems: (day: number, values: { fruits: boolean; veggies: boolean; fiberSpice: boolean }) => void;
  submitDay: (day: number) => void;
  dismissReward: () => void;
  showReward: () => void;
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
      rewardDismissed: false,

      toggleItem: (day, item) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === day && !d.completed ? { ...d, [item]: !d[item] } : d
          ),
        })),

      setDayItems: (day, values) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === day && !d.completed ? { ...d, ...values } : d
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
          const justUnlocked = nextRewardUnlocked && !state.rewardUnlocked;

          return {
            days: nextDays,
            rewardUnlocked: nextRewardUnlocked,
            rewardClaimedAt:
              nextRewardUnlocked && !state.rewardClaimedAt ? nowIso : state.rewardClaimedAt,
            rewardDismissed: justUnlocked ? false : state.rewardDismissed,
          };
        }),

      dismissReward: () => set({ rewardDismissed: true }),
      showReward: () => set({ rewardDismissed: false }),

      reset: () =>
        set({
          days: createInitialDays(),
          rewardUnlocked: false,
          rewardClaimedAt: null,
          rewardDismissed: false,
        }),
    }),
    { name: STORAGE_KEY }
  )
);
