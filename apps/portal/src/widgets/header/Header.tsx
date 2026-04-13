import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { NJHeader as FluidHeader, NJBadge, NJButton, NJNavigationAction, NJAvatarRoot } from '@engie-group/fluid-design-system-react';
import { useAppAuth } from '@/features/auth';
import styles from './Header.module.css';

function EngieLogo() {
  return (
    <Link to="/" className={styles.logoLink}>
      <svg viewBox="0 0 140 40" width="140" height="40" aria-label="ENGIE Portal">
        {/* ENGIE gradient bar */}
        <defs>
          <linearGradient id="engie-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00aaff" />
            <stop offset="100%" stopColor="#23d2b5" />
          </linearGradient>
        </defs>
        <rect width="140" height="3" rx="1.5" fill="url(#engie-grad)" />
        <text x="0" y="28" fill="#182663" fontFamily="Lato, sans-serif" fontWeight="900" fontSize="22" letterSpacing="2">
          ENGIE
        </text>
        <text x="90" y="28" fill="#007acd" fontFamily="Lato, sans-serif" fontWeight="400" fontSize="13">
          Portal
        </text>
      </svg>
    </Link>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAppAuth();

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('') ?? '';

  return (
    <FluidHeader
      layout="retracted"
      logo={<EngieLogo />}
      control={
        <NJBadge variant="warning" emphasis="subtle">
          {t('common.demo')}
        </NJBadge>
      }
      utility={
        <NJNavigationAction icon="notifications">
          {t('common.notifications')}
        </NJNavigationAction>
      }
      avatar={
        <div className={styles.userSection}>
          <NJAvatarRoot
            initials={initials}
            label={user?.name ?? ''}
            scale="sm"
          />
          <span className={styles.userName}>{user?.name}</span>
        </div>
      }
      button={
        <NJButton
          emphasis="minimal"
          variant="secondary"
          icon="logout"
          label={t('auth.logout')}
          onClick={signOut}
        />
      }
    />
  );
}
