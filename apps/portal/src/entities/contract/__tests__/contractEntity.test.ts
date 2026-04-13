import { describe, it, expect } from 'vitest';
import type { Contract } from '../index';

describe('Contract entity', () => {
  it('defines correct contract types', () => {
    const contract: Contract = {
      id: 'ctr_001',
      reference: 'ENGIE-ELEC-2024-78542',
      type: 'electricity',
      status: 'active',
      address: '15 Rue de la Paix, 75002 Paris',
      startDate: '2024-01-15',
      monthlyAmount: 87.5,
      meterNumber: 'PDL-14789632541',
    };

    expect(contract.type).toBe('electricity');
    expect(contract.status).toBe('active');
  });

  it('supports optional endDate', () => {
    const active: Contract = {
      id: 'ctr_001',
      reference: 'REF-001',
      type: 'gas',
      status: 'active',
      address: 'Test',
      startDate: '2024-01-01',
      monthlyAmount: 50,
      meterNumber: 'PCE-123',
    };
    expect(active.endDate).toBeUndefined();

    const terminated: Contract = {
      ...active,
      status: 'terminated',
      endDate: '2025-01-01',
    };
    expect(terminated.endDate).toBe('2025-01-01');
  });

  it('has all required fields', () => {
    const requiredKeys: (keyof Contract)[] = [
      'id', 'reference', 'type', 'status', 'address',
      'startDate', 'monthlyAmount', 'meterNumber',
    ];

    const contract: Contract = {
      id: '1',
      reference: 'R',
      type: 'solar',
      status: 'pending',
      address: 'A',
      startDate: 'D',
      monthlyAmount: 0,
      meterNumber: 'M',
    };

    for (const key of requiredKeys) {
      expect(contract).toHaveProperty(key);
    }
  });
});
