import { Link, useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  NJSidebarRoot,
  NJSidebarHeader,
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

function SidebarLogo() {
  return (
    <svg viewBox="0 0 130 28" width="130" height="28" aria-label="ENGIE">
      <defs>
        <linearGradient id="sidebar-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00aaff" />
          <stop offset="100%" stopColor="#23d2b5" />
        </linearGradient>
      </defs>
      <rect width="130" height="2.5" rx="1.25" fill="url(#sidebar-grad)" />
      <text x="0" y="22" fill="#182663" fontFamily="Lato, sans-serif" fontWeight="900" fontSize="18" letterSpacing="1.5">
        ENGIE
      </text>
      <text x="72" y="22" fill="#007acd" fontFamily="Lato, sans-serif" fontWeight="400" fontSize="11">
        Portal
      </text>
    </svg>
  );
}

function SidebarLogoCollapsed() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" aria-label="ENGIE">
      <defs>
        <linearGradient id="sidebar-grad-sm" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00aaff" />
          <stop offset="100%" stopColor="#23d2b5" />
        </linearGradient>
      </defs>
      <rect width="28" height="2.5" rx="1.25" fill="url(#sidebar-grad-sm)" />
      <text x="2" y="22" fill="#182663" fontFamily="Lato, sans-serif" fontWeight="900" fontSize="14" letterSpacing="0.5">
        E
      </text>
    </svg>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();

  return (
    <NJSidebarRoot>
      <NJSidebarHeader
        logo={<SidebarLogo />}
        logoCollapsed={<SidebarLogoCollapsed />}
      />

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
