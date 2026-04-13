import { describe, it, expect } from 'vitest';
import type { Invoice } from '../index';

describe('Invoice entity', () => {
  it('defines correct invoice statuses', () => {
    const paid: Invoice = {
      id: 'inv_001',
      contractId: 'ctr_001',
      reference: 'FACT-2026-03-001',
      period: 'Mars 2026',
      issueDate: '2026-04-01',
      dueDate: '2026-04-15',
      amount: 94.32,
      status: 'paid',
    };
    expect(paid.status).toBe('paid');

    const pending: Invoice = { ...paid, status: 'pending' };
    expect(pending.status).toBe('pending');

    const overdue: Invoice = { ...paid, status: 'overdue' };
    expect(overdue.status).toBe('overdue');
  });

  it('supports optional downloadUrl', () => {
    const invoice: Invoice = {
      id: 'inv_001',
      contractId: 'ctr_001',
      reference: 'REF-001',
      period: 'Jan',
      issueDate: '2026-01-01',
      dueDate: '2026-01-15',
      amount: 100,
      status: 'paid',
    };
    expect(invoice.downloadUrl).toBeUndefined();

    const withUrl: Invoice = {
      ...invoice,
      downloadUrl: 'https://example.com/invoice.pdf',
    };
    expect(withUrl.downloadUrl).toBe('https://example.com/invoice.pdf');
  });

  it('has correct amount type', () => {
    const invoice: Invoice = {
      id: '1',
      contractId: 'c1',
      reference: 'R',
      period: 'P',
      issueDate: 'D1',
      dueDate: 'D2',
      amount: 0.01,
      status: 'pending',
    };
    expect(typeof invoice.amount).toBe('number');
    expect(invoice.amount).toBeGreaterThan(0);
  });
});
