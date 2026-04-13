import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { NJCard, NJCardBody, NJHeading, NJIcon } from '@engie-group/fluid-design-system-react';
import styles from './QuickActionsWidget.module.css';

const ACTIONS = [
  { icon: 'receipt_long', labelKey: 'dashboard.actions.viewInvoices', path: '/invoices' },
  { icon: 'description', labelKey: 'dashboard.actions.manageContracts', path: '/contracts' },
  { icon: 'bolt', labelKey: 'dashboard.actions.trackConsumption', path: '/consumption' },
  { icon: 'person', labelKey: 'dashboard.actions.editProfile', path: '/profile' },
];

export function QuickActionsWidget() {
  const { t } = useTranslation();

  return (
    <NJCard>
      <NJCardBody>
        <NJHeading scale="xs">{t('dashboard.quickActions')}</NJHeading>
        <div className={styles.actions}>
          {ACTIONS.map((action) => (
            <Link key={action.path} to={action.path} className={styles.actionItem}>
              <NJIcon name={action.icon} />
              <span className={styles.actionLabel}>{t(action.labelKey)}</span>
            </Link>
          ))}
        </div>
      </NJCardBody>
    </NJCard>
  );
}
