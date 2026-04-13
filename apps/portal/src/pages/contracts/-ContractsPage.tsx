import { useTranslation } from 'react-i18next';
import { useGetContractsQuery } from '@/entities/contract';
import { NJCard, NJCardBody, NJDisplay, NJHeading, NJText, NJIcon, NJInlineMessage } from '@engie-group/fluid-design-system-react';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from './ContractsPage.module.css';

export function ContractsPage() {
  const { t } = useTranslation();
  const { data: contracts, isLoading, error } = useGetContractsQuery();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <NJDisplay scale="xs" as="h1">{t('contracts.title')}</NJDisplay>
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
        <NJDisplay scale="xs" as="h1">{t('contracts.title')}</NJDisplay>
        <NJInlineMessage variant="danger">
          {t('errors.loadFailed')}
        </NJInlineMessage>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NJDisplay scale="xs" as="h1">{t('contracts.title')}</NJDisplay>
      <div className={styles.list}>
        {contracts?.map((contract) => (
          <NJCard key={contract.id}>
            <NJCardBody>
              <div className={styles.cardHeader}>
                <div>
                  <NJHeading scale="xs">{contract.reference}</NJHeading>
                  <NJText scale="sm" variant="secondary">{contract.address}</NJText>
                </div>
                <StatusBadge status={contract.status} />
              </div>
              <div className={styles.cardDetails}>
                <div className={styles.detail}>
                  <NJText scale="xs" variant="secondary">{t('contracts.type')}</NJText>
                  <div className={styles.detailValueRow}>
                    <NJIcon name={contract.type === 'electricity' ? 'bolt' : contract.type === 'gas' ? 'local_fire_department' : 'wb_sunny'} />
                    <NJText>{t(`contracts.types.${contract.type}`)}</NJText>
                  </div>
                </div>
                <div className={styles.detail}>
                  <NJText scale="xs" variant="secondary">{t('contracts.meter')}</NJText>
                  <NJText>{contract.meterNumber}</NJText>
                </div>
                <div className={styles.detail}>
                  <NJText scale="xs" variant="secondary">{t('contracts.monthlyAmount')}</NJText>
                  <NJText>
                    <strong>
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(contract.monthlyAmount)}
                    </strong>
                  </NJText>
                </div>
              </div>
            </NJCardBody>
          </NJCard>
        ))}
      </div>
    </div>
  );
}
