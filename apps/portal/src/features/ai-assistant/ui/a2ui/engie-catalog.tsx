/**
 * ENGIE Fluid Design System Catalog for A2UI v0.9
 *
 * Maps A2UI component types to Fluid DS React components,
 * allowing Gemini to generate native ENGIE-branded UI.
 */
import { createReactComponent } from '@a2ui/react/v0_9';
import type { ReactComponentImplementation } from '@a2ui/react/v0_9';
import { Catalog } from '@a2ui/web_core/v0_9';
import { z } from 'zod';
import {
  NJCard,
  NJCardBody,
  NJBadge,
  NJTag,
  NJProgress,
  NJDivider,
  NJInlineMessage,
  NJIcon,
  NJButton,
} from '@engie-group/fluid-design-system-react';

// ── Schemas (static values — no data binding needed) ─────────────────

const FluidCardSchema = z.object({
  title: z.string().optional(),
  children: z.array(z.string()),
});

const FluidBadgeSchema = z.object({
  label: z.string(),
  variant: z.string().optional(),
});

const FluidTagSchema = z.object({
  label: z.string(),
  variant: z.string().optional(),
});

const FluidProgressSchema = z.object({
  value: z.number(),
  max: z.number().optional(),
  label: z.string().optional(),
});

const FluidAlertSchema = z.object({
  message: z.string(),
  severity: z.string().optional(),
});

const FluidButtonSchema = z.object({
  label: z.string(),
  variant: z.string().optional(),
});

const FluidIconSchema = z.object({
  name: z.string(),
});

const FluidDividerSchema = z.object({});

const FluidTextSchema = z.object({
  text: z.string(),
  variant: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'body', 'caption']).optional(),
});

const FluidRowSchema = z.object({
  children: z.array(z.string()),
  gap: z.string().optional(),
});

const FluidColumnSchema = z.object({
  children: z.array(z.string()),
  gap: z.string().optional(),
});

// ── Component Implementations ────────────────────────────────────────

const FluidCard = createReactComponent(
  { name: 'FluidCard', schema: FluidCardSchema },
  ({ props, buildChild }) => (
    <NJCard>
      {props.title && (
        <div className="nj-card__title" style={{ padding: '16px 16px 0' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{props.title}</h3>
        </div>
      )}
      <NJCardBody>
        <ChildList childList={props.children} buildChild={buildChild} />
      </NJCardBody>
    </NJCard>
  ),
);

// Map A2UI variant names → Fluid DS variant names
const BADGE_VARIANT_MAP: Record<string, string> = {
  primary: 'neutral', success: 'success', warning: 'warning',
  danger: 'danger', info: 'information', dark: 'neutral',
  neutral: 'neutral', information: 'information', discovery: 'discovery',
};
const TAG_VARIANT_MAP: Record<string, string> = {
  primary: 'brand', success: 'green', warning: 'orange',
  danger: 'red', info: 'blue', brand: 'brand', grey: 'grey',
  blue: 'blue', teal: 'teal', green: 'green',
};
const ALERT_VARIANT_MAP: Record<string, string> = {
  info: 'information', success: 'success', warning: 'warning',
  danger: 'error', error: 'error', information: 'information',
};

const FluidBadge = createReactComponent(
  { name: 'FluidBadge', schema: FluidBadgeSchema },
  ({ props }) => {
    const v = BADGE_VARIANT_MAP[String(props.variant ?? '')] ?? 'neutral';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <NJBadge variant={v as any}>{String(props.label ?? '')}</NJBadge>;
  },
);

const FluidTag = createReactComponent(
  { name: 'FluidTag', schema: FluidTagSchema },
  ({ props }) => {
    const v = TAG_VARIANT_MAP[String(props.variant ?? '')] ?? 'brand';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <NJTag label={String(props.label ?? '')} variant={v as any} />;
  },
);

const FluidProgress = createReactComponent(
  { name: 'FluidProgress', schema: FluidProgressSchema },
  ({ props }) => (
    <div style={{ width: '100%' }}>
      {props.label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
          <span>{props.label}</span>
          <span style={{ fontWeight: 600 }}>{props.value ?? 0}%</span>
        </div>
      )}
      <NJProgress value={props.value ?? 0} max={props.max ?? 100} />
    </div>
  ),
);

const FluidAlert = createReactComponent(
  { name: 'FluidAlert', schema: FluidAlertSchema },
  ({ props }) => {
    const v = ALERT_VARIANT_MAP[String(props.severity ?? '')] ?? 'information';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <NJInlineMessage variant={v as any}>{String(props.message ?? '')}</NJInlineMessage>;
  },
);

const FluidButton = createReactComponent(
  { name: 'FluidButton', schema: FluidButtonSchema },
  ({ props }) => {
    const v = props.variant === 'secondary' ? 'secondary' : 'primary';
    return <NJButton label={String(props.label ?? '')} variant={v} />;
  },
);

const FluidIcon = createReactComponent(
  { name: 'FluidIcon', schema: FluidIconSchema },
  ({ props }) => (
    <NJIcon name={props.name ?? 'info'} />
  ),
);

const FluidDivider = createReactComponent(
  { name: 'FluidDivider', schema: FluidDividerSchema },
  () => <NJDivider />,
);

const FluidText = createReactComponent(
  { name: 'FluidText', schema: FluidTextSchema },
  ({ props }) => {
    const text = props.text ?? '';
    switch (props.variant) {
      case 'h1': return <h1 style={{ margin: '0.4rem 0', fontSize: '1.25rem', fontWeight: 700 }}>{text}</h1>;
      case 'h2': return <h2 style={{ margin: '0.3rem 0', fontSize: '1.1rem', fontWeight: 600 }}>{text}</h2>;
      case 'h3': return <h3 style={{ margin: '0.2rem 0', fontSize: '1rem', fontWeight: 600 }}>{text}</h3>;
      case 'h4': return <h4 style={{ margin: '0.2rem 0', fontSize: '0.9rem', fontWeight: 600 }}>{text}</h4>;
      case 'h5': return <h5 style={{ margin: '0.1rem 0', fontSize: '0.85rem', fontWeight: 600 }}>{text}</h5>;
      case 'caption': return <small style={{ color: '#666', fontSize: '0.8rem' }}>{text}</small>;
      default: return <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', lineHeight: 1.5 }}>{text}</p>;
    }
  },
);

const FluidRow = createReactComponent(
  { name: 'FluidRow', schema: FluidRowSchema },
  ({ props, buildChild }) => (
    <div style={{ display: 'flex', flexDirection: 'row', gap: props.gap ?? '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <ChildList childList={props.children} buildChild={buildChild} />
    </div>
  ),
);

const FluidColumn = createReactComponent(
  { name: 'FluidColumn', schema: FluidColumnSchema },
  ({ props, buildChild }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: props.gap ?? '8px' }}>
      <ChildList childList={props.children} buildChild={buildChild} />
    </div>
  ),
);

// ── ChildList helper ─────────────────────────────────────────────────

function ChildList({ childList, buildChild }: {
  childList: unknown;
  buildChild: (id: string, basePath?: string) => React.ReactNode;
}) {
  if (!Array.isArray(childList)) return null;
  return (
    <>
      {childList.map((item: unknown, i: number) => {
        if (item && typeof item === 'object' && 'id' in item) {
          const node = item as { id: string; basePath?: string };
          return <span key={`${node.id}-${i}`}>{buildChild(node.id, node.basePath)}</span>;
        }
        if (typeof item === 'string') {
          return <span key={`${item}-${i}`}>{buildChild(item)}</span>;
        }
        return null;
      })}
    </>
  );
}

// ── ENGIE Catalog ────────────────────────────────────────────────────

const engieCatalogComponents: ReactComponentImplementation[] = [
  FluidCard,
  FluidBadge,
  FluidTag,
  FluidProgress,
  FluidAlert,
  FluidButton,
  FluidIcon,
  FluidDivider,
  FluidText,
  FluidRow,
  FluidColumn,
];

export const engieCatalog = new Catalog<ReactComponentImplementation>(
  'https://engie.design/fluid/a2ui/1.0',
  engieCatalogComponents,
);

export const ENGIE_CATALOG_ID = 'https://engie.design/fluid/a2ui/1.0';
