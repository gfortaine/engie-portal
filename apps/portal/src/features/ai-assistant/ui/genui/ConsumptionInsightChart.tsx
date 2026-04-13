import {
  NJCard,
  NJCardBody,
  NJBadge,
  NJTag,
  NJProgress,
  NJDivider,
} from '@engie-group/fluid-design-system-react';

interface MonthlyData {
  month: string;
  value: number;
}

interface ConsumptionData {
  contractRef: string;
  type: string;
  unit: string;
  currentMonth: { period: string; total: number; dailyAvg: number };
  previousMonth: { period: string; total: number; dailyAvg: number };
  yearOverYear: { currentYear: number; previousYear: number; changePercent: number };
  trend: 'increasing' | 'decreasing' | 'stable';
  peakHours: { percentage: number; recommendation: string } | null;
  monthlyData: MonthlyData[];
}

const trendIcons: Record<string, string> = { increasing: '📈', decreasing: '📉', stable: '➡️' };
const trendColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { increasing: 'danger', decreasing: 'success', stable: 'neutral' } as const;

export function ConsumptionInsightChart({ data }: { data: ConsumptionData }) {
  const change = data.currentMonth.total - data.previousMonth.total;
  const changePercent = ((change / data.previousMonth.total) * 100).toFixed(1);
  const maxVal = Math.max(...data.monthlyData.map(d => d.value));

  return (
    <NJCard className="genui-card genui-consumption">
      <NJCardBody>
        <div className="genui-card__header">
          <div>
            <h4 className="genui-card__title">Analyse de consommation</h4>
            <span className="genui-card__subtitle">{data.contractRef}</span>
          </div>
          <NJBadge variant={trendColors[data.trend] ?? 'neutral'}>
            {trendIcons[data.trend]} {data.trend === 'increasing' ? 'En hausse' : data.trend === 'decreasing' ? 'En baisse' : 'Stable'}
          </NJBadge>
        </div>

        {/* KPI Row */}
        <div className="genui-consumption__kpis">
          <div className="genui-consumption__kpi">
            <span className="genui-consumption__kpi-value">{data.currentMonth.total}</span>
            <span className="genui-consumption__kpi-unit">{data.unit}</span>
            <span className="genui-consumption__kpi-label">{data.currentMonth.period}</span>
          </div>
          <div className="genui-consumption__kpi genui-consumption__kpi--delta">
            <span className={`genui-consumption__kpi-value ${change > 0 ? 'genui--danger' : 'genui--success'}`}>
              {change > 0 ? '+' : ''}{changePercent}%
            </span>
            <span className="genui-consumption__kpi-label">vs {data.previousMonth.period}</span>
          </div>
          <div className="genui-consumption__kpi">
            <span className="genui-consumption__kpi-value">{data.currentMonth.dailyAvg}</span>
            <span className="genui-consumption__kpi-unit">{data.unit}/j</span>
            <span className="genui-consumption__kpi-label">Moyenne quotidienne</span>
          </div>
        </div>

        <NJDivider />

        {/* Mini bar chart */}
        <div className="genui-consumption__chart">
          {data.monthlyData.map(d => (
            <div key={d.month} className="genui-consumption__bar-col">
              <div
                className="genui-consumption__bar"
                style={{ height: `${(d.value / maxVal) * 80}px`, backgroundColor: 'var(--nj-color-brand-primary)' }}
              />
              <span className="genui-consumption__bar-label">{d.month}</span>
              <span className="genui-consumption__bar-value">{d.value} {data.unit}</span>
            </div>
          ))}
        </div>

        {/* Peak Hours */}
        {data.peakHours && (
          <>
            <NJDivider />
            <div className="genui-consumption__peak">
              <div className="genui-consumption__peak-header">
                <NJTag
                  label="⏰ Heures de pointe"
                />
                <span>{data.peakHours.percentage}% de votre consommation</span>
              </div>
              <NJProgress
                value={data.peakHours.percentage}
                // @ts-expect-error Fluid DS v6 types mismatch
                variant={data.peakHours.percentage > 40 ? 'danger' : 'brand'}
                aria-label="Heures de pointe"
              />
              <p className="genui-consumption__tip">💡 {data.peakHours.recommendation}</p>
            </div>
          </>
        )}

        {/* Year over Year */}
        <NJDivider />
        <div className="genui-consumption__yoy">
          <span>Annuel: {data.yearOverYear.currentYear} vs {data.yearOverYear.previousYear} {data.unit}</span>
          <NJBadge variant={data.yearOverYear.changePercent > 0 ? 'danger' : 'success'}>
            {data.yearOverYear.changePercent > 0 ? '+' : ''}{data.yearOverYear.changePercent}%
          </NJBadge>
        </div>
      </NJCardBody>
    </NJCard>
  );
}
