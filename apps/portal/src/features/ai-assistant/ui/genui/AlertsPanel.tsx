import {
  NJCard,
  NJCardBody,
  NJInlineMessage,
  NJButton,
  NJDivider,
} from '@engie-group/fluid-design-system-react';

interface Alert {
  id: string;
  type: string;
  severity: 'danger' | 'warning' | 'info' | 'success';
  contractRef: string;
  message: string;
  date: string;
}

const severityIcons: Record<string, string> = {
  danger: '🚨',
  warning: '⚠️',
  info: 'ℹ️',
  success: '✅',
};

const severityToVariant: Record<string, string> = {
  danger: 'error',
  warning: 'warning',
  info: 'information',
  success: 'success',
};

export function AlertsPanel({ data }: { data: Alert[] }) {
  if (data.length === 0) {
    return (
      <NJCard className="genui-card">
        <NJCardBody>
          <NJInlineMessage variant="success">
            Aucune alerte active — tout est en ordre ! 🎉
          </NJInlineMessage>
        </NJCardBody>
      </NJCard>
    );
  }

  const sorted = [...data].sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2, success: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });

  return (
    <NJCard className="genui-card genui-alerts">
      <NJCardBody>
        <div className="genui-card__header">
          <h4 className="genui-card__title">Alertes & Notifications</h4>
          <span className="genui-alerts__count">{data.length} alerte{data.length > 1 ? 's' : ''}</span>
        </div>

        <div className="genui-alerts__list">
          {sorted.map((alert, i) => (
            <div key={alert.id}>
              {i > 0 && <NJDivider />}
              <NJInlineMessage
                // @ts-expect-error Fluid DS v6 types mismatch
                variant={severityToVariant[alert.severity] ?? 'information'}
              >
                <div className="genui-alert__content">
                  <div className="genui-alert__header">
                    <span>{severityIcons[alert.severity]} {alert.message}</span>
                  </div>
                  <div className="genui-alert__meta">
                    <span className="genui-alert__contract">{alert.contractRef}</span>
                    <span className="genui-alert__date">{alert.date}</span>
                  </div>
                  {alert.severity === 'danger' && (
                    // @ts-expect-error Fluid DS v6 types mismatch
                    <NJButton variant="subtle" size="sm">
                      Résoudre →
                    </NJButton>
                  )}
                </div>
              </NJInlineMessage>
            </div>
          ))}
        </div>
      </NJCardBody>
    </NJCard>
  );
}
