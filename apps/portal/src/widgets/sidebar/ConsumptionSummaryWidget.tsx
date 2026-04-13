import { useTranslation } from 'react-i18next';
import { NJCard, NJCardBody, NJHeading, NJText, NJTooltip } from '@engie-group/fluid-design-system-react';
import styles from './ConsumptionSummaryWidget.module.css';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const CONSUMPTION_DATA = [420, 465, 380, 510, 295, 400, 360, 310, 450, 275, 250, 230];

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
        {/* @ts-expect-error Fluid DS v6 types mismatch */}
        <NJTooltip label={t('dashboard.currentMonthUsage', 'Consommation du mois en cours')}>
          <div className={styles.value}>
            {data.currentMonth.toLocaleString('fr-FR')} {data.unit}
          </div>
        </NJTooltip>
        <div className={styles.change}>
          <span className={data.percentChange < 0 ? styles.positive : styles.negative}>
            {data.percentChange < 0 ? '↓' : '↑'} {Math.abs(data.percentChange)}%
          </span>
          <NJText scale="xs" variant="secondary">{t('dashboard.vsLastMonth')}</NJText>
        </div>
        <div className={styles.miniChart}>
          {CONSUMPTION_DATA.map((kWh, i) => {
            const pct = Math.round((kWh / Math.max(...CONSUMPTION_DATA)) * 100);
            return (
              // @ts-expect-error Fluid DS v6 types mismatch
              <NJTooltip key={i} label={`${MONTHS[i]} : ${kWh} kWh`}>
                <div className={styles.miniBar} style={{ height: `${pct}%` }} />
              </NJTooltip>
            );
          })}
        </div>
      </NJCardBody>
    </NJCard>
  );
}
