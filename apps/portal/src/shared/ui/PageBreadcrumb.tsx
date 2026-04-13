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
  return (
    <NJBreadcrumb aria-label="Fil d'Ariane">
      {items.map((item, i) =>
        item.to ? (
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
