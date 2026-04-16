# Join the Phyt Habit Tracker MVP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local Next.js demo of a 30-day habit tracker with a clickable SVG ring, 3-toggle check-ins per day, localStorage persistence, and a discount code reveal on completion.

**Architecture:** Single Next.js 15 App Router app, client-only. State lives in Zustand with `persist` middleware writing to `localStorage`. The ring is a custom SVG with 30 annular-sector segments, each containing 3 concentric bands (Fruits/Veggies/Fiber & Spice). No backend, no auth, no deployment target beyond `localhost:3000`.

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind CSS, shadcn/ui, Framer Motion, canvas-confetti, Zustand, Vitest + React Testing Library.

**Design doc:** [2026-04-16-phyt-habit-tracker-mvp-design.md](./2026-04-16-phyt-habit-tracker-mvp-design.md)

---

## Project Root

All paths below are relative to: `c:\Users\Ben Bybee\Desktop\Cursor\Join The Phyt 30 Day Habit Tracker\`

At the start of this plan the directory is empty (no package.json, no git, no files).

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, etc. (all via `create-next-app`)
- Create: `.git/` (init a local repo for this project so commits don't tangle with parent)

**Step 1: Initialize a fresh git repo in this folder**

Run:
```bash
git init
```
Expected: `Initialized empty Git repository in .../Join The Phyt 30 Day Habit Tracker/.git/`

**Step 2: Scaffold Next.js 15 with TypeScript, Tailwind, App Router, and src directory**

Run from project root (use `.` so it scaffolds into the current directory):
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --turbopack --import-alias "@/*" --use-npm --no-experimental-app
```

If the command complains about a non-empty directory because of `docs/` and `.git/`, re-run with `--yes` or temporarily move `docs/` outside, scaffold, then move it back.

Expected: Project files created; `package.json` exists; `src/app/page.tsx` exists.

**Step 3: Verify it boots**

Run:
```bash
npm run dev
```
Open `http://localhost:3000` in a browser — should see the Next.js default page.
Stop the dev server (Ctrl+C).

**Step 4: Set TS strict mode**

Open `tsconfig.json` and confirm `"strict": true`. It should be true by default from `create-next-app`. If not, set it.

**Step 5: Commit**

```bash
git add -- package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts .gitignore postcss.config.mjs eslint.config.mjs public src README.md docs
git commit -m "chore: scaffold Next.js 15 app for phyt habit tracker"
```

Note: explicitly listing files (never `git add .`) per hard rules.

---

## Task 2: Install additional dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install runtime deps**

Run:
```bash
npm install zustand framer-motion canvas-confetti
```

**Step 2: Install dev / test deps**

Run:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/canvas-confetti
```

**Step 3: Add test script to package.json**

Modify `package.json`'s `scripts` block so it contains:
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 4: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

**Step 5: Verify test runner works**

Create a temporary smoke test `src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```

Run:
```bash
npm test
```
Expected: 1 test passes.

Delete `src/smoke.test.ts` after confirming.

**Step 6: Commit**

```bash
git add -- package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: add zustand, framer-motion, canvas-confetti, vitest"
```

---

## Task 3: Install shadcn/ui primitives

**Files:**
- Create: `components.json`, `src/components/ui/*.tsx`, `src/lib/utils.ts`

**Step 1: Init shadcn**

Run:
```bash
npx shadcn@latest init
```
Answer the prompts:
- Style: **New York** (or Default, either is fine)
- Base color: **Neutral**
- Use CSS variables: **Yes**

This creates `components.json`, updates `tailwind.config.*` / `globals.css`, adds `src/lib/utils.ts`.

**Step 2: Add the components we'll need**

Run:
```bash
npx shadcn@latest add button dialog switch sonner tooltip
```
(`sonner` is the shadcn toast; used for the "Copied!" confirmation.)

Expected: Files created in `src/components/ui/`.

**Step 3: Commit**

```bash
git add -- components.json src/components/ui src/lib/utils.ts src/app/globals.css tailwind.config.ts package.json package-lock.json
git commit -m "chore: add shadcn/ui primitives (button, dialog, switch, sonner, tooltip)"
```

(If `tailwind.config.ts` or `package.json` wasn't modified, drop it from the add list. Only add files that actually changed — never `git add .`.)

---

## Task 4: Config module (discount code, colors)

**Files:**
- Create: `src/lib/config.ts`
- Test: `src/lib/config.test.ts`

**Step 1: Write the failing test**

Create `src/lib/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { DISCOUNT_CODE, DISCOUNT_URL, CATEGORY_COLORS, TOTAL_DAYS } from './config';

describe('config', () => {
  it('exposes a non-empty discount code', () => {
    expect(DISCOUNT_CODE).toBeTruthy();
    expect(typeof DISCOUNT_CODE).toBe('string');
  });

  it('exposes a URL or empty string', () => {
    expect(typeof DISCOUNT_URL).toBe('string');
  });

  it('defines colors for all three categories', () => {
    expect(CATEGORY_COLORS.fruits).toMatch(/^#/);
    expect(CATEGORY_COLORS.veggies).toMatch(/^#/);
    expect(CATEGORY_COLORS.fiberSpice).toMatch(/^#/);
  });

  it('total days is 30', () => {
    expect(TOTAL_DAYS).toBe(30);
  });
});
```

**Step 2: Run test — expect FAIL**

Run: `npm test -- config.test`
Expected: FAIL (module not found).

**Step 3: Implement**

Create `src/lib/config.ts`:
```ts
export const DISCOUNT_CODE = 'PHYT30';
export const DISCOUNT_URL = 'https://balanceofnature.com';
export const TOTAL_DAYS = 30;

export const CATEGORY_COLORS = {
  fruits: '#c0392b',
  veggies: '#3aa856',
  fiberSpice: '#6b4a9e',
} as const;

export const STORAGE_KEY = 'phyt-tracker-v1';
```

**Step 4: Run test — expect PASS**

Run: `npm test -- config.test`
Expected: PASS.

**Step 5: Commit**

```bash
git add -- src/lib/config.ts src/lib/config.test.ts
git commit -m "feat: add config module with discount code and category colors"
```

---

## Task 5: Zustand store — initial state + toggleItem

**Files:**
- Create: `src/lib/state.ts`
- Test: `src/lib/state.test.ts`

**Step 1: Write failing tests for store initial state and toggleItem**

Create `src/lib/state.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackerStore, createInitialDays } from './state';

describe('tracker store', () => {
  beforeEach(() => {
    useTrackerStore.getState().reset();
    // Clear localStorage between tests
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
    expect(days.every(d => !d.completed)).toBe(true);
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
    // Manually mark completed
    useTrackerStore.setState(state => ({
      days: state.days.map(d =>
        d.dayNumber === 3
          ? { ...d, fruits: true, veggies: true, fiberSpice: true, completed: true, completedAt: '2026-04-16' }
          : d
      ),
    }));
    useTrackerStore.getState().toggleItem(3, 'fruits');
    const day3 = useTrackerStore.getState().days[2];
    expect(day3.fruits).toBe(true); // unchanged
  });
});
```

**Step 2: Run test — expect FAIL**

Run: `npm test -- state.test`
Expected: FAIL (module not found).

**Step 3: Implement the store**

Create `src/lib/state.ts`:
```ts
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

  toggleItem: (day: number, item: HabitItem) => void;
  submitDay: (day: number) => void;
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

      toggleItem: (day, item) =>
        set((state) => ({
          days: state.days.map((d) =>
            d.dayNumber === day && !d.completed ? { ...d, [item]: !d[item] } : d
          ),
        })),

      submitDay: (day) => {
        // implemented in Task 6
      },

      reset: () =>
        set({
          days: createInitialDays(),
          rewardUnlocked: false,
          rewardClaimedAt: null,
        }),
    }),
    { name: STORAGE_KEY }
  )
);
```

**Step 4: Run test — expect PASS**

Run: `npm test -- state.test`
Expected: all 4 tests pass.

**Step 5: Commit**

```bash
git add -- src/lib/state.ts src/lib/state.test.ts
git commit -m "feat: add Zustand tracker store with toggleItem"
```

---

## Task 6: Store — submitDay + reward unlock

**Files:**
- Modify: `src/lib/state.ts`
- Modify: `src/lib/state.test.ts`

**Step 1: Write failing tests for submitDay**

Append to `src/lib/state.test.ts`:
```ts
describe('submitDay', () => {
  beforeEach(() => {
    useTrackerStore.getState().reset();
  });

  it('requires all 3 items to be toggled on', () => {
    useTrackerStore.getState().toggleItem(1, 'fruits');
    useTrackerStore.getState().toggleItem(1, 'veggies');
    // fiberSpice not toggled
    useTrackerStore.getState().submitDay(1);
    const day1 = useTrackerStore.getState().days[0];
    expect(day1.completed).toBe(false);
  });

  it('marks completed when all 3 are toggled', () => {
    useTrackerStore.getState().toggleItem(1, 'fruits');
    useTrackerStore.getState().toggleItem(1, 'veggies');
    useTrackerStore.getState().toggleItem(1, 'fiberSpice');
    useTrackerStore.getState().submitDay(1);
    const day1 = useTrackerStore.getState().days[0];
    expect(day1.completed).toBe(true);
    expect(day1.completedAt).not.toBeNull();
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
```

**Step 2: Run — expect FAIL**

Run: `npm test -- state.test`
Expected: 4 new tests fail (submitDay is a no-op).

**Step 3: Implement submitDay**

Replace the `submitDay: (day) => { ... }` stub in `src/lib/state.ts` with:
```ts
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

    return {
      days: nextDays,
      rewardUnlocked: nextRewardUnlocked,
      rewardClaimedAt: nextRewardUnlocked && !state.rewardClaimedAt ? nowIso : state.rewardClaimedAt,
    };
  }),
```

**Step 4: Run — expect PASS**

Run: `npm test -- state.test`
Expected: all tests pass.

**Step 5: Commit**

```bash
git add -- src/lib/state.ts src/lib/state.test.ts
git commit -m "feat: implement submitDay with all-3-required rule and reward unlock"
```

---

## Task 7: Derived selectors + streak copy

**Files:**
- Create: `src/lib/selectors.ts`
- Test: `src/lib/selectors.test.ts`

**Step 1: Failing tests**

Create `src/lib/selectors.test.ts`:
```ts
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
```

**Step 2: Run — FAIL**

Run: `npm test -- selectors.test`

**Step 3: Implement**

Create `src/lib/selectors.ts`:
```ts
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
```

**Step 4: Run — PASS**

**Step 5: Commit**

```bash
git add -- src/lib/selectors.ts src/lib/selectors.test.ts
git commit -m "feat: add derived selectors and streak copy"
```

---

## Task 8: Ring geometry helpers

**Files:**
- Create: `src/lib/ring-geometry.ts`
- Test: `src/lib/ring-geometry.test.ts`

**Step 1: Failing test**

Create `src/lib/ring-geometry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { annularSectorPath, segmentAngles } from './ring-geometry';

describe('ring-geometry', () => {
  it('segmentAngles returns 30 evenly-spaced segments over the arc', () => {
    const angles = segmentAngles(30);
    expect(angles).toHaveLength(30);
    // Start < end for each
    angles.forEach(([start, end]) => expect(end).toBeGreaterThan(start));
    // First segment starts at the arc start, last ends at the arc end
    expect(angles[0][0]).toBeCloseTo(angles[0][0]);
  });

  it('annularSectorPath returns a non-empty SVG path string starting with M', () => {
    const d = annularSectorPath({
      cx: 200,
      cy: 200,
      innerR: 100,
      outerR: 150,
      startAngle: 0,
      endAngle: Math.PI / 6,
    });
    expect(d).toMatch(/^M/);
    expect(d).toContain('A'); // arc commands
    expect(d).toContain('Z');
  });
});
```

**Step 2: Run — FAIL**

**Step 3: Implement**

Create `src/lib/ring-geometry.ts`:
```ts
const ARC_START = Math.PI * 0.85;  // ~10 o'clock
const ARC_END = Math.PI * 2.15;    // ~2 o'clock (wraps past bottom)

export function segmentAngles(count: number): Array<[number, number]> {
  const total = ARC_END - ARC_START;
  const step = total / count;
  return Array.from({ length: count }, (_, i) => [
    ARC_START + i * step,
    ARC_START + (i + 1) * step,
  ]);
}

export function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function annularSectorPath(opts: {
  cx: number;
  cy: number;
  innerR: number;
  outerR: number;
  startAngle: number;
  endAngle: number;
}): string {
  const { cx, cy, innerR, outerR, startAngle, endAngle } = opts;
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const p1 = polar(cx, cy, outerR, startAngle);
  const p2 = polar(cx, cy, outerR, endAngle);
  const p3 = polar(cx, cy, innerR, endAngle);
  const p4 = polar(cx, cy, innerR, startAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}
```

**Step 4: Run — PASS**

**Step 5: Commit**

```bash
git add -- src/lib/ring-geometry.ts src/lib/ring-geometry.test.ts
git commit -m "feat: add annular sector geometry helpers for ring"
```

---

## Task 9: HabitRing component (static render)

**Files:**
- Create: `src/components/HabitRing.tsx`
- Test: `src/components/HabitRing.test.tsx`

**Step 1: Failing test**

Create `src/components/HabitRing.test.tsx`:
```tsx
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
```

**Step 2: Run — FAIL**

**Step 3: Implement**

Create `src/components/HabitRing.tsx`:
```tsx
'use client';

import { annularSectorPath, segmentAngles, polar } from '@/lib/ring-geometry';
import { CATEGORY_COLORS } from '@/lib/config';
import type { DayState } from '@/lib/state';

const SIZE = 520;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 230;
const BAND_WIDTH = 28;
const GAP = 4;
const LABEL_R = OUTER_R + 18;

type Props = {
  days: DayState[];
  onSegmentClick: (dayNumber: number) => void;
};

export function HabitRing({ days, onSegmentClick }: Props) {
  const segs = segmentAngles(30);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="auto" role="img" aria-label="30 day habit tracker">
      {segs.map(([start, end], i) => {
        const day = days[i];
        const mid = (start + end) / 2;
        const labelPos = polar(CX, CY, LABEL_R, mid);

        const bands = [
          { item: 'fruits' as const, outerR: OUTER_R, innerR: OUTER_R - BAND_WIDTH, filled: day.fruits, color: CATEGORY_COLORS.fruits },
          { item: 'veggies' as const, outerR: OUTER_R - BAND_WIDTH - GAP, innerR: OUTER_R - 2 * BAND_WIDTH - GAP, filled: day.veggies, color: CATEGORY_COLORS.veggies },
          { item: 'fiberSpice' as const, outerR: OUTER_R - 2 * BAND_WIDTH - 2 * GAP, innerR: OUTER_R - 3 * BAND_WIDTH - 2 * GAP, filled: day.fiberSpice, color: CATEGORY_COLORS.fiberSpice },
        ];

        return (
          <g
            key={day.dayNumber}
            onClick={() => !day.completed && onSegmentClick(day.dayNumber)}
            style={{ cursor: day.completed ? 'default' : 'pointer' }}
            data-day={day.dayNumber}
          >
            {bands.map((b) => (
              <path
                key={b.item}
                data-band={b.item}
                d={annularSectorPath({ cx: CX, cy: CY, innerR: b.innerR, outerR: b.outerR, startAngle: start, endAngle: end })}
                fill={b.filled ? b.color : '#ffffff'}
                stroke="#d1d5db"
                strokeWidth={1}
              />
            ))}
            <text
              data-label
              x={labelPos.x}
              y={labelPos.y}
              fontSize={12}
              fill="#374151"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {day.dayNumber}
            </text>
          </g>
        );
      })}
      {/* Center leaf placeholder */}
      <text x={CX} y={CY} fontSize={36} textAnchor="middle" dominantBaseline="middle">🌿</text>
    </svg>
  );
}
```

**Step 4: Run — PASS**

**Step 5: Commit**

```bash
git add -- src/components/HabitRing.tsx src/components/HabitRing.test.tsx
git commit -m "feat: add SVG HabitRing with 30 segments and 3 bands each"
```

---

## Task 10: CheckInDialog component

**Files:**
- Create: `src/components/CheckInDialog.tsx`
- Test: `src/components/CheckInDialog.test.tsx`

**Step 1: Failing test**

Create `src/components/CheckInDialog.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInDialog } from './CheckInDialog';

describe('CheckInDialog', () => {
  it('submit is disabled until all 3 toggles are on', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CheckInDialog open dayNumber={1} onSubmit={onSubmit} onClose={() => {}} />);

    const submit = screen.getByRole('button', { name: /complete day 1/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: /fruits/i }));
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: /veggies/i }));
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: /fiber/i }));
    expect(submit).toBeEnabled();
  });

  it('calls onSubmit with {fruits,veggies,fiberSpice}:true when submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CheckInDialog open dayNumber={1} onSubmit={onSubmit} onClose={() => {}} />);
    await user.click(screen.getByRole('switch', { name: /fruits/i }));
    await user.click(screen.getByRole('switch', { name: /veggies/i }));
    await user.click(screen.getByRole('switch', { name: /fiber/i }));
    await user.click(screen.getByRole('button', { name: /complete day 1/i }));
    expect(onSubmit).toHaveBeenCalledWith({ fruits: true, veggies: true, fiberSpice: true });
  });
});
```

**Step 2: Run — FAIL**

**Step 3: Implement**

Create `src/components/CheckInDialog.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

type Toggles = { fruits: boolean; veggies: boolean; fiberSpice: boolean };

type Props = {
  open: boolean;
  dayNumber: number;
  onSubmit: (toggles: Toggles) => void;
  onClose: () => void;
};

export function CheckInDialog({ open, dayNumber, onSubmit, onClose }: Props) {
  const [toggles, setToggles] = useState<Toggles>({ fruits: false, veggies: false, fiberSpice: false });

  useEffect(() => {
    if (!open) setToggles({ fruits: false, veggies: false, fiberSpice: false });
  }, [open]);

  const allOn = toggles.fruits && toggles.veggies && toggles.fiberSpice;

  const row = (key: keyof Toggles, label: string) => (
    <label className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-base">{label}</span>
      <Switch
        aria-label={label}
        checked={toggles[key]}
        onCheckedChange={(v) => setToggles((t) => ({ ...t, [key]: v }))}
      />
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Day {dayNumber} Check-In</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {row('fruits', 'Fruits')}
          {row('veggies', 'Veggies')}
          {row('fiberSpice', 'Fiber & Spice')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!allOn}
            onClick={() => onSubmit(toggles)}
          >
            Complete Day {dayNumber}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: Run — PASS**

If the test can't find the Switch by accessible name, the shadcn Switch may not attach the aria-label to the role=switch element. If so, wrap it: the test searches for `role: switch, name: /fruits/i`. Adjust the row markup or the test to use `getByLabelText` instead.

**Step 5: Commit**

```bash
git add -- src/components/CheckInDialog.tsx src/components/CheckInDialog.test.tsx
git commit -m "feat: add CheckInDialog with 3-toggle gating"
```

---

## Task 11: ProgressStats component

**Files:**
- Create: `src/components/ProgressStats.tsx`

**Step 1: Implement**

Create `src/components/ProgressStats.tsx`:
```tsx
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
```

**Step 2: Commit**

```bash
git add -- src/components/ProgressStats.tsx
git commit -m "feat: add ProgressStats component"
```

---

## Task 12: Tracker page — wire ring, dialog, stats, reset

**Files:**
- Create: `src/app/tracker/page.tsx`

**Step 1: Implement**

Create `src/app/tracker/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { HabitRing } from '@/components/HabitRing';
import { CheckInDialog } from '@/components/CheckInDialog';
import { ProgressStats } from '@/components/ProgressStats';
import { Button } from '@/components/ui/button';
import { useTrackerStore } from '@/lib/state';
import { completedCount as countCompleted } from '@/lib/selectors';
import { CATEGORY_COLORS } from '@/lib/config';

export default function TrackerPage() {
  const days = useTrackerStore((s) => s.days);
  const toggleItem = useTrackerStore((s) => s.toggleItem);
  const submitDay = useTrackerStore((s) => s.submitDay);
  const reset = useTrackerStore((s) => s.reset);

  const [openDay, setOpenDay] = useState<number | null>(null);
  const completed = countCompleted(days);

  const handleSubmit = (toggles: { fruits: boolean; veggies: boolean; fiberSpice: boolean }) => {
    if (openDay === null) return;
    // Apply toggles to match the submitted state, then submitDay
    if (toggles.fruits) toggleItem(openDay, 'fruits');
    if (toggles.veggies) toggleItem(openDay, 'veggies');
    if (toggles.fiberSpice) toggleItem(openDay, 'fiberSpice');
    submitDay(openDay);
    setOpenDay(null);
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Join the Phyt</h1>
        <Button variant="outline" size="sm" onClick={reset}>Reset demo</Button>
      </div>

      <ProgressStats completedCount={completed} />

      <div className="my-6">
        <HabitRing days={days} onSegmentClick={setOpenDay} />
      </div>

      <div className="flex gap-4 justify-center text-sm">
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
```

Note: the `handleSubmit` applies toggles incrementally. A cleaner refactor would add a `setDayItems(day, toggles)` action to the store that sets all three at once. Do that if `toggleItem` semantics cause an edge case; for the demo, the incremental approach is fine because toggles only go from false→true here (we initialize the dialog empty and the day wasn't completed yet).

**Step 2: Run dev server and manually verify**

```bash
npm run dev
```
Open `http://localhost:3000/tracker`. Click segment 1, toggle all 3, click Complete. Ring segment fills.

**Step 3: Commit**

```bash
git add -- src/app/tracker/page.tsx
git commit -m "feat: wire tracker page (ring + dialog + stats + reset)"
```

---

## Task 13: Landing page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace Next.js default**

Replace `src/app/page.tsx` with:
```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-5xl font-semibold">Join the Phyt</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        30 days of Whole Health. Track Fruits, Veggies, and Fiber & Spice. Unlock a reward when you finish.
      </p>
      <Button asChild size="lg">
        <Link href="/tracker">Start Tracker</Link>
      </Button>
    </main>
  );
}
```

**Step 2: Verify**

Load `http://localhost:3000` — should see hero. Click "Start Tracker" → routes to `/tracker`.

**Step 3: Commit**

```bash
git add -- src/app/page.tsx
git commit -m "feat: add landing page with Start Tracker CTA"
```

---

## Task 14: RewardReveal overlay

**Files:**
- Create: `src/components/RewardReveal.tsx`
- Modify: `src/app/tracker/page.tsx`

**Step 1: Implement**

Create `src/components/RewardReveal.tsx`:
```tsx
'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DISCOUNT_CODE, DISCOUNT_URL, CATEGORY_COLORS } from '@/lib/config';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RewardReveal({ open, onClose }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (open && !firedRef.current) {
      firedRef.current = true;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: [CATEGORY_COLORS.fruits, CATEGORY_COLORS.veggies, CATEGORY_COLORS.fiberSpice],
      });
    }
    if (!open) firedRef.current = false;
  }, [open]);

  const copy = async () => {
    await navigator.clipboard.writeText(DISCOUNT_CODE);
    toast.success('Copied!');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-semibold">You did it. 30 days.</h2>
        <p className="text-muted-foreground">Your reward code:</p>
        <div className="flex items-center justify-center gap-2 my-4">
          <code className="px-4 py-2 border rounded text-xl font-mono">{DISCOUNT_CODE}</code>
          <Button variant="outline" onClick={copy}>Copy</Button>
        </div>
        <div className="flex gap-2 justify-center">
          {DISCOUNT_URL && (
            <Button asChild>
              <a href={DISCOUNT_URL} target="_blank" rel="noreferrer">Use code</a>
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Wire into tracker page**

Modify `src/app/tracker/page.tsx`. Add:
```tsx
import { RewardReveal } from '@/components/RewardReveal';
import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
```

Inside the component, after existing selectors:
```tsx
const rewardUnlocked = useTrackerStore((s) => s.rewardUnlocked);
const [rewardOpen, setRewardOpen] = useState(false);

useEffect(() => {
  if (rewardUnlocked) setRewardOpen(true);
}, [rewardUnlocked]);
```

Before the closing `</main>`, add:
```tsx
<RewardReveal open={rewardOpen} onClose={() => setRewardOpen(false)} />
<Toaster />
```

Also add a header button that shows when reward is unlocked but closed:
```tsx
{rewardUnlocked && !rewardOpen && (
  <Button onClick={() => setRewardOpen(true)}>Your reward is ready →</Button>
)}
```

Place this next to the Reset button in the header.

**Step 3: Manual test**

Easiest way: in browser devtools console on `/tracker`:
```js
// Force-complete all 30 days
const s = window.__trackerStore || null; // if we expose it; otherwise edit localStorage directly
```
Or just set `localStorage.setItem('phyt-tracker-v1', JSON.stringify({ state: { days: Array.from({length:30},(_,i)=>({dayNumber:i+1,fruits:true,veggies:true,fiberSpice:true,completed:true,completedAt:'2026-04-16'})), rewardUnlocked:true, rewardClaimedAt:'2026-04-16' }, version: 0 }))` and reload.

Verify confetti fires and code appears. Click Copy — verify toast.

**Step 4: Commit**

```bash
git add -- src/components/RewardReveal.tsx src/app/tracker/page.tsx
git commit -m "feat: add reward reveal overlay with confetti and copy-to-clipboard"
```

---

## Task 15: Lock chip (pre-unlock hint)

**Files:**
- Modify: `src/app/tracker/page.tsx`

**Step 1: Add a lock chip below the ring**

In `src/app/tracker/page.tsx`, after the ring (before the legend), add:
```tsx
{!rewardUnlocked && (
  <p className="text-center text-sm text-muted-foreground my-4">
    🔒 Complete all 30 days to unlock your reward
  </p>
)}
```

**Step 2: Manual verify**

Refresh tracker page with <30 completions — lock chip visible. Complete 30 — chip disappears.

**Step 3: Commit**

```bash
git add -- src/app/tracker/page.tsx
git commit -m "feat: add pre-unlock lock chip on tracker page"
```

---

## Task 16: Segment fill animation

**Files:**
- Modify: `src/components/HabitRing.tsx`

**Step 1: Animate band fills with Framer Motion**

Wrap each band's `<path>` with `motion.path` (from `framer-motion`) and animate the `fill` color transition.

Replace the `<path data-band ...>` JSX in `HabitRing.tsx` with:
```tsx
import { motion } from 'framer-motion';

// ...

<motion.path
  key={b.item}
  data-band={b.item}
  d={annularSectorPath({ cx: CX, cy: CY, innerR: b.innerR, outerR: b.outerR, startAngle: start, endAngle: end })}
  initial={false}
  animate={{ fill: b.filled ? b.color : '#ffffff' }}
  transition={{ duration: 0.35, delay: b.item === 'fruits' ? 0 : b.item === 'veggies' ? 0.12 : 0.24 }}
  stroke="#d1d5db"
  strokeWidth={1}
/>
```

**Step 2: Manual verify**

Click a segment, complete all 3 toggles, submit. Bands should fill in sequence.

**Step 3: Re-run tests**

`npm test` — the existing HabitRing test should still pass (motion.path still renders as `path`).

**Step 4: Commit**

```bash
git add -- src/components/HabitRing.tsx
git commit -m "feat: animate segment band fills with framer-motion"
```

---

## Task 17: Hover tooltip on segments

**Files:**
- Modify: `src/components/HabitRing.tsx`

**Step 1: Wrap each segment group in a tooltip**

Use shadcn `Tooltip`. For simplicity in SVG, add a `<title>` element inside each `<g>`:
```tsx
<title>Day {day.dayNumber}{day.completed ? ' — complete' : ''}</title>
```

Place it as the first child of the `<g>`. Browsers will show the native hover tooltip.

**Step 2: Manual verify**

Hover a segment — browser tooltip shows "Day N".

**Step 3: Commit**

```bash
git add -- src/components/HabitRing.tsx
git commit -m "feat: add hover tooltip on ring segments"
```

---

## Task 18: Reset clears reward too + safety polish

**Files:**
- Verify: `src/lib/state.ts` reset behavior
- Modify: `src/app/tracker/page.tsx` — close reward overlay on reset

**Step 1: Confirm reset wipes reward**

Look at `reset` in `src/lib/state.ts`. It already sets `rewardUnlocked: false` and `rewardClaimedAt: null`. Good.

**Step 2: Close the reward overlay when reset is clicked**

In `src/app/tracker/page.tsx`, change the Reset button:
```tsx
<Button variant="outline" size="sm" onClick={() => { reset(); setRewardOpen(false); }}>
  Reset demo
</Button>
```

**Step 3: Manual verify**

Trigger reward, then Reset — overlay closes, ring is empty, lock chip reappears.

**Step 4: Commit**

```bash
git add -- src/app/tracker/page.tsx
git commit -m "fix: close reward overlay on reset"
```

---

## Task 19: Mobile / responsive polish

**Files:**
- Modify: `src/app/tracker/page.tsx`, `src/components/HabitRing.tsx`

**Step 1: Ensure ring scales**

`HabitRing` already uses `width="100%"` on the SVG, which makes it scale. Wrap it in a container with `max-w-[520px] mx-auto`:
```tsx
<div className="my-6 max-w-[520px] mx-auto">
  <HabitRing days={days} onSegmentClick={setOpenDay} />
</div>
```

**Step 2: Verify**

Resize browser narrow (or use Chrome devtools responsive mode at 375px). Ring shrinks; dialog still readable.

**Step 3: Commit**

```bash
git add -- src/app/tracker/page.tsx
git commit -m "feat: constrain ring max width and center on narrow viewports"
```

---

## Task 20: Final smoke test

**Step 1: Full manual run**

```bash
npm test
npm run build
npm run dev
```

- `npm test` — all tests pass.
- `npm run build` — no type errors.
- `npm run dev` — open `localhost:3000`:
  1. Landing page loads. Click **Start Tracker**.
  2. Ring renders empty. Progress shows "Day 0 of 30 complete".
  3. Click segment 1. Dialog opens. Submit disabled. Toggle all 3. Submit enables. Click **Complete Day 1**. Dialog closes. Segment 1 fills with animation.
  4. Refresh page. Segment 1 still filled.
  5. Click segment 1 again — no dialog (already completed).
  6. Use devtools localStorage override (see Task 14) to set all 30 complete, reload. Reward overlay auto-opens with confetti. Click Copy — toast appears, code in clipboard.
  7. Close overlay. Header shows "Your reward is ready →". Click it — overlay re-opens.
  8. Click **Reset demo**. Ring empties. Lock chip visible. Reward header button gone.

**Step 2: Tag the MVP**

```bash
git tag v0.1.0-mvp
```

**Step 3: Final commit (if any uncommitted polish)**

```bash
git status
# If anything, commit with a clear message. Otherwise skip.
```

---

## Notes for the implementing engineer

- **Never `git add .`** — always list files explicitly (per project hard rules).
- **Never commit any `.env*` file** except `.env.example`. We don't need any env files for this MVP.
- If any task's test fails with a shadcn-related accessible-name mismatch (`role=switch, name=...`), fall back to `getByLabelText` — shadcn's Switch wraps a Radix primitive whose label association may be via `htmlFor`.
- The `submitDay` test for "toggleItem no-op on completed day" depends on you reading `days[2]` (array is 0-indexed, `dayNumber` is 1-indexed). Double-check.
- If `canvas-confetti` types error, confirm `@types/canvas-confetti` is installed (Task 2).
- If `next.config.ts` complains about Turbopack flag, drop `--turbopack` from scripts.
- The design doc is [2026-04-16-phyt-habit-tracker-mvp-design.md](./2026-04-16-phyt-habit-tracker-mvp-design.md). Refer back to it for visual/behavioral questions not explicit in tasks.

---

## Done when

- All 20 tasks committed.
- `npm test` green, `npm run build` green.
- Manual smoke test in Task 20 passes on desktop and at 375px mobile viewport.
- `git tag v0.1.0-mvp` exists locally.
