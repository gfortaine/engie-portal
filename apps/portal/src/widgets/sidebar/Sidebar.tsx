import { Link, useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  NJSidebarRoot,
  NJSidebarGroup,
  NJSidebarItem,
  NJSidebarDivider,
  NJSidebarSpacer,
  NJSidebarCollapseItem,
  NJSidebarCollapseIcon,
  NJText,
} from '@engie-group/fluid-design-system-react';

const NAV_ITEMS = [
  { path: '/' as const, icon: 'dashboard', labelKey: 'nav.dashboard' },
  { path: '/contracts' as const, icon: 'description', labelKey: 'nav.contracts' },
  { path: '/invoices' as const, icon: 'receipt_long', labelKey: 'nav.invoices' },
  { path: '/consumption' as const, icon: 'bolt', labelKey: 'nav.consumption' },
];

const SECONDARY_ITEMS = [
  { path: '/profile' as const, icon: 'person', labelKey: 'nav.profile' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();

  return (
    <NJSidebarRoot>
      <NJSidebarGroup aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = Boolean(matchRoute({ to: item.path, fuzzy: item.path !== '/' }));
          return (
            <NJSidebarItem
              key={item.path}
              leadingIcon={item.icon}
              selected={isActive}
              asChild
            >
              <Link to={item.path}>
                {t(item.labelKey)}
              </Link>
            </NJSidebarItem>
          );
        })}
      </NJSidebarGroup>

      <NJSidebarDivider />

      <NJSidebarGroup aria-label="Account">
        {SECONDARY_ITEMS.map((item) => {
          const isActive = Boolean(matchRoute({ to: item.path, fuzzy: true }));
          return (
            <NJSidebarItem
              key={item.path}
              leadingIcon={item.icon}
              selected={isActive}
              asChild
            >
              <Link to={item.path}>
                {t(item.labelKey)}
              </Link>
            </NJSidebarItem>
          );
        })}
      </NJSidebarGroup>

      <NJSidebarSpacer />

      <NJSidebarGroup aria-label="Controls">
        <NJSidebarCollapseItem leading={<NJSidebarCollapseIcon />}>
          {t('nav.collapse', 'Collapse')}
        </NJSidebarCollapseItem>
      </NJSidebarGroup>

      <div style={{ padding: '0.5rem 1rem' }}>
        <NJText scale="xs" variant="tertiary">v0.1.0</NJText>
      </div>
    </NJSidebarRoot>
  );
}
