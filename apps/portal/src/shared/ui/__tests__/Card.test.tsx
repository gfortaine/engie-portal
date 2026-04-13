import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello World</Card>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders default variant', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toBeDefined();
  });

  it('renders error variant', () => {
    const { container } = render(<Card variant="error">Error content</Card>);
    expect(container.firstChild).toBeDefined();
    expect(screen.getByText('Error content')).toBeInTheDocument();
  });
});
