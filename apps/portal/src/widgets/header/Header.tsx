import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/features/auth';
import styles from './Header.module.css';

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAppAuth();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <svg className={styles.logo} viewBox="0 0 120 40" width="120" height="40">
          <rect width="120" height="40" rx="4" fill="#009b4d" />
          <text x="12" y="27" fill="white" fontFamily="Lato, sans-serif" fontWeight="700" fontSize="18">
            ENGIE
          </text>
          <text x="74" y="27" fill="rgba(255,255,255,0.8)" fontFamily="Lato, sans-serif" fontSize="10">
            Portal
          </text>
        </svg>
      </div>

      <nav className={styles.nav}>
        <span className={styles.envBadge}>{t('common.demo')}</span>
      </nav>

      <div className={styles.userSection}>
        <div className={styles.userAvatar}>
          {user?.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <span className={styles.userName}>{user?.name}</span>
        <button onClick={signOut} className={styles.logoutBtn}>
          {t('auth.logout')}
        </button>
      </div>
    </header>
  );
}
