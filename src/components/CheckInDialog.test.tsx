import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckInDialog } from './CheckInDialog';

describe('CheckInDialog', () => {
  it('submit is disabled until all 3 toggles are on', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CheckInDialog open dayNumber={1} onSubmit={onSubmit} onClose={() => {}} />
    );

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
    render(
      <CheckInDialog open dayNumber={1} onSubmit={onSubmit} onClose={() => {}} />
    );
    await user.click(screen.getByRole('switch', { name: /fruits/i }));
    await user.click(screen.getByRole('switch', { name: /veggies/i }));
    await user.click(screen.getByRole('switch', { name: /fiber/i }));
    await user.click(screen.getByRole('button', { name: /complete day 1/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      fruits: true,
      veggies: true,
      fiberSpice: true,
    });
  });
});
