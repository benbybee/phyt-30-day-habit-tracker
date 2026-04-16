# Join the Phyt — 30 Day Habit Tracker MVP (Design)

**Date:** 2026-04-16
**Owner:** Ben Bybee
**Scope:** Local demo MVP. Visual tracker, clickable check-ins, discount code reveal on completion. No auth, no backend, no deployment beyond localhost.

---

## 1. Goal & Scope

Digitize the physical "Join the Phyt" 30-day habit tracker as a clickable web demo.

**In scope**
- Interactive circular ring with 30 segments, each with 3 sub-bands (Fruits / Veggies / Fiber & Spice).
- Click a segment → dialog with 3 toggles → mark day complete.
- Ring fills visually as days complete.
- Reward reveal with a static discount code when all 30 days are complete.
- Local persistence via `localStorage` so state survives refresh.
- "Reset demo" button to wipe state and start over.

**Explicitly out of scope (for now)**
- Authentication (magic link, SMS, passwords).
- Server-side data model (Supabase, Postgres, Drizzle).
- Daily lock / anti-cheat / server-time validation.
- SMS or email reminders, Vercel Cron.
- Unique per-user discount codes, Shopify/Recharge integration.
- Deployment (runs on `npm run dev` only).

These can all be layered on later when we move from demo to production v1.

---

## 2. Architecture & Stack

**Runtime**
- Next.js 15 (App Router), TypeScript strict, React 19
- Tailwind CSS + shadcn/ui (Dialog, Button, Switch, Toast)
- Framer Motion (segment fill animation + reveal transitions)
- `canvas-confetti` for the reward burst
- Zustand with `persist` middleware for state + localStorage
- Runs locally with `npm run dev` on `http://localhost:3000`

**No backend.** All state lives in the browser.

**File layout**
```
src/
├── app/
│   ├── page.tsx                # Landing → "Start Tracker" CTA
│   ├── tracker/page.tsx        # The ring (main screen)
│   └── layout.tsx              # Root layout, fonts, Tailwind
├── components/
│   ├── HabitRing.tsx           # SVG ring, 30 segments × 3 bands
│   ├── CheckInDialog.tsx       # 3 toggles + Submit
│   ├── ProgressStats.tsx       # "Day X of 30" + streak copy
│   └── RewardReveal.tsx        # Overlay, confetti, code + Copy
├── lib/
│   ├── state.ts                # Zustand store
│   ├── storage.ts              # localStorage key + version
│   └── config.ts               # DISCOUNT_CODE, DISCOUNT_URL, brand colors
└── styles/globals.css
```

---

## 3. State Shape

```ts
type DayState = {
  dayNumber: number;               // 1–30
  fruits: boolean;
  veggies: boolean;
  fiberSpice: boolean;
  completed: boolean;              // fruits && veggies && fiberSpice
  completedAt: string | null;      // ISO timestamp, for "just filled" animation
};

type TrackerState = {
  days: DayState[];                // length 30, seeded all false
  rewardUnlocked: boolean;
  rewardClaimedAt: string | null;

  toggleItem(day: number, item: 'fruits' | 'veggies' | 'fiberSpice'): void;
  submitDay(day: number): void;    // all 3 must be true; marks completed
  reset(): void;                   // wipes localStorage + re-seeds
};
```

**Persistence**
- Zustand `persist` middleware → `localStorage` key `phyt-tracker-v1`.
- Version suffix (`-v1`) allows future migrations.

**Derived selectors (not stored)**
- `completedCount` = `days.filter(d => d.completed).length`
- `currentDay` = lowest `dayNumber` where `!completed`

---

## 4. Ring UI

**Geometry**
- C-shape (open at top), matching the physical tracker.
- 30 segments on an arc sweeping ~10 o'clock → bottom → ~2 o'clock.
- 3 concentric bands per segment: inner = Fruits, middle = Veggies, outer = Fiber & Spice.
- Day numbers (1–30) float just outside the outer arc.
- Green leaf icon centered inside the ring.

**Rendering**
- Single `<svg>`. Each segment is an annular-sector `<path>` generated via polar math.
- Each of the 3 bands is its own `<path>`, fill tied to state:
  - Empty: white with thin gray stroke.
  - Filled: category color.
- Category colors (to be refined against brand): Fruits ≈ `#c0392b`, Veggies ≈ `#3aa856`, Fiber & Spice ≈ `#6b4a9e`.

**Interaction**
1. **Hover** incomplete segment → subtle scale-up + tooltip ("Day N").
2. **Click** incomplete segment → opens `CheckInDialog`:
   ```
   [ ] Fruits
   [ ] Veggies
   [ ] Fiber & Spice
   [Cancel]  [Complete Day N]
   ```
   Submit disabled until all three toggles are on.
3. **Submit** → dialog closes; 3 bands animate fill in sequence (~150ms each); segment pulses briefly.
4. **Already-completed segments** → click is a no-op (or read-only popover). Past days cannot be edited.

**Page layout (`/tracker`)**
```
┌──────────────────────────────────────────┐
│  Join the Phyt                 [Reset]   │
│                                          │
│       ╭─ Day 12 of 30 complete ─╮        │
│                                          │
│              (the ring)                  │
│                                          │
│     "You're building momentum."          │
│                                          │
│  Legend: 🔴 Fruits  🟢 Veggies  🟣 Fiber │
└──────────────────────────────────────────┘
```

**Streak copy** (by `completedCount`)
- 1–6: "Day N — starting strong"
- 7: "Day 7 — you're building momentum"
- 8–14: "Day N — keep going"
- 15: "Halfway there"
- 16–26: "Day N — past the halfway mark"
- 27–29: "Only N days left"
- 30: triggers reward reveal

**Responsiveness**
- Desktop: ring ~500px, centered.
- Mobile: ring scales to viewport width; dialog becomes a bottom sheet.

---

## 5. Reward Reveal

**Pre-unlock**
- Small lock chip below the ring: `🔒 Complete all 30 days to unlock your reward`.

**Unlock trigger**
- Fires on the submit that pushes `completedCount` to 30.
- `useEffect` watching `rewardUnlocked` runs reveal once; sets `rewardClaimedAt` so it doesn't re-fire.

**Reveal sequence (~2.5s)**
1. Final segment finishes band-fill animation.
2. Radial glow expands from ring center.
3. Confetti burst in category colors (`canvas-confetti`).
4. Full-screen overlay fades in with code + Copy + Use code buttons.

**Discount code**
```ts
// lib/config.ts
export const DISCOUNT_CODE = 'PHYT30';        // swap with real code
export const DISCOUNT_URL = 'https://balanceofnature.com';
```
- `Copy` → `navigator.clipboard.writeText(DISCOUNT_CODE)` + toast.
- `Use code` → opens `DISCOUNT_URL` in new tab.

**Re-entry**
- Reward persists in localStorage.
- Closing overlay → header shows "Your reward is ready →" button to reopen.
- `Reset demo` clears reward state too.

**State matrix**
| `completedCount` | Seen reward? | UI |
|---|---|---|
| 0 | — | "Tap Day 1 to start." CTA |
| 1–29 | — | Standard tracker |
| 30 | no | Auto-trigger reveal |
| 30 | yes | Header "Reward ready" button, no auto-reveal |

---

## 6. Non-goals / Deferred to Production v1

When this demo graduates to a real product, these are the additions:

- Supabase Auth (magic link via Resend) + phone for SMS reminders.
- Supabase Postgres + Drizzle, with `profiles`, `daily_logs`, `rewards`, `reminder_sends` tables.
- Server-time daily lock via unique `(user_id, check_in_date)` constraint.
- Hybrid pacing: calendar day number computed server-side from `start_date`.
- Vercel Cron hourly reminders (email via Resend, SMS via Twilio).
- RLS policies so users only see their own data.
- Swap static `DISCOUNT_CODE` for unique per-user codes minted via Shopify/Recharge.

The state shape and component structure above are intentionally compatible with that future — swapping `localStorage` persistence for a server round-trip is a localized change.

---

## 7. Success Criteria

The demo is done when:
- `npm run dev` boots the app on localhost.
- Clicking through 30 segments fills the ring completely.
- Each check-in requires all 3 toggles before submit.
- Filled segments cannot be edited.
- State survives page refresh.
- Hitting day 30 reveals the discount code with confetti.
- Copy button copies the code to clipboard.
- Reset button clears everything and starts the demo over.
- Works on desktop and mobile viewport widths.
