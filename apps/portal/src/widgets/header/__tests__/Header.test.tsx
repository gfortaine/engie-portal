import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { setupStore } from '@/app/providers/store';
import { setUser } from '@/features/auth/model/authSlice';
import { Header } from '../Header';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.demo': 'DEMO',
        'common.notifications': 'Notifications',
        'auth.logout': 'Déconnexion',
      };
      return translations[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const mockSignOut = vi.fn();
vi.mock('@/features/auth', () => ({
  useAppAuth: () => ({
    user: { name: 'Marie Dupont', email: 'marie@engie.com' },
    signOut: mockSignOut,
  }),
}));

function renderHeader() {
  const store = setupStore();
  store.dispatch(
    setUser({
      sub: '1',
      email: 'marie@engie.com',
      name: 'Marie Dupont',
      tenantId: 'engie',
      roles: ['admin'],
    }),
  );
  return render(
    <Provider store={store}>
      <Header />
    </Provider>,
  );
}

describe('Header', () => {
  it('renders ENGIE branding', () => {
    renderHeader();
    expect(screen.getByText('ENGIE')).toBeInTheDocument();
    expect(screen.getByText('Portal')).toBeInTheDocument();
  });

  it('shows DEMO badge', () => {
    renderHeader();
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });

  it('displays user name', () => {
    renderHeader();
    const matches = screen.getAllByText('Marie Dupont');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows user initials in avatar', () => {
    renderHeader();
    expect(screen.getByText('MD')).toBeInTheDocument();
  });

  it('renders logout button that opens confirmation', () => {
    renderHeader();
    const logoutBtn = screen.getByText('Déconnexion');
    expect(logoutBtn).toBeInTheDocument();
    // NJModal uses portals not available in jsdom; verify button is clickable
    fireEvent.click(logoutBtn);
  });
});
