'use client';

import { useState, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  const [toggles, setToggles] = useState<Toggles>({
    fruits: false,
    veggies: false,
    fiberSpice: false,
  });
  const fruitsId = useId();
  const veggiesId = useId();
  const fiberId = useId();

  const anyOn = toggles.fruits || toggles.veggies || toggles.fiberSpice;

  const row = (key: keyof Toggles, label: string, id: string) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <label htmlFor={id} className="text-base cursor-pointer flex-1">
        {label}
      </label>
      <Switch
        id={id}
        checked={toggles[key]}
        onCheckedChange={(v) => setToggles((t) => ({ ...t, [key]: v }))}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Day {dayNumber} Check-In</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {row('fruits', 'Fruits', fruitsId)}
          {row('veggies', 'Veggies', veggiesId)}
          {row('fiberSpice', 'Fiber & Spice', fiberId)}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!anyOn} onClick={() => onSubmit(toggles)}>
            Log Day {dayNumber}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
