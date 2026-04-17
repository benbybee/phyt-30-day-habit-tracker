import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInDialog } from './CheckInDialog';

describe('CheckInDialog', () => {
  it('submit is disabled until at least one toggle is on', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CheckInDialog open dayNumber={1} onSubmit={onSubmit} onClose={() => {}} />
    );

    const submit = screen.getByRole('button', { name: /log day 1/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: /fruits/i }));
    expect(submit).toBeEnabled();
  });

  it('submits with any subset of toggles on', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CheckInDialog open dayNumber={1} onSubmit={onSubmit} onClose={() => {}} />
    );
    await user.click(screen.getByRole('switch', { name: /veggies/i }));
    await user.click(screen.getByRole('button', { name: /log day 1/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      fruits: false,
      veggies: true,
      fiberSpice: false,
    });
  });

  it('submits with all 3 on', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CheckInDialog open dayNumber={1} onSubmit={onSubmit} onClose={() => {}} />
    );
    await user.click(screen.getByRole('switch', { name: /fruits/i }));
    await user.click(screen.getByRole('switch', { name: /veggies/i }));
    await user.click(screen.getByRole('switch', { name: /fiber/i }));
    await user.click(screen.getByRole('button', { name: /log day 1/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      fruits: true,
      veggies: true,
      fiberSpice: true,
    });
  });
});
