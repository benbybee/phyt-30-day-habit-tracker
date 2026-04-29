'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DISCOUNT_CODE, DISCOUNT_URL } from '@/lib/config';

type Props = {
  open: boolean;
  onClose: () => void;
};

type View = 'reward' | 'feedback' | 'thanks';

export function RewardReveal({ open, onClose }: Props) {
  const [view, setView] = useState<View>('reward');
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setView('reward');
        setRating(null);
        setComments('');
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      toast.success('Code copied');
    } catch {
      toast.error('Copy failed — select the code and copy manually.');
    }
  };

  const submitFeedback = () => {
    // Feedback payload would POST here in production.
    // For now: rating={rating}, comments={comments}
    setView('thanks');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {view === 'reward' && (
          <div className="space-y-5">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                You did it. 30 days.
              </DialogTitle>
              <DialogDescription>
                Here&apos;s your reward for completing the tracker.
              </DialogDescription>
            </DialogHeader>

            <button
              type="button"
              onClick={copy}
              className="group w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center transition-colors hover:bg-slate-100"
            >
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Your discount code
              </div>
              <div className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-slate-900">
                {DISCOUNT_CODE}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 group-hover:text-slate-600">
                Tap to copy
              </div>
            </button>

            <div className="flex flex-col gap-2">
              <a
                href={DISCOUNT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Purchase
              </a>
              <Button variant="outline" onClick={() => setView('feedback')}>
                Share Your Feedback
              </Button>
            </div>
          </div>
        )}

        {view === 'feedback' && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Share your feedback
              </DialogTitle>
              <DialogDescription>
                Takes ~30 seconds. Your answers help us improve.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                How would you rate your 30-day experience?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`flex-1 rounded-md border py-2 text-sm font-semibold transition-colors ${
                      rating === n
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                    aria-label={`Rate ${n} out of 5`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Not great</span>
                <span>Loved it</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="feedback-comments" className="text-sm font-medium text-slate-700">
                What could we do better?
              </label>
              <textarea
                id="feedback-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share anything on your mind…"
                rows={3}
                className="w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setView('reward')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={submitFeedback}
                disabled={rating === null}
                className="flex-1"
              >
                Submit
              </Button>
            </div>
          </div>
        )}

        {view === 'thanks' && (
          <div className="space-y-4 py-2 text-center">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                Thank you!
              </DialogTitle>
              <DialogDescription>
                We appreciate you sharing your experience.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
