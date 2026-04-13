import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Card } from '@/shared/ui/Card';
import styles from './QuickActionsWidget.module.css';

const ACTIONS = [
  { icon: '📄', labelKey: 'dashboard.actions.viewInvoices', path: '/invoices' },
  { icon: '📋', labelKey: 'dashboard.actions.manageContracts', path: '/contracts' },
  { icon: '⚡', labelKey: 'dashboard.actions.trackConsumption', path: '/consumption' },
  { icon: '👤', labelKey: 'dashboard.actions.editProfile', path: '/profile' },
];

export function QuickActionsWidget() {
  const { t } = useTranslation();

  return (
    <Card className={styles.widget}>
      <h3 className={styles.title}>{t('dashboard.quickActions')}</h3>
      <div className={styles.actions}>
        {ACTIONS.map((action) => (
          <Link key={action.path} to={action.path} className={styles.actionItem}>
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionLabel}>{t(action.labelKey)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
