import { Link, useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { path: '/' as const, icon: '🏠', labelKey: 'nav.dashboard' },
  { path: '/contracts' as const, icon: '📋', labelKey: 'nav.contracts' },
  { path: '/invoices' as const, icon: '💶', labelKey: 'nav.invoices' },
  { path: '/consumption' as const, icon: '⚡', labelKey: 'nav.consumption' },
  { path: '/profile' as const, icon: '👤', labelKey: 'nav.profile' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();

  return (
    <nav className={styles.sidebar}>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive = matchRoute({ to: item.path, fuzzy: item.path !== '/' });
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <p className={styles.version}>ENGIE Portal v0.1.0</p>
        <p className={styles.stack}>React 19 · RTK · tRPC · FSD</p>
      </div>
    </nav>
  );
}
