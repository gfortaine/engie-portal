import { useTranslation } from 'react-i18next';
import { NJBadge } from '@engie-group/fluid-design-system-react';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'information'> = {
  active: 'success',
  pending: 'warning',
  terminated: 'neutral',
  paid: 'success',
  overdue: 'danger',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const variant = STATUS_VARIANT[status] ?? 'neutral';

  return (
    <NJBadge variant={variant} emphasis="subtle">
      {t(`status.${status}`, status)}
    </NJBadge>
  );
}
