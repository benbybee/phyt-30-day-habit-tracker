import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore, createInitialDays } from './state';

describe('tracker store', () => {
  beforeEach(() => {
    localStorage.clear();
    useTrackerStore.setState({
      days: createInitialDays(),
      rewardUnlocked: false,
      rewardClaimedAt: null,
    });
  });

  it('seeds 30 days, all incomplete', () => {
    const { days } = useTrackerStore.getState();
    expect(days).toHaveLength(30);
    expect(days.every((d) => !d.completed)).toBe(true);
    expect(days[0].dayNumber).toBe(1);
    expect(days[29].dayNumber).toBe(30);
  });

  it('toggleItem flips a single item on a single day', () => {
    useTrackerStore.getState().toggleItem(5, 'fruits');
    const day5 = useTrackerStore.getState().days[4];
    expect(day5.fruits).toBe(true);
    expect(day5.veggies).toBe(false);
  });

  it('toggleItem twice returns to original', () => {
    useTrackerStore.getState().toggleItem(5, 'fruits');
    useTrackerStore.getState().toggleItem(5, 'fruits');
    const day5 = useTrackerStore.getState().days[4];
    expect(day5.fruits).toBe(false);
  });

  it('toggleItem on a completed day is a no-op', () => {
    useTrackerStore.setState((state) => ({
      days: state.days.map((d) =>
        d.dayNumber === 3
          ? { ...d, fruits: true, veggies: true, fiberSpice: true, completed: true, completedAt: '2026-04-16' }
          : d
      ),
    }));
    useTrackerStore.getState().toggleItem(3, 'fruits');
    const day3 = useTrackerStore.getState().days[2];
    expect(day3.fruits).toBe(true);
  });
});

describe('submitDay', () => {
  beforeEach(() => {
    localStorage.clear();
    useTrackerStore.setState({
      days: createInitialDays(),
      rewardUnlocked: false,
      rewardClaimedAt: null,
    });
  });

  it('requires at least 1 item to be toggled on', () => {
    useTrackerStore.getState().submitDay(1);
    const day1 = useTrackerStore.getState().days[0];
    expect(day1.completed).toBe(false);
  });

  it('marks completed when any 1 item is toggled', () => {
    useTrackerStore.getState().toggleItem(1, 'fruits');
    useTrackerStore.getState().submitDay(1);
    const day1 = useTrackerStore.getState().days[0];
    expect(day1.completed).toBe(true);
    expect(day1.completedAt).not.toBeNull();
  });

  it('marks completed when all 3 are toggled', () => {
    useTrackerStore.getState().toggleItem(2, 'fruits');
    useTrackerStore.getState().toggleItem(2, 'veggies');
    useTrackerStore.getState().toggleItem(2, 'fiberSpice');
    useTrackerStore.getState().submitDay(2);
    const day2 = useTrackerStore.getState().days[1];
    expect(day2.completed).toBe(true);
  });

  it('unlocks reward when all 30 days complete', () => {
    for (let i = 1; i <= 30; i++) {
      useTrackerStore.getState().toggleItem(i, 'fruits');
      useTrackerStore.getState().toggleItem(i, 'veggies');
      useTrackerStore.getState().toggleItem(i, 'fiberSpice');
      useTrackerStore.getState().submitDay(i);
    }
    expect(useTrackerStore.getState().rewardUnlocked).toBe(true);
  });

  it('does not unlock reward below 30 completions', () => {
    for (let i = 1; i <= 29; i++) {
      useTrackerStore.getState().toggleItem(i, 'fruits');
      useTrackerStore.getState().toggleItem(i, 'veggies');
      useTrackerStore.getState().toggleItem(i, 'fiberSpice');
      useTrackerStore.getState().submitDay(i);
    }
    expect(useTrackerStore.getState().rewardUnlocked).toBe(false);
  });
});
