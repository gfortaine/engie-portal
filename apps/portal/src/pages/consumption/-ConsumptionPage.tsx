import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetConsumptionQuery } from '@/entities/meter';
import { NJCard, NJCardBody, NJDisplay, NJHeading, NJText, NJSelectRoot } from '@engie-group/fluid-design-system-react';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from './ConsumptionPage.module.css';

const PERIODS = ['2026-01', '2026-02', '2026-03', '2025-12', '2025-11', '2025-10'];

export function ConsumptionPage() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]!);

  const { data, isLoading } = useGetConsumptionQuery({
    contractId: 'ctr_001',
    period: selectedPeriod,
  });

  return (
    <div className={styles.page}>
      <NJDisplay scale="xs" as="h1">{t('consumption.title')}</NJDisplay>

      <div className={styles.controls}>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className={styles.periodSelect}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {new Date(`${p}-01`).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              })}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Skeleton height={400} />
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
                {data.points.map((point, i) => (
                  <div key={i} className={styles.bar}>
                    <div
                      className={styles.barFill}
                      style={{
                        height: `${(point.value / Math.max(...data.points.map((p) => p.value))) * 100}%`,
                      }}
                      title={`${point.date}: ${point.value} ${data.unit}`}
                    />
                    <span className={styles.barLabel}>
                      {new Date(point.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </NJCardBody>
          </NJCard>
        </div>
      ) : null}
    </div>
  );
}
