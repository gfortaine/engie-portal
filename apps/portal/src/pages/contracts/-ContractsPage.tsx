import { useTranslation } from 'react-i18next';
import { useGetContractsQuery } from '@/entities/contract';
import { Card } from '@/shared/ui/Card';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from './ContractsPage.module.css';

export function ContractsPage() {
  const { t } = useTranslation();
  const { data: contracts, isLoading, error } = useGetContractsQuery();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <h1>{t('contracts.title')}</h1>
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1>{t('contracts.title')}</h1>
        <Card variant="error">
          <p>{t('errors.loadFailed')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>{t('contracts.title')}</h1>
      <div className={styles.list}>
        {contracts?.map((contract) => (
          <Card key={contract.id} className={styles.contractCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.reference}>{contract.reference}</h3>
                <p className={styles.address}>{contract.address}</p>
              </div>
              <StatusBadge status={contract.status} />
            </div>
            <div className={styles.cardDetails}>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>{t('contracts.type')}</span>
                <span className={styles.detailValue}>
                  {t(`contracts.types.${contract.type}`)}
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>{t('contracts.meter')}</span>
                <span className={styles.detailValue}>{contract.meterNumber}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.detailLabel}>{t('contracts.monthlyAmount')}</span>
                <span className={styles.detailValue}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                    contract.monthlyAmount,
                  )}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
