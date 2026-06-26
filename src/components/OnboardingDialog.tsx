'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTrackerStore } from '@/lib/state';

type Props = {
  open: boolean;
  firstName?: string;
  onClose: () => void;
};

const SUGGESTIONS = [
  'Water (8 cups)',
  'Walk 5K',
  'Stretching',
  'Meditation',
  '7+ hours sleep',
  'No added sugar',
];

export function OnboardingDialog({ open, firstName, onClose }: Props) {
  const otherLabel = useTrackerStore((s) => s.otherLabel);
  const setOtherLabel = useTrackerStore((s) => s.setOtherLabel);

  // Local draft so they can cancel without persisting their typing.
  const [draft, setDraft] = useState(otherLabel === 'Other' ? '' : otherLabel);

  const handleSave = () => {
    const next = draft.trim();
    if (next) setOtherLabel(next);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </DialogTitle>
          <DialogDescription>
            Alongside Fruits, Veggies, and Fiber &amp; Spice Supplement, you get to choose one custom
            habit. Pick a suggestion below or type your own.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="other-habit-input"
              className="text-sm font-medium text-slate-700 block mb-1.5"
            >
              Type in your own
            </label>
            <input
              id="other-habit-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={30}
              placeholder="e.g. Water, Walk 5K, Meditation"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              autoFocus
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    draft === s
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Skip for now
          </button>
          <Button onClick={handleSave} disabled={!draft.trim()}>
            Save habit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
