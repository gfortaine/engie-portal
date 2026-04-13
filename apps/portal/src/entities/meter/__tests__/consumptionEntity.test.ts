import { describe, it, expect } from 'vitest';
import type { ConsumptionData, ConsumptionPoint } from '../index';

describe('Consumption entity', () => {
  const makeData = (overrides?: Partial<ConsumptionData>): ConsumptionData => ({
    contractId: 'ctr_001',
    period: '2026-03',
    total: 350.5,
    unit: 'kWh',
    points: [
      { date: '2026-03-01', value: 12.5, unit: 'kWh' },
      { date: '2026-03-02', value: 14.2, unit: 'kWh' },
    ],
    ...overrides,
  });

  it('defines consumption data with required fields', () => {
    const data = makeData();
    expect(data.contractId).toBe('ctr_001');
    expect(data.period).toBe('2026-03');
    expect(data.total).toBe(350.5);
    expect(data.unit).toBe('kWh');
    expect(data.points).toHaveLength(2);
  });

  it('supports optional comparisonPeriod', () => {
    const withoutComparison = makeData();
    expect(withoutComparison.comparisonPeriod).toBeUndefined();

    const withComparison = makeData({
      comparisonPeriod: { total: 320, percentChange: 9.5 },
    });
    expect(withComparison.comparisonPeriod?.percentChange).toBe(9.5);
  });

  it('supports both kWh and m³ units', () => {
    const electric = makeData({ unit: 'kWh' });
    expect(electric.unit).toBe('kWh');

    const gas = makeData({ unit: 'm³' });
    expect(gas.unit).toBe('m³');
  });

  it('consumption points have date, value, and unit', () => {
    const point: ConsumptionPoint = {
      date: '2026-03-15',
      value: 15.7,
      unit: 'kWh',
    };
    expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(point.value).toBeGreaterThan(0);
  });
});
