import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/features/auth';
import { NJDisplay, NJText } from '@engie-group/fluid-design-system-react';
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
        <NJDisplay scale="xs" as="h1">
          {t('dashboard.welcome', { name: user?.name ?? '' })}
        </NJDisplay>
        <NJText scale="lg" variant="secondary">{t('dashboard.subtitle')}</NJText>
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
