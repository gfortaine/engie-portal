import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PageBreadcrumb } from '../PageBreadcrumb';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to?: string; className?: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

describe('PageBreadcrumb', () => {
  it('renders all breadcrumb items', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Contracts' },
        ]}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contracts')).toBeInTheDocument();
  });

  it('renders links for items with "to" prop', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Current Page' },
        ]}
      />,
    );

    const link = screen.getByText('Home').closest('a');
    expect(link).toHaveAttribute('href', '/');
  });

  it('marks the last item as current page', () => {
    render(
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Profile' },
        ]}
      />,
    );

    const currentItem = screen.getByText('Profile').closest('li');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders accessible breadcrumb navigation', () => {
    render(
      <PageBreadcrumb items={[{ label: 'Dashboard', to: '/' }, { label: 'Profile' }]} />,
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
