import { useTranslation } from 'react-i18next';
import { useGetContractsQuery } from '@/entities/contract';
import { Card } from '@/shared/ui/Card';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from './ContractOverviewWidget.module.css';

export function ContractOverviewWidget() {
  const { t } = useTranslation();
  const { data: contracts, isLoading } = useGetContractsQuery();

  if (isLoading) {
    return (
      <Card className={styles.widget}>
        <h2 className={styles.title}>{t('dashboard.contractOverview')}</h2>
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={72} />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.widget}>
      <h2 className={styles.title}>{t('dashboard.contractOverview')}</h2>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{contracts?.length ?? 0}</span>
          <span className={styles.statLabel}>{t('dashboard.totalContracts')}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {contracts?.filter((c) => c.status === 'active').length ?? 0}
          </span>
          <span className={styles.statLabel}>{t('dashboard.activeContracts')}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {contracts
              ? new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(contracts.reduce((sum, c) => sum + c.monthlyAmount, 0))
              : '—'}
          </span>
          <span className={styles.statLabel}>{t('dashboard.monthlyTotal')}</span>
        </div>
      </div>
      <div className={styles.list}>
        {contracts?.map((contract) => (
          <div key={contract.id} className={styles.contractRow}>
            <div className={styles.contractInfo}>
              <span className={styles.contractRef}>{contract.reference}</span>
              <span className={styles.contractAddr}>{contract.address}</span>
            </div>
            <div className={styles.contractMeta}>
              <span className={styles.typeIcon}>
                {contract.type === 'electricity' ? '⚡' : contract.type === 'gas' ? '🔥' : '☀️'}
              </span>
              <StatusBadge status={contract.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
