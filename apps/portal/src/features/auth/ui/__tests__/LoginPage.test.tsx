import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { setupStore } from '@/app/providers/store';
import { LoginPage } from '../LoginPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.customerPortal': 'Espace Client',
        'auth.loginSubtitle': 'Connectez-vous à votre portail énergie',
        'auth.email': 'Adresse e-mail',
        'auth.emailPlaceholder': 'nom@exemple.com',
        'auth.password': 'Mot de passe',
        'auth.submit': 'Se connecter',
        'auth.invalidCredentials': 'Identifiants incorrects. Veuillez réessayer.',
      };
      return translations[key] ?? key;
    },
  }),
}));

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

function renderLoginPage() {
  const store = setupStore();
  return { store, ...render(<Provider store={store}><LoginPage /></Provider>) };
}

describe('LoginPage', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders logo, title, and form fields', () => {
    renderLoginPage();
    expect(screen.getByAltText('ENGIE')).toBeInTheDocument();
    expect(screen.getByText('Espace Client')).toBeInTheDocument();
    expect(screen.getByText('Connectez-vous à votre portail énergie')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
  });

  it('shows error on invalid credentials', () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'bad@email.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByLabelText('Adresse e-mail').closest('form')!);
    expect(screen.getByText('Identifiants incorrects. Veuillez réessayer.')).toBeInTheDocument();
  });

  it('authenticates with valid credentials', () => {
    const { store } = renderLoginPage();
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'marie.dupont@engie.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'Gén!e-ENGIE_2026$' } });
    fireEvent.submit(screen.getByLabelText('Adresse e-mail').closest('form')!);

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('genie-auth', 'true');
    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().auth.user?.email).toBe('marie.dupont@engie.com');
  });

  it('clears error when user types after failure', () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'bad@email.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByLabelText('Adresse e-mail').closest('form')!);
    expect(screen.getByText('Identifiants incorrects. Veuillez réessayer.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'a' } });
    expect(screen.queryByText('Identifiants incorrects. Veuillez réessayer.')).not.toBeInTheDocument();
  });

  it('does not authenticate with wrong password', () => {
    const { store } = renderLoginPage();
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: 'marie.dupont@engie.com' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'WrongPassword123' } });
    fireEvent.submit(screen.getByLabelText('Adresse e-mail').closest('form')!);

    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
    expect(store.getState().auth.status).toBe('idle');
  });
});
