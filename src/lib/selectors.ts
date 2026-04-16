import type { DayState } from './state';
import { TOTAL_DAYS } from './config';

export function completedCount(days: DayState[]): number {
  return days.filter((d) => d.completed).length;
}

export function currentDay(days: DayState[]): number | null {
  const next = days.find((d) => !d.completed);
  return next ? next.dayNumber : null;
}

export function streakCopy(count: number): string {
  if (count === 0) return 'Tap Day 1 to start — starting strong.';
  if (count < 7) return `Day ${count} — starting strong.`;
  if (count === 7) return `Day 7 — you're building momentum.`;
  if (count < 15) return `Day ${count} — keep going.`;
  if (count === 15) return `Halfway there.`;
  if (count < 27) return `Day ${count} — past the halfway mark.`;
  if (count < TOTAL_DAYS) return `Only ${TOTAL_DAYS - count} days left.`;
  return `You did it. 30 days.`;
}
