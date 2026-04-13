import { useTranslation } from 'react-i18next';
import { useGetContractsQuery } from '@/entities/contract';
import { NJCard, NJCardBody, NJDisplay, NJHeading, NJText, NJIcon, NJTag, NJInlineMessage, NJAccordion, NJAccordionItem, NJAccordionItemHeader, NJAccordionItemContent, NJInputSearch } from '@engie-group/fluid-design-system-react';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { Skeleton } from '@/shared/ui/Skeleton';
import { PageBreadcrumb } from '@/shared/ui/PageBreadcrumb';
import styles from './ContractsPage.module.css';
import { useState, useMemo } from 'react';

const ENERGY_TAG_CONFIG: Record<string, { icon: string; variant: 'blue' | 'orange' | 'green' }> = {
  electricity: { icon: 'bolt', variant: 'blue' },
  gas: { icon: 'local_fire_department', variant: 'orange' },
  solar: { icon: 'wb_sunny', variant: 'green' },
};

export function ContractsPage() {
  const { t } = useTranslation();
  const { data: contracts, isLoading, error } = useGetContractsQuery();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!contracts) return [];
    if (!search) return contracts;
    const q = search.toLowerCase();
    return contracts.filter(
      (c) =>
        c.reference.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }, [contracts, search]);

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
        {/* @ts-expect-error Fluid DS v6 types mismatch */}
        <NJInlineMessage variant="danger">
          {t('errors.loadFailed')}
        </NJInlineMessage>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageBreadcrumb items={[{ label: t('nav.dashboard'), to: '/' }, { label: t('contracts.title') }]} />
      <NJDisplay scale="xs" as="h1">{t('contracts.title')}</NJDisplay>

      <div className={styles.toolbar}>
        <NJInputSearch
          id="contract-search"
          // @ts-expect-error Fluid DS v6 types mismatch
          label={t('contracts.search', 'Rechercher un contrat')}
          value={search}
          // @ts-expect-error Fluid DS v6 types mismatch
          onChange={(_e, v) => setSearch(v ?? '')}
        />
      </div>

      <div className={styles.list}>
        {filtered.map((contract) => {
          const tagConfig = ENERGY_TAG_CONFIG[contract.type] ?? ENERGY_TAG_CONFIG.electricity!;
          return (
            <NJCard key={contract.id}>
              <NJCardBody>
                <div className={styles.cardHeader}>
                  <div>
                    <NJHeading scale="xs">{contract.reference}</NJHeading>
                    <NJText scale="sm" variant="secondary">{contract.address}</NJText>
                  </div>
                  <div className={styles.headerRight}>
                    {/* @ts-expect-error Fluid DS v6 types mismatch */}
                    <NJTag variant={tagConfig.variant} scale="sm">
                      <NJIcon name={tagConfig.icon} />
                      {t(`contracts.types.${contract.type}`)}
                    </NJTag>
                    <StatusBadge status={contract.status} />
                  </div>
                </div>

                <NJAccordion>
                  <NJAccordionItem>
                    <NJAccordionItemHeader>{t('contracts.details', 'Détails du contrat')}</NJAccordionItemHeader>
                    <NJAccordionItemContent>
                      <div className={styles.cardDetails}>
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
                        <div className={styles.detail}>
                          <NJText scale="xs" variant="secondary">{t('contracts.startDate', 'Date de début')}</NJText>
                          <NJText>{new Date(contract.startDate).toLocaleDateString('fr-FR')}</NJText>
                        </div>
                      </div>
                    </NJAccordionItemContent>
                  </NJAccordionItem>
                </NJAccordion>
              </NJCardBody>
            </NJCard>
          );
        })}
      </div>
    </div>
  );
}
