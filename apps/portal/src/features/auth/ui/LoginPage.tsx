import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('auth.invalidCredentials'));
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* ENGIE brand gradient ray — #00AAFF → #23D2B5 */}
        <div className="login-gradient-ray" />

        <img
          src="https://assets.design.digital.engie.com/brand/logo-engie-blue.svg"
          alt="ENGIE"
          className="login-logo"
        />

        <h1 className="login-title">{t('auth.customerPortal')}</h1>
        <p className="login-subtitle">{t('auth.loginSubtitle')}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <NJFormItem
            id="login-email"
            label={t('auth.email')}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value); setError(''); }}
            placeholder={t('auth.emailPlaceholder')}
            type="email"
            required
          />

          <NJFormItem
            id="login-password"
            label={t('auth.password')}
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
            label={t('auth.submit')}
          />
        </form>
      </div>
    </div>
  );
}
