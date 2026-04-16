'use client';

import { TOTAL_DAYS } from '@/lib/config';
import { streakCopy } from '@/lib/selectors';

type Props = { completedCount: number };

export function ProgressStats({ completedCount }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">
        Day {completedCount} of {TOTAL_DAYS} complete
      </p>
      <p className="text-lg font-medium">{streakCopy(completedCount)}</p>
    </div>
  );
}
