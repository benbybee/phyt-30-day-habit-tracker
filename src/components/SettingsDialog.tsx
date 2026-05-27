'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTrackerStore } from '@/lib/state';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsDialog({ open, onClose }: Props) {
  const fiberSpiceEnabled = useTrackerStore((s) => s.fiberSpiceEnabled);
  const setFiberSpiceEnabled = useTrackerStore((s) => s.setFiberSpiceEnabled);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">Settings</DialogTitle>
          <DialogDescription>Customize what you track.</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="flex-1 pr-3">
              <label htmlFor="fiber-spice-toggle" className="text-sm font-medium text-slate-900">
                Track Fiber &amp; Spice
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Turn this off if you don&apos;t want to track Fiber &amp; Spice.
              </p>
            </div>
            <Switch
              id="fiber-spice-toggle"
              checked={fiberSpiceEnabled}
              onCheckedChange={setFiberSpiceEnabled}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
