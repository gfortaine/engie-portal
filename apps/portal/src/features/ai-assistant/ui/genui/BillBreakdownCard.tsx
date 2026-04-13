import { useTranslation } from 'react-i18next';
import {
  NJCard,
  NJCardBody,
  NJTag,
  NJProgress,
  NJTooltip,
  NJDivider,
  NJBadge,
} from '@engie-group/fluid-design-system-react';

interface BillBreakdown {
  reference: string;
  period: string;
  amount: number;
  status: string;
  contractRef: string;
  contractType: string;
  address: string;
  tariff: string;
  pricePerUnit: string;
  breakdown: {
    consumption: number;
    subscription: number;
    taxes: number;
  };
  issueDate: string;
  dueDate: string;
}

export function BillBreakdownCard({ data }: { data: BillBreakdown }) {
  const { t } = useTranslation();
  const total = data.amount;
  const items = [
    { label: 'Consommation', value: data.breakdown.consumption, color: 'var(--nj-color-brand-primary)' },
    { label: 'Abonnement', value: data.breakdown.subscription, color: 'var(--nj-color-palette-ultramarine-500)' },
    { label: 'Taxes & contributions', value: data.breakdown.taxes, color: 'var(--nj-color-palette-grey-500)' },
  ];

  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    paid: 'success',
    pending: 'warning',
    overdue: 'danger',
  } as const;

  return (
    <NJCard className="genui-card genui-bill-breakdown">
      <NJCardBody>
        <div className="genui-card__header">
          <div>
            <h4 className="genui-card__title">{data.reference}</h4>
            <span className="genui-card__subtitle">{data.period} — {data.address}</span>
          </div>
          <NJBadge variant={statusVariant[data.status] ?? 'neutral'}>
            {t(`status.${data.status}`, data.status)}
          </NJBadge>
        </div>

        <div className="genui-bill__total">
          <span className="genui-bill__amount">{data.amount.toFixed(2)} €</span>
          <span className="genui-bill__tariff">{data.tariff} — {data.pricePerUnit}</span>
        </div>

        <NJDivider />

        <div className="genui-bill__breakdown">
          {items.map(item => (
            <div key={item.label} className="genui-bill__row">
              <div className="genui-bill__row-label">
                <span className="genui-bill__dot" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
              <div className="genui-bill__row-bar">
                <NJProgress
                  value={Math.round((item.value / total) * 100)}
                  // @ts-expect-error Fluid DS v6 types mismatch
                  variant="brand"
                  aria-label={item.label}
                />
              </div>
              <span className="genui-bill__row-value">{item.value.toFixed(2)} €</span>
            </div>
          ))}
        </div>

        <NJDivider />

        <div className="genui-bill__footer">
          <NJTag
            label={data.contractType === 'electricity' ? '⚡ Électricité' : data.contractType === 'gas' ? '🔥 Gaz' : '☀️ Solaire'}
          />
          <div className="genui-bill__dates">
            <NJTooltip
              // @ts-expect-error Fluid DS v6 types mismatch
              label={`Émise le ${data.issueDate}`}
            >
              <span>📅 Échéance: {data.dueDate}</span>
            </NJTooltip>
          </div>
        </div>
      </NJCardBody>
    </NJCard>
  );
}
