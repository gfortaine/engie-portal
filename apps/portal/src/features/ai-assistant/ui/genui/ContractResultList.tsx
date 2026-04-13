import { useTranslation } from 'react-i18next';
import {
  NJCard,
  NJCardBody,
  NJBadge,
  NJTag,
  NJButton,
} from '@engie-group/fluid-design-system-react';

interface ContractResult {
  id: string;
  reference: string;
  type: string;
  status: string;
  address: string;
  startDate: string;
  monthlyAmount: number;
  meterNumber: string;
  endDate?: string;
}

const energyIcons: Record<string, string> = { electricity: '⚡', gas: '🔥', solar: '☀️' };
const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { active: 'success', pending: 'warning', terminated: 'neutral' } as const;

export function ContractResultList({ data }: { data: ContractResult[] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <NJCard className="genui-card">
        <NJCardBody>
          <p className="genui-empty">Aucun contrat trouvé pour cette recherche.</p>
        </NJCardBody>
      </NJCard>
    );
  }

  return (
    <div className="genui-contract-results">
      {data.map(contract => (
        <NJCard key={contract.id} className="genui-card genui-contract-result">
          <NJCardBody>
            <div className="genui-card__header">
              <div>
                <div className="genui-contract-result__top">
                  <NJTag
                    label={`${energyIcons[contract.type] ?? '🔋'} ${contract.type}`}
                  />
                  <NJBadge variant={statusVariant[contract.status] ?? 'neutral'}>
                    {t(`status.${contract.status}`, contract.status)}
                  </NJBadge>
                </div>
                <h4 className="genui-card__title">{contract.reference}</h4>
              </div>
              {contract.monthlyAmount > 0 && (
                <span className="genui-contract-result__amount">{contract.monthlyAmount.toFixed(2)} €/mois</span>
              )}
            </div>

            <div className="genui-contract-result__details">
              <span>📍 {contract.address}</span>
              <span>📊 {contract.meterNumber}</span>
              <span>📅 Depuis {contract.startDate}</span>
              {contract.endDate && <span>🔚 Fin: {contract.endDate}</span>}
            </div>

            <div className="genui-contract-result__actions">
              <NJButton
                // @ts-expect-error Fluid DS v6 types mismatch
                variant="subtle"
                size="sm"
                href={`/contracts`}
              >
                Voir détails →
              </NJButton>
            </div>
          </NJCardBody>
        </NJCard>
      ))}
    </div>
  );
}
