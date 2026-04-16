import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HabitRing } from './HabitRing';
import { createInitialDays } from '@/lib/state';

describe('HabitRing', () => {
  it('renders 30 segments × 3 bands = 90 path elements', () => {
    const { container } = render(
      <HabitRing days={createInitialDays()} onSegmentClick={() => {}} />
    );
    const paths = container.querySelectorAll('path[data-band]');
    expect(paths.length).toBe(90);
  });

  it('renders day number labels 1..30', () => {
    const { container } = render(
      <HabitRing days={createInitialDays()} onSegmentClick={() => {}} />
    );
    const labels = container.querySelectorAll('text[data-label]');
    expect(labels.length).toBe(30);
  });
});
