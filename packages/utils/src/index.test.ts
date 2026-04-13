import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatEnergy, classNames } from '../src/index';

describe('utils', () => {
  it('formats currency in EUR', () => {
    const result = formatCurrency(87.5);
    expect(result).toContain('87');
    expect(result).toContain('€');
  });

  it('formats dates in French locale', () => {
    const result = formatDate('2026-04-15');
    expect(result).toContain('2026');
  });

  it('formats energy values', () => {
    expect(formatEnergy(342, 'kWh')).toContain('342');
    expect(formatEnergy(342, 'kWh')).toContain('kWh');
  });

  it('joins class names, filtering falsy values', () => {
    expect(classNames('a', 'b')).toBe('a b');
    expect(classNames('a', undefined, 'b', false, null)).toBe('a b');
    expect(classNames()).toBe('');
  });
});
