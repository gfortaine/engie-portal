import { useTranslation } from 'react-i18next';
import { NJBreadcrumb, NJBreadcrumbItem } from '@engie-group/fluid-design-system-react';
import { Link } from '@tanstack/react-router';

interface Crumb {
  label: string;
  to?: string;
}

interface PageBreadcrumbProps {
  items: Crumb[];
}

export function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  const { t } = useTranslation();
  return (
    <NJBreadcrumb aria-label={t('common.breadcrumb', 'Breadcrumb')}>
      {items.map((item, i) =>
        item.to ? (
          // @ts-expect-error Fluid DS v6 types mismatch
          <NJBreadcrumbItem key={i} asChild>
            <Link to={item.to}>{item.label}</Link>
          </NJBreadcrumbItem>
        ) : (
          <NJBreadcrumbItem key={i} aria-current="page">
            {item.label}
          </NJBreadcrumbItem>
        ),
      )}
    </NJBreadcrumb>
  );
}
