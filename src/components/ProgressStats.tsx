'use client';

import { TOTAL_DAYS } from '@/lib/config';

type Props = { completedCount: number };

export function ProgressStats({ completedCount }: Props) {
  const pct = Math.round((completedCount / TOTAL_DAYS) * 100);
  return (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-sm">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Day {completedCount} of {TOTAL_DAYS}
        <span className="text-slate-400">·</span>
        <span className="text-slate-500">{pct}%</span>
      </span>
    </div>
  );
}
