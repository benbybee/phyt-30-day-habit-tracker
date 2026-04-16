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
  const rewardUnlocked = useTrackerStore((s) => s.rewardUnlocked);
  const setDayItems = useTrackerStore((s) => s.setDayItems);
  const submitDay = useTrackerStore((s) => s.submitDay);
  const reset = useTrackerStore((s) => s.reset);

  const [openDay, setOpenDay] = useState<number | null>(null);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (rewardUnlocked) setRewardOpen(true);
  }, [rewardUnlocked]);

  const completed = countCompleted(days);

  const handleSubmit = (toggles: { fruits: boolean; veggies: boolean; fiberSpice: boolean }) => {
    if (openDay === null) return;
    setDayItems(openDay, toggles);
    submitDay(openDay);
    setOpenDay(null);
  };

  const handleReset = () => {
    reset();
    setRewardOpen(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-semibold">Join the Phyt</h1>
        <div className="flex gap-2">
          {hydrated && rewardUnlocked && !rewardOpen && (
            <Button onClick={() => setRewardOpen(true)}>Your reward is ready →</Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset demo
          </Button>
        </div>
      </div>

      <ProgressStats completedCount={hydrated ? completed : 0} />

      <div className="my-6 max-w-[520px] mx-auto">
        <HabitRing days={days} onSegmentClick={setOpenDay} />
      </div>

      {hydrated && !rewardUnlocked && (
        <p className="text-center text-sm text-muted-foreground my-4">
          🔒 Complete all 30 days to unlock your reward
        </p>
      )}

      <div className="flex gap-4 justify-center text-sm flex-wrap">
        <LegendSwatch color={CATEGORY_COLORS.fruits} label="Fruits" />
        <LegendSwatch color={CATEGORY_COLORS.veggies} label="Veggies" />
        <LegendSwatch color={CATEGORY_COLORS.fiberSpice} label="Fiber & Spice" />
      </div>

      <CheckInDialog
        open={openDay !== null}
        dayNumber={openDay ?? 0}
        onSubmit={handleSubmit}
        onClose={() => setOpenDay(null)}
      />

      <RewardReveal open={rewardOpen} onClose={() => setRewardOpen(false)} />
      <Toaster />
    </main>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
