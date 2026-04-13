import {
  NJCard,
  NJCardBody,
  NJTag,
  NJProgress,
  NJButton,
  NJDivider,
  NJIcon,
} from '@engie-group/fluid-design-system-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  potentialSaving: string;
  impactEuros: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface SavingsData {
  contractRef: string;
  energyType: string;
  totalPotentialSaving: number;
  recommendations: Recommendation[];
}

const difficultyLabels: Record<string, string> = { easy: '🟢 Facile', medium: '🟡 Moyen', hard: '🔴 Difficile' };
const difficultyVariant: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' };
const categoryIcons: Record<string, string> = { comportement: '🧠', équipement: '🔧', travaux: '🏠' };

export function SavingsRecommendation({ data }: { data: SavingsData }) {
  return (
    <NJCard className="genui-card genui-savings">
      <NJCardBody>
        <div className="genui-card__header">
          <div>
            <h4 className="genui-card__title">💰 Économies potentielles</h4>
            <span className="genui-card__subtitle">{data.contractRef}</span>
          </div>
          <div className="genui-savings__total">
            <span className="genui-savings__total-value">-{data.totalPotentialSaving.toFixed(2)} €</span>
            <span className="genui-savings__total-label">/mois possible</span>
          </div>
        </div>

        <NJDivider />

        <div className="genui-savings__list">
          {data.recommendations.map((rec, i) => (
            <div key={rec.id} className="genui-savings__item">
              {i > 0 && <NJDivider />}
              <div className="genui-savings__item-header">
                <div className="genui-savings__item-title">
                  <span>{categoryIcons[rec.category] ?? '💡'}</span>
                  <strong>{rec.title}</strong>
                </div>
                <div className="genui-savings__item-tags">
                  <NJTag
                    // @ts-expect-error Fluid DS v6 types mismatch
                    label={difficultyLabels[rec.difficulty]}
                  />
                </div>
              </div>

              <p className="genui-savings__description">{rec.description}</p>

              <div className="genui-savings__impact">
                <div className="genui-savings__impact-bar">
                  <NJProgress
                    value={parseInt(rec.potentialSaving)}
                    // @ts-expect-error Fluid DS v6 types mismatch
                    variant="brand"
                    aria-label={`Économie de ${rec.potentialSaving}`}
                  />
                </div>
                <span className="genui-savings__impact-value">
                  -{rec.impactEuros.toFixed(2)} €/mois ({rec.potentialSaving})
                </span>
              </div>

              <NJButton
                // @ts-expect-error Fluid DS v6 types: "subtle" variant exists at runtime
                variant="subtle"
                size="sm"
              >
                <NJIcon
                  name="arrow_forward"
                  // @ts-expect-error Fluid DS v6 types: size prop exists at runtime
                  size="16"
                /> En savoir plus
              </NJButton>
            </div>
          ))}
        </div>
      </NJCardBody>
    </NJCard>
  );
}
