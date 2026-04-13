import styles from './StatusBadge.module.css';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Actif', className: styles.active ?? '' },
  pending: { label: 'En attente', className: styles.pending ?? '' },
  terminated: { label: 'Résilié', className: styles.terminated ?? '' },
  paid: { label: 'Payée', className: styles.paid ?? '' },
  overdue: { label: 'En retard', className: styles.overdue ?? '' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: '' };

  return (
    <span className={`${styles.badge} ${config.className}`}>
      {config.label}
    </span>
  );
}
