import type { ReactNode } from 'react';
import { NJCard, NJCardBody } from '@engie-group/fluid-design-system-react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'error';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  if (variant === 'error') {
    return (
      <div className={`${styles.errorCard} ${className ?? ''}`}>
        {children}
      </div>
    );
  }

  return (
    <NJCard className={className}>
      <NJCardBody>{children}</NJCardBody>
    </NJCard>
  );
}
