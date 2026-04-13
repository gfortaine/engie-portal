import { useTranslation } from 'react-i18next';
import { useGetContractsQuery } from '@/entities/contract';
import { NJCard, NJCardBody, NJHeading, NJText, NJDivider, NJIcon } from '@engie-group/fluid-design-system-react';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from './ContractOverviewWidget.module.css';

export function ContractOverviewWidget() {
  const { t } = useTranslation();
  const { data: contracts, isLoading } = useGetContractsQuery();

  if (isLoading) {
    return (
      <NJCard>
        <NJCardBody>
          <NJHeading scale="sm">{t('dashboard.contractOverview')}</NJHeading>
          <div className={styles.list}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={72} />
            ))}
          </div>
        </NJCardBody>
      </NJCard>
    );
  }

  const activeCount = contracts?.filter((c) => c.status === 'active').length ?? 0;
  const monthlyTotal = contracts
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
        contracts.reduce((sum, c) => sum + c.monthlyAmount, 0),
      )
    : '—';

  return (
    <NJCard>
      <NJCardBody>
        <NJHeading scale="sm">{t('dashboard.contractOverview')}</NJHeading>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{contracts?.length ?? 0}</span>
            <NJText scale="xs" variant="secondary">{t('dashboard.totalContracts')}</NJText>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{activeCount}</span>
            <NJText scale="xs" variant="secondary">{t('dashboard.activeContracts')}</NJText>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{monthlyTotal}</span>
            <NJText scale="xs" variant="secondary">{t('dashboard.monthlyTotal')}</NJText>
          </div>
        </div>

        <NJDivider />

        <div className={styles.list}>
          {contracts?.map((contract) => (
            <div key={contract.id} className={styles.contractRow}>
              <div className={styles.contractInfo}>
                <NJText scale="md"><strong>{contract.reference}</strong></NJText>
                <NJText scale="sm" variant="secondary">{contract.address}</NJText>
              </div>
              <div className={styles.contractMeta}>
                <NJIcon name={contract.type === 'electricity' ? 'bolt' : contract.type === 'gas' ? 'local_fire_department' : 'wb_sunny'} />
                <StatusBadge status={contract.status} />
              </div>
            </div>
          ))}
        </div>
      </NJCardBody>
    </NJCard>
  );
}
