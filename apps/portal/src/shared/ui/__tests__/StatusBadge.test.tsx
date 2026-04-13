import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusBadge } from '../StatusBadge';

// Mock react-i18next to return the translation key as-is
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

describe('StatusBadge', () => {
  it('renders active status with correct variant', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.querySelector('.nj-badge--success')).toBeInTheDocument();
  });

  it('renders pending status with correct variant', () => {
    const { container } = render(<StatusBadge status="pending" />);
    expect(container.querySelector('.nj-badge--warning')).toBeInTheDocument();
  });

  it('renders terminated status with correct variant', () => {
    const { container } = render(<StatusBadge status="terminated" />);
    expect(container.querySelector('.nj-badge--neutral')).toBeInTheDocument();
  });

  it('renders paid status with correct variant', () => {
    const { container } = render(<StatusBadge status="paid" />);
    expect(container.querySelector('.nj-badge--success')).toBeInTheDocument();
  });

  it('renders overdue status with correct variant', () => {
    const { container } = render(<StatusBadge status="overdue" />);
    expect(container.querySelector('.nj-badge--danger')).toBeInTheDocument();
  });

  it('renders unknown status with neutral variant', () => {
    render(<StatusBadge status="custom_status" />);
    expect(screen.getByText('custom_status')).toBeInTheDocument();
  });
});
