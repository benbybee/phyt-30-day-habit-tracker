'use client';

import { useEffect, useState } from 'react';
import { HabitRing } from '@/components/HabitRing';
import { CheckInDialog } from '@/components/CheckInDialog';
import { ProgressStats } from '@/components/ProgressStats';
import { RewardReveal } from '@/components/RewardReveal';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useTrackerStore } from '@/lib/state';
import { completedCount as countCompleted } from '@/lib/selectors';
import { CATEGORY_COLORS } from '@/lib/config';

export default function TrackerPage() {
  const days = useTrackerStore((s) => s.days);
  const otherLabel = useTrackerStore((s) => s.otherLabel);
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Mark hydrated once the client has mounted so we can safely read persisted state
    // without causing an SSR hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const rewardOpen = hydrated && rewardUnlocked && !rewardDismissed;
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
    <main
      className="max-w-6xl mx-auto my-8 p-8 rounded-2xl shadow-sm"
      style={{
        background: 'linear-gradient(180deg, #7a9bbd 0%, #ffffff 40%)',
      }}
    >
      <header className="relative mb-8">
        <div className="absolute right-0 top-0 flex items-center gap-3">
          {hydrated && rewardUnlocked && rewardDismissed && (
            <Button size="sm" onClick={showReward}>
              Your reward is ready →
            </Button>
          )}
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
        </div>
        <div className="text-center pt-1">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Join the Phyt</h1>
          <p className="mt-1 text-sm text-slate-600">30-day wellness habit tracker</p>
        </div>
      </header>

      <ProgressStats completedCount={hydrated ? completed : 0} />

      <div className="mt-4 mb-2 mx-auto" style={{ width: 900, maxWidth: '100%' }}>
        <HabitRing days={days} onSegmentClick={setOpenDay} />
      </div>

      <HabitProgressFooter
        hydrated={hydrated}
        rewardUnlocked={rewardUnlocked}
        otherLabel={otherLabel}
        setOtherLabel={setOtherLabel}
        days={days}
      />

      <CheckInDialog
        key={openDay ?? 'closed'}
        open={openDay !== null}
        dayNumber={openDay ?? 0}
        otherLabel={otherLabel}
        onSubmit={handleSubmit}
        onClose={() => setOpenDay(null)}
      />

      <RewardReveal open={rewardOpen} onClose={dismissReward} />
      <Toaster />
    </main>
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
  hydrated,
  rewardUnlocked,
  otherLabel,
  setOtherLabel,
  days,
}: {
  hydrated: boolean;
  rewardUnlocked: boolean;
  otherLabel: string;
  setOtherLabel: (v: string) => void;
  days: DayLike[];
}) {
  const value = hydrated ? otherLabel : 'Other';
  const showLock = hydrated && !rewardUnlocked;
  const counts = {
    fruits: days.filter((d) => d.fruits).length,
    veggies: days.filter((d) => d.veggies).length,
    fiberSpice: days.filter((d) => d.fiberSpice).length,
    other: days.filter((d) => d.other).length,
  };
  const c = CATEGORY_COLORS;

  return (
    <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-700">Your 4 daily habits</span>
        {showLock && <span className="text-[11px] text-slate-400">🔒 30 days to reward</span>}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <RingHabit image={FRUITS_IMG} label="Fruits" color={c.fruits} count={counts.fruits} />
        <RingHabit image={VEGGIES_IMG} label="Veggies" color={c.veggies} count={counts.veggies} />
        <RingHabit
          image={FIBER_IMG}
          label="Fiber & Spice"
          color={c.fiberSpice}
          count={counts.fiberSpice}
        />
        <div className="flex flex-col items-center gap-2">
          <ProgressRing color={c.other} pct={(counts.other / 30) * 100}>
            <span className="w-10 h-10 rounded-full" style={{ background: c.other }} />
          </ProgressRing>
          <input
            value={value}
            onChange={(e) => setOtherLabel(e.target.value)}
            placeholder="Other"
            maxLength={30}
            className="w-full text-center text-sm font-semibold bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-current"
            style={{ color: c.other }}
          />
          <span className="text-xs text-slate-500">{counts.other}/30</span>
        </div>
      </div>
    </div>
  );
}

function ProgressRing({
  color,
  pct,
  size = 72,
  stroke = 6,
  children,
}: {
  color: string;
  pct: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function RingHabit({
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
  const pct = (count / 30) * 100;
  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing color={color} pct={pct}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={label} width={36} height={36} className="h-9 w-9 object-contain" />
      </ProgressRing>
      <span className="text-sm font-semibold text-center" style={{ color }}>
        {label}
      </span>
      <span className="text-xs text-slate-500">{count}/30</span>
    </div>
  );
}
