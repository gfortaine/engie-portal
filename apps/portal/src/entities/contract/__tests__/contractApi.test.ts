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
    expect(contract.monthlyAmount).toBe(87.5);
  });

  it('supports optional endDate', () => {
    const terminated: Contract = {
      id: 'ctr_004',
      reference: 'ENGIE-ELEC-2023-45678',
      type: 'electricity',
      status: 'terminated',
      address: '8 Boulevard Haussmann',
      startDate: '2023-03-01',
      endDate: '2025-02-28',
      monthlyAmount: 0,
      meterNumber: 'PDL-33345678901',
    };

    expect(terminated.endDate).toBe('2025-02-28');
    expect(terminated.status).toBe('terminated');
  });

  it('handles all contract types', () => {
    const types: Contract['type'][] = ['electricity', 'gas', 'solar'];
    expect(types).toHaveLength(3);
  });

  it('handles all contract statuses', () => {
    const statuses: Contract['status'][] = ['active', 'pending', 'terminated'];
    expect(statuses).toHaveLength(3);
  });
});
