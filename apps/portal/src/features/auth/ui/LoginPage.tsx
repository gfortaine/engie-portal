import { type FormEvent, useState } from 'react';
import { NJButton, NJFormItem, NJInlineMessage } from '@engie-group/fluid-design-system-react';
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
        {/* ENGIE brand gradient ray — #00AAFF → #23D2B5 */}
        <div className="login-gradient-ray" />

        <svg className="login-logo" viewBox="0 0 140 40" width="180" height="52" aria-label="ENGIE">
          <defs>
            <linearGradient id="engie-login-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00aaff" />
              <stop offset="100%" stopColor="#23d2b5" />
            </linearGradient>
          </defs>
          <rect width="140" height="3" rx="1.5" fill="url(#engie-login-grad)" />
          <text x="0" y="28" fill="#182663" fontFamily="Lato, sans-serif" fontWeight="900" fontSize="22" letterSpacing="2">
            ENGIE
          </text>
          <text x="90" y="28" fill="#007acd" fontFamily="Lato, sans-serif" fontWeight="400" fontSize="13">
            Portal
          </text>
        </svg>

        <h1 className="login-title">Espace Client</h1>
        <p className="login-subtitle">Connectez-vous à votre portail énergie</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <NJFormItem
            id="login-email"
            label="Adresse e-mail"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setError(''); }}
            placeholder="nom@exemple.com"
            type="email"
            required
          />

          <NJFormItem
            id="login-password"
            label="Mot de passe"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setError(''); }}
            placeholder="••••••••"
            type="password"
            required
          />

          {error && (
            <NJInlineMessage variant="error">
              {error}
            </NJInlineMessage>
          )}

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
