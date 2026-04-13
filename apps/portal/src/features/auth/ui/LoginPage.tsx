import { type FormEvent, useState } from 'react';
import { NJButton } from '@engie-group/fluid-design-system-react';
import { useAppDispatch } from '@/app/providers/store';
import { setUser } from '../model/authSlice';
import './LoginPage.css';

const DEMO_EMAIL = 'marie.dupont@engie.com';
const DEMO_PASSWORD = 'Gén!e-ENGIE_2026$';

const MOCK_USER = {
  sub: 'usr_001',
  email: DEMO_EMAIL,
  name: 'Marie Dupont',
  tenantId: 'tenant_engie_fr',
  roles: ['customer', 'b2c'],
  avatar: undefined,
};

export function LoginPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      sessionStorage.setItem('genie-auth', 'true');
      dispatch(setUser(MOCK_USER));
    } else {
      setError('Identifiants incorrects. Veuillez réessayer.');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img
          src="https://www.engie.com/themes/flavor_starter/logo.svg"
          alt="ENGIE"
          className="login-logo"
        />
        <div className="login-title">Espace Client</div>
        <div className="login-subtitle">Connectez-vous à votre portail énergie</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Adresse e-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="nom@exemple.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Mot de passe</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <NJButton
            type="submit"
            // @ts-expect-error Fluid DS v6 types: "brand" variant exists at runtime
            variant="brand"
            emphasis="bold"
            className="login-submit"
            label="Se connecter"
          />
        </form>
      </div>
    </div>
  );
}
