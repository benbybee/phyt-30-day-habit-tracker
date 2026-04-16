'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
        colors: [
          CATEGORY_COLORS.fruits,
          CATEGORY_COLORS.veggies,
          CATEGORY_COLORS.fiberSpice,
        ],
      });
    }
    if (!open) firedRef.current = false;
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      toast.success('Copied!');
    } catch {
      toast.error('Copy failed — select the code and copy manually.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">You did it. 30 days.</DialogTitle>
          <DialogDescription>Your reward code:</DialogDescription>
        </DialogHeader>
        <div className="text-5xl py-2">🎉</div>
        <div className="flex items-center justify-center gap-2 my-4">
          <code className="px-4 py-2 border rounded text-xl font-mono">
            {DISCOUNT_CODE}
          </code>
          <Button variant="outline" onClick={copy}>
            Copy
          </Button>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {DISCOUNT_URL && (
            <a
              href={DISCOUNT_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants()}
            >
              Use code
            </a>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
