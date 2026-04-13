import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('renders terminated status', () => {
    render(<StatusBadge status="terminated" />);
    expect(screen.getByText('Résilié')).toBeInTheDocument();
  });

  it('renders paid status', () => {
    render(<StatusBadge status="paid" />);
    expect(screen.getByText('Payée')).toBeInTheDocument();
  });

  it('renders overdue status', () => {
    render(<StatusBadge status="overdue" />);
    expect(screen.getByText('En retard')).toBeInTheDocument();
  });

  it('renders unknown status as-is', () => {
    render(<StatusBadge status="custom_status" />);
    expect(screen.getByText('custom_status')).toBeInTheDocument();
  });
});
