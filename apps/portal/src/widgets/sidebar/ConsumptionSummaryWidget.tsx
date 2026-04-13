import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/Card';
import styles from './ConsumptionSummaryWidget.module.css';

export function ConsumptionSummaryWidget() {
  const { t } = useTranslation();

  // Mock data for demo
  const data = {
    currentMonth: 342,
    previousMonth: 380,
    unit: 'kWh',
    percentChange: -10,
  };

  return (
    <Card className={styles.widget}>
      <h3 className={styles.title}>{t('dashboard.consumptionSummary')}</h3>
      <div className={styles.value}>
        {data.currentMonth.toLocaleString('fr-FR')} {data.unit}
      </div>
      <div className={styles.change}>
        <span className={data.percentChange < 0 ? styles.positive : styles.negative}>
          {data.percentChange < 0 ? '↓' : '↑'} {Math.abs(data.percentChange)}%
        </span>
        <span className={styles.changeLabel}>{t('dashboard.vsLastMonth')}</span>
      </div>
      <div className={styles.miniChart}>
        {[65, 72, 58, 80, 45, 62, 55, 48, 70, 42, 38, 35].map((h, i) => (
          <div key={i} className={styles.miniBar} style={{ height: `${h}%` }} />
        ))}
      </div>
    </Card>
  );
}
