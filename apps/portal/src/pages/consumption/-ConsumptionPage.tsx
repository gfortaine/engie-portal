import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetConsumptionQuery } from '@/entities/meter';
import { NJCard, NJCardBody, NJDisplay, NJHeading, NJText, NJSelectRoot, NJSelectItem, NJProgress, NJTooltip, NJInlineMessage } from '@engie-group/fluid-design-system-react';
import { Skeleton } from '@/shared/ui/Skeleton';
import { PageBreadcrumb } from '@/shared/ui/PageBreadcrumb';
import styles from './ConsumptionPage.module.css';

const PERIODS = ['2026-01', '2026-02', '2026-03', '2025-12', '2025-11', '2025-10'];

function formatPeriod(p: string) {
  return new Date(`${p}-01`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

export function ConsumptionPage() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]!);

  const { data, isLoading, error } = useGetConsumptionQuery({
    contractId: 'ctr_001',
    period: selectedPeriod,
  });

  return (
    <div className={styles.page}>
      <PageBreadcrumb items={[{ label: t('nav.dashboard'), to: '/' }, { label: t('consumption.title') }]} />
      <NJDisplay scale="xs" as="h1">{t('consumption.title')}</NJDisplay>

      <div className={styles.controls}>
        {/* @ts-expect-error Fluid DS v6 types mismatch */}
        <NJSelectRoot
          id="period-select"
          label={t('consumption.period', 'Période')}
          value={selectedPeriod}
          // @ts-expect-error Fluid DS v6 types mismatch
          onChange={(v) => v && setSelectedPeriod(v)}
        >
          {PERIODS.map((p) => (
            <NJSelectItem key={p} value={p}>
              {formatPeriod(p)}
            </NJSelectItem>
          ))}
        </NJSelectRoot>
      </div>

      {isLoading ? (
        <Skeleton height={400} />
      ) : error ? (
        // @ts-expect-error Fluid DS v6 types mismatch
        <NJInlineMessage variant="danger">
          {t('errors.loadFailed')}
        </NJInlineMessage>
      ) : data ? (
        <div className={styles.content}>
          <NJCard>
            <NJCardBody>
              <div className={styles.totalConsumption}>
                <NJText scale="sm" variant="secondary">{t('consumption.total')}</NJText>
                <span className={styles.totalValue}>
                  {data.total.toLocaleString('fr-FR')} {data.unit}
                </span>
                {data.comparisonPeriod && (
                  <span
                    className={
                      data.comparisonPeriod.percentChange > 0
                        ? styles.changeUp
                        : styles.changeDown
                    }
                  >
                    {data.comparisonPeriod.percentChange > 0 ? '↑' : '↓'}{' '}
                    {Math.abs(data.comparisonPeriod.percentChange)}%{' '}
                    {t('consumption.vsPreviousPeriod')}
                  </span>
                )}
              </div>
            </NJCardBody>
          </NJCard>

          <NJCard>
            <NJCardBody>
              <NJHeading scale="xs">{t('consumption.dailyBreakdown')}</NJHeading>
              <div className={styles.chart}>
                {(() => {
                  const maxVal = Math.max(...data.points.map((p) => p.value));
                  return data.points.map((point, i) => (
                    <div key={i} className={styles.bar}>
                      {/* @ts-expect-error Fluid DS v6 types mismatch */}
                      <NJTooltip label={`${new Date(point.date).toLocaleDateString('fr-FR')}: ${point.value} ${data.unit}`}>
                        <div
                          className={styles.barFill}
                          style={{ height: `${(point.value / maxVal) * 100}%` }}
                        />
                      </NJTooltip>
                      <span className={styles.barLabel}>
                        {new Date(point.date).getDate()}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </NJCardBody>
          </NJCard>

          <NJCard>
            <NJCardBody>
              <NJHeading scale="xs">{t('consumption.monthlyGoal', 'Objectif mensuel')}</NJHeading>
              <NJProgress
                value={Math.round((data.total / 500) * 100)}
                description={`${data.total} / 500 ${data.unit}`}
                subscriptMessage={
                  data.total <= 500
                    ? t('consumption.onTrack', 'Vous êtes dans les limites')
                    : t('consumption.overBudget', 'Objectif dépassé')
                }
                // @ts-expect-error Fluid DS v6 types mismatch
                variant={data.total <= 500 ? 'brand' : 'danger'}
              />
            </NJCardBody>
          </NJCard>
        </div>
      ) : null}
    </div>
  );
}
