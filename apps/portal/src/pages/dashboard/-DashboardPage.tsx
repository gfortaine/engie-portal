import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/features/auth';
import { ContractOverviewWidget } from '@/widgets/contract-overview/ContractOverviewWidget';
import { ConsumptionSummaryWidget } from '@/widgets/sidebar/ConsumptionSummaryWidget';
import { QuickActionsWidget } from '@/widgets/sidebar/QuickActionsWidget';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAppAuth();

  return (
    <div className={styles.dashboard}>
      <header className={styles.welcomeHeader}>
        <h1 className={styles.welcomeTitle}>
          {t('dashboard.welcome', { name: user?.name ?? '' })}
        </h1>
        <p className={styles.welcomeSubtitle}>{t('dashboard.subtitle')}</p>
      </header>

      <div className={styles.grid}>
        <section className={styles.mainContent}>
          <ContractOverviewWidget />
        </section>

        <aside className={styles.sideContent}>
          <ConsumptionSummaryWidget />
          <QuickActionsWidget />
        </aside>
      </div>
    </div>
  );
}
