import { describe, it, expect } from 'vitest';
import { completedCount, currentDay, streakCopy } from './selectors';
import type { DayState } from './state';

function mkDays(completed: number[]): DayState[] {
  return Array.from({ length: 30 }, (_, i) => ({
    dayNumber: i + 1,
    fruits: completed.includes(i + 1),
    veggies: completed.includes(i + 1),
    fiberSpice: completed.includes(i + 1),
    completed: completed.includes(i + 1),
    completedAt: completed.includes(i + 1) ? '2026-04-16' : null,
  }));
}

describe('selectors', () => {
  it('completedCount counts completed days', () => {
    expect(completedCount(mkDays([1, 3, 5]))).toBe(3);
  });

  it('currentDay returns lowest incomplete dayNumber', () => {
    expect(currentDay(mkDays([1, 2, 3]))).toBe(4);
    expect(currentDay(mkDays([]))).toBe(1);
  });

  it('currentDay returns null when all complete', () => {
    const all = Array.from({ length: 30 }, (_, i) => i + 1);
    expect(currentDay(mkDays(all))).toBeNull();
  });

  describe('streakCopy', () => {
    it('returns starting-strong for 0–6', () => {
      expect(streakCopy(0)).toMatch(/starting strong/i);
      expect(streakCopy(5)).toMatch(/starting strong/i);
    });
    it('returns momentum for day 7', () => {
      expect(streakCopy(7)).toMatch(/momentum/i);
    });
    it('returns halfway for day 15', () => {
      expect(streakCopy(15)).toMatch(/halfway/i);
    });
    it('returns N days left near end', () => {
      expect(streakCopy(28)).toMatch(/2 days left/i);
    });
  });
});
