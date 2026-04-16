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
