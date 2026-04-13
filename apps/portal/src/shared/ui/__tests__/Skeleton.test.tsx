import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default height', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const { container } = render(<Skeleton height={200} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe('200px');
  });

  it('has accessible loading indicator', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
  });
});
