import { useTranslation } from 'react-i18next';
import { NJCard, NJCardBody, NJHeading, NJText } from '@engie-group/fluid-design-system-react';
import styles from './ConsumptionSummaryWidget.module.css';

export function ConsumptionSummaryWidget() {
  const { t } = useTranslation();

  const data = {
    currentMonth: 342,
    previousMonth: 380,
    unit: 'kWh',
    percentChange: -10,
  };

  return (
    <NJCard>
      <NJCardBody>
        <NJHeading scale="xs">{t('dashboard.consumptionSummary')}</NJHeading>
        <div className={styles.value}>
          {data.currentMonth.toLocaleString('fr-FR')} {data.unit}
        </div>
        <div className={styles.change}>
          <span className={data.percentChange < 0 ? styles.positive : styles.negative}>
            {data.percentChange < 0 ? '↓' : '↑'} {Math.abs(data.percentChange)}%
          </span>
          <NJText scale="xs" variant="secondary">{t('dashboard.vsLastMonth')}</NJText>
        </div>
        <div className={styles.miniChart}>
          {[65, 72, 58, 80, 45, 62, 55, 48, 70, 42, 38, 35].map((h, i) => (
            <div key={i} className={styles.miniBar} style={{ height: `${h}%` }} />
          ))}
        </div>
      </NJCardBody>
    </NJCard>
  );
}
