import { NJBadge } from '@engie-group/fluid-design-system-react';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'information' }> = {
  active: { label: 'Actif', variant: 'success' },
  pending: { label: 'En attente', variant: 'warning' },
  terminated: { label: 'Résilié', variant: 'neutral' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'danger' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'neutral' as const };

  return (
    <NJBadge variant={config.variant} emphasis="subtle">
      {config.label}
    </NJBadge>
  );
}
