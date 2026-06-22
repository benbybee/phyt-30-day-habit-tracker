'use client';

import { useState } from 'react';
import { HabitRing } from '@/components/HabitRing';
import { CheckInDialog } from '@/components/CheckInDialog';
import { ProgressStats } from '@/components/ProgressStats';
import { RewardReveal } from '@/components/RewardReveal';
import { TrackerSync } from '@/components/TrackerSync';
import { SettingsDialog } from '@/components/SettingsDialog';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useTrackerStore, type TrackerSnapshot } from '@/lib/state';
import { completedCount as countCompleted } from '@/lib/selectors';
import { CATEGORY_COLORS } from '@/lib/config';
import { signOut } from '@/app/actions/auth';

type Props = {
  userId: string;
  userEmail: string;
  firstName?: string;
  promoCode: string;
  initialSnapshot: TrackerSnapshot;
};

export default function TrackerClient({
  userId,
  userEmail,
  firstName,
  promoCode,
  initialSnapshot,
}: Props) {
  // Initialize the store synchronously on first render so all selectors below
  // return the server-loaded data on the first paint (no flash of empty state).
  useState(() => {
    useTrackerStore.getState().initialize(initialSnapshot);
  });

  const days = useTrackerStore((s) => s.days);
  const otherLabel = useTrackerStore((s) => s.otherLabel);
  const fiberSpiceEnabled = useTrackerStore((s) => s.fiberSpiceEnabled);
  const rewardUnlocked = useTrackerStore((s) => s.rewardUnlocked);
  const rewardDismissed = useTrackerStore((s) => s.rewardDismissed);
  const setDayItems = useTrackerStore((s) => s.setDayItems);
  const setOtherLabel = useTrackerStore((s) => s.setOtherLabel);
  const submitDay = useTrackerStore((s) => s.submitDay);
  const dismissReward = useTrackerStore((s) => s.dismissReward);
  const showReward = useTrackerStore((s) => s.showReward);
  const reset = useTrackerStore((s) => s.reset);
  const fillAll = useTrackerStore((s) => s.fillAll);

  const [openDay, setOpenDay] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // First-time users: prompt them to pick their custom "Other" habit.
  // Triggered when they have the default label and no logged days yet.
  const shouldShowOnboarding =
    initialSnapshot.otherLabel === 'Other' &&
    !initialSnapshot.days.some((d) => d.completed);
  const [onboardingOpen, setOnboardingOpen] = useState(shouldShowOnboarding);

  const rewardOpen = rewardUnlocked && !rewardDismissed;
  const completed = countCompleted(days);

  const handleSubmit = (toggles: {
    fruits: boolean;
    veggies: boolean;
    fiberSpice: boolean;
    other: boolean;
  }) => {
    if (openDay === null) return;
    setDayItems(openDay, toggles);
    submitDay(openDay);
    setOpenDay(null);
  };

  return (
    <>
      <TrackerSync userId={userId} />
      <main className="max-w-6xl mx-auto my-4 p-4 rounded-xl shadow-sm sm:my-8 sm:p-8 sm:rounded-2xl bg-white">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            {rewardUnlocked && rewardDismissed && (
              <Button size="sm" onClick={showReward}>
                Your reward is ready →
              </Button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs font-medium text-slate-600/80 hover:text-slate-900 transition-colors"
            >
              Settings
            </button>
            <button
              onClick={fillAll}
              className="text-xs font-medium text-slate-600/80 hover:text-slate-900 transition-colors"
            >
              Fill demo
            </button>
            <button
              onClick={reset}
              className="text-xs font-medium text-slate-600/80 hover:text-slate-900 transition-colors"
            >
              Reset demo
            </button>
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs font-medium text-slate-600/80 hover:text-slate-900 transition-colors"
                title={userEmail}
              >
                Sign out
              </button>
            </form>
          </div>
          <div className="mt-4 text-center sm:mt-5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 max-w-2xl mx-auto">
              Your 30-Day Whole Health System Supplement Journey
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Track your Fruits, Veggies, Fiber &amp; Spice, plus a custom health habit of
              your choice. Finish to get your reward.
            </p>
          </div>
        </header>

        <ProgressStats completedCount={completed} />

        <div
          className="mt-4 mb-2 mx-auto flex justify-center"
          style={{ width: 675, maxWidth: '100%' }}
        >
          <HabitRing
            days={days}
            fiberSpiceEnabled={fiberSpiceEnabled}
            onSegmentClick={setOpenDay}
          />
        </div>

        <HabitProgressFooter
          rewardUnlocked={rewardUnlocked}
          otherLabel={otherLabel}
          setOtherLabel={setOtherLabel}
          fiberSpiceEnabled={fiberSpiceEnabled}
          days={days}
        />

        <CheckInDialog
          key={openDay ?? 'closed'}
          open={openDay !== null}
          dayNumber={openDay ?? 0}
          otherLabel={otherLabel}
          fiberSpiceEnabled={fiberSpiceEnabled}
          onSubmit={handleSubmit}
          onClose={() => setOpenDay(null)}
        />

        <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <OnboardingDialog
          open={onboardingOpen}
          firstName={firstName}
          onClose={() => setOnboardingOpen(false)}
        />

        <RewardReveal
          open={rewardOpen}
          userId={userId}
          code={promoCode}
          onClose={dismissReward}
        />
        <Toaster />
      </main>
    </>
  );
}

type DayLike = {
  fruits: boolean;
  veggies: boolean;
  fiberSpice: boolean;
  other: boolean;
};

const FRUITS_IMG = '/1_Fruits.jpg';
const VEGGIES_IMG = '/1_Veggies.jpg';
const FIBER_IMG = '/New_Balance_of_Nature_Fiber_and_Spice.png';

function HabitProgressFooter({
  rewardUnlocked,
  otherLabel,
  setOtherLabel,
  fiberSpiceEnabled,
  days,
}: {
  rewardUnlocked: boolean;
  otherLabel: string;
  setOtherLabel: (v: string) => void;
  fiberSpiceEnabled: boolean;
  days: DayLike[];
}) {
  const showLock = !rewardUnlocked;
  const counts = {
    fruits: days.filter((d) => d.fruits).length,
    veggies: days.filter((d) => d.veggies).length,
    fiberSpice: days.filter((d) => d.fiberSpice).length,
    other: days.filter((d) => d.other).length,
  };
  const c = CATEGORY_COLORS;
  const habitCount = fiberSpiceEnabled ? 4 : 3;

  return (
    <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-sm font-semibold text-slate-700">
          Your {habitCount} daily habits
        </span>
        {showLock && (
          <span className="text-[11px] text-slate-400 whitespace-nowrap">
            🔒 30 days to reward
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-100">
        <HabitRow image={FRUITS_IMG} label="Fruits" color={c.fruits} count={counts.fruits} />
        <HabitRow image={VEGGIES_IMG} label="Veggies" color={c.veggies} count={counts.veggies} />
        {fiberSpiceEnabled && (
          <HabitRow
            image={FIBER_IMG}
            label="Fiber & Spice"
            color={c.fiberSpice}
            count={counts.fiberSpice}
          />
        )}
        <div className="flex items-center gap-4 py-3">
          <span className="h-12 w-12 rounded-full shrink-0" style={{ background: c.other }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <input
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                placeholder="Other"
                maxLength={30}
                className="font-semibold bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-current min-w-0 flex-1"
                style={{ color: c.other }}
              />
              <span className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">
                {Math.round((counts.other / 30) * 100)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(counts.other / 30) * 100}%`,
                  background: c.other,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitRow({
  image,
  label,
  color,
  count,
}: {
  image: string;
  label: string;
  color: string;
  count: number;
}) {
  const pct = Math.round((count / 30) * 100);
  return (
    <div className="flex items-center gap-4 py-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={label}
        width={48}
        height={48}
        className="h-12 w-12 object-contain shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold truncate" style={{ color }}>
            {label}
          </span>
          <span className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">
            {pct}%
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
