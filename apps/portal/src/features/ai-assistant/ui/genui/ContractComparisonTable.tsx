import { useTranslation } from 'react-i18next';
import {
  NJCard,
  NJCardBody,
  NJBadge,
  NJTag,
  NJDivider,
} from '@engie-group/fluid-design-system-react';

interface ContractComparison {
  id: string;
  reference: string;
  type: string;
  status: string;
  address: string;
  startDate: string;
  monthlyAmount: number;
  invoiceCount: number;
  totalSpent: number;
}

const energyIcons: Record<string, string> = { electricity: '⚡', gas: '🔥', solar: '☀️' };

export function ContractComparisonTable({ data }: { data: ContractComparison[] }) {
  const { t } = useTranslation();
  if (!Array.isArray(data)) return null;
  const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    active: 'success', pending: 'warning', terminated: 'neutral',
  } as const;

  return (
    <NJCard className="genui-card genui-comparison">
      <NJCardBody>
        <h4 className="genui-card__title">Comparaison de contrats</h4>
        <div className="genui-comparison__grid" style={{ gridTemplateColumns: `auto repeat(${data.length}, 1fr)` }}>
          {/* Header */}
          <div className="genui-comparison__header" />
          {data.map(c => (
            <div key={c.id} className="genui-comparison__header">
              <NJTag
                label={`${energyIcons[c.type] ?? '🔋'} ${c.type}`}
              />
              <span className="genui-comparison__ref">{c.reference}</span>
            </div>
          ))}

          {/* Status */}
          <div className="genui-comparison__label">Statut</div>
          {data.map(c => (
            <div key={`${c.id}-status`} className="genui-comparison__cell">
              <NJBadge variant={statusVariant[c.status] ?? 'neutral'}>
                {t(`status.${c.status}`, c.status)}
              </NJBadge>
            </div>
          ))}

          {/* Address */}
          <div className="genui-comparison__label">Adresse</div>
          {data.map(c => (
            <div key={`${c.id}-addr`} className="genui-comparison__cell">{c.address}</div>
          ))}

          {/* Monthly */}
          <div className="genui-comparison__label">Mensualité</div>
          {data.map(c => (
            <div key={`${c.id}-monthly`} className="genui-comparison__cell genui-comparison__amount">
              {c.monthlyAmount > 0 ? `${c.monthlyAmount.toFixed(2)} €/mois` : '—'}
            </div>
          ))}

          <NJDivider className="genui-comparison__divider" />

          {/* Total spent */}
          <div className="genui-comparison__label genui-comparison__label--highlight">Total facturé</div>
          {data.map(c => (
            <div key={`${c.id}-total`} className="genui-comparison__cell genui-comparison__total">
              {c.totalSpent.toFixed(2)} €
              <span className="genui-comparison__invoice-count">({c.invoiceCount} factures)</span>
            </div>
          ))}

          {/* Start date */}
          <div className="genui-comparison__label">Début</div>
          {data.map(c => (
            <div key={`${c.id}-start`} className="genui-comparison__cell">{c.startDate}</div>
          ))}
        </div>
      </NJCardBody>
    </NJCard>
  );
}
