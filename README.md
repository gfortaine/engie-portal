# ENGIE Customer Portal

[![CI](https://github.com/gfortaine/engie-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/gfortaine/engie-portal/actions/workflows/ci.yml)
[![Deploy](https://github.com/gfortaine/engie-portal/actions/workflows/deploy.yml/badge.svg)](https://github.com/gfortaine/engie-portal/actions/workflows/deploy.yml)

> Enterprise customer portal for ENGIE's Sales-to-Cash modernization program. React 19 SPA with type-safe BFF, built on ENGIE's official Fluid Design System.

🔗 **[Live Demo](https://engie-portal-fortaine.vercel.app)** · 📐 **[Fluid Design System](https://www.engie.design/fluid-design-system/)**

---

## Architecture

```
  engie-portal-fortaine.vercel.app (FORTAINE Software — Pro)
┌──────────────────────────────────────────────────────────────┐
│                     Single Vercel Project                     │
│  ┌────────────────────────┐    ┌─────────────────────────┐   │
│  │  Static SPA (Vite)     │    │  Serverless Functions   │   │
│  │  React 19 + Redux TK  │    │  tRPC v11 BFF           │   │
│  │  TanStack Router       │    │  @vercel/node           │   │
│  │  Fluid Design System   │────│  Mock Data Layer        │   │
│  │  RTK Query + tRPC      │    │  /api/trpc/*            │   │
│  │  i18n (FR/EN)          │    └─────────────────────────┘   │
│  └────────────────────────┘                                  │
│           /                                                  │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **UI Framework** | React 19 | Latest concurrent features, use() hook |
| **State** | Redux Toolkit 2.x + RTK Query | Enterprise-grade, middleware ecosystem, cache management |
| **Routing** | TanStack Router v1 | Type-safe file-based routing, loader pattern |
| **BFF** | tRPC v11 | End-to-end type safety front↔BFF, zero codegen |
| **Design System** | [Fluid DS v6](https://www.engie.design/) | Official ENGIE design system — 100+ React components |
| **Bundler** | Vite 6 | Sub-second HMR, ESM-native |
| **Tests** | Vitest + RTL + Playwright | Unit (24) + E2E (16) |
| **Monorepo** | pnpm 10 + Turborepo | Workspace protocol, parallel builds, caching |
| **Architecture** | Feature-Sliced Design (FSD) | Scalable layer-based architecture with boundary rules |
| **i18n** | i18next + LanguageDetector | FR/EN, runtime language switching |
| **Auth** | oidc-client-ts + react-oidc-context | OpenID Connect ready (mock for demo) |
| **CI/CD** | GitHub Actions + Vercel | CI checks → automatic preview + production deploys |

## Project Structure

```
engie-portal/
├── apps/portal/                    # React SPA
│   └── src/
│       ├── app/                    # Providers, router, global styles
│       ├── pages/                  # Route-level composites (FSD layer 2)
│       │   ├── dashboard/
│       │   ├── contracts/
│       │   ├── invoices/
│       │   ├── consumption/
│       │   └── profile/
│       ├── widgets/                # Composed layout blocks (FSD layer 3)
│       │   ├── header/             # NJHeader + logout modal
│       │   ├── sidebar/            # NJSidebarRoot + navigation
│       │   ├── layout/             # AppLayout + NJFooter
│       │   └── contract-overview/  # Dashboard widget
│       ├── features/               # User interactions (FSD layer 4)
│       │   └── auth/               # Auth slice + OIDC context
│       ├── entities/               # Domain models (FSD layer 5)
│       │   ├── contract/           # RTK Query endpoints
│       │   ├── invoice/
│       │   └── meter/
│       └── shared/                 # Base API, UI, hooks (FSD layer 6)
│           ├── api/                # tRPC client + RTK base query
│           └── ui/                 # Card, StatusBadge, Skeleton, Breadcrumb
├── services/bff/                   # tRPC v11 BFF server
│   └── src/
│       ├── routers/                # contract, invoice, consumption
│       ├── mocks/                  # Mock data (demo mode)
│       ├── middleware/             # Auth extraction
│       └── trpc.ts                 # Router + procedure definitions
├── packages/
│   ├── api-client/                 # AppRouter type re-export
│   ├── i18n/                       # Shared translations (FR/EN)
│   ├── ui/                         # Shared UI primitives
│   ├── utils/                      # Shared utilities
│   └── config/                     # Shared TS config
├── api/trpc/[trpc].ts              # Vercel serverless function
├── vercel.json                     # Deployment config
└── turbo.json                      # Turborepo pipeline
```

## Key Architectural Decisions

### Why tRPC over NestJS for the BFF?

The BFF is a **thin type-safe proxy** between the React frontend and Java microservices (Spring Boot). It doesn't own business logic — it aggregates, transforms, and caches data from downstream APIs.

| Criterion | tRPC v11 | NestJS |
|-----------|----------|--------|
| **Type safety** | End-to-end, zero codegen | Manual DTOs or OpenAPI codegen |
| **Bundle size** | ~15KB (server) | ~300KB+ (50+ deps) |
| **Cold start** | < 100ms | 500ms–2s (DI container) |
| **Serverless fit** | Native (fetch adapter) | Requires adapter + warm-up |
| **BFF suitability** | Perfect for thin proxy | Overkill for 3 CRUD endpoints |
| **Team fit** | React devs write BFF natively | Separate backend paradigm |

NestJS would be the right choice for a **complex backend** with DI, guards, interceptors, and ORM integration. For a BFF that proxies Java services, tRPC's type safety and minimal footprint are the better trade-off.

### Why Feature-Sliced Design?

FSD provides **enforced architectural boundaries** in a large React app:

- **Layer imports are one-way** — `pages → widgets → features → entities → shared`
- **ESLint boundary rules** prevent cross-layer violations at CI time
- **Each feature is self-contained** — slice includes model, UI, API, and tests
- **Scales with team size** — 4 devs can work on separate features without conflicts

### Why RTK Query over TanStack Query?

For an enterprise portal with **complex state interactions** (auth, contract selection, consumption filters):

- **Single store** — RTK Query cache lives alongside auth/UI state in Redux
- **Middleware ecosystem** — `listenerMiddleware` for cross-feature side effects
- **DevTools** — Redux DevTools shows API cache + app state in one timeline
- **Enterprise adoption** — well-known pattern for 4-dev teams at ENGIE scale

### Why ENGIE Fluid Design System?

Using the **official** `@engie-group/fluid-design-system-react` v6 (27+ components):

- **Brand consistency** — official ENGIE colors, typography, spacing tokens
- **1,789 CSS variables** — comprehensive design token system
- **React 19 compatible** — declared `react@^19.0.0` peer dependency
- **Production-tested** — used across ENGIE's digital ecosystem

## Fluid DS Components Used (27+)

| Category | Components |
|----------|-----------|
| **Layout** | NJHeader, NJSidebarRoot, NJFooter, NJDivider |
| **Navigation** | NJSidebarItem, NJBreadcrumb, NJPaginationRoot |
| **Data Display** | NJCard, NJBadge, NJTag, NJIcon, NJAvatarRoot |
| **Typography** | NJDisplay, NJHeading, NJText |
| **Feedback** | NJInlineMessage, NJToastContainer, NJTooltip, NJProgress, NJSpinner |
| **Forms** | NJButton, NJSelectRoot, NJInputSearch, NJToggle |
| **Overlay** | NJModal, NJAccordion |
| **Skeleton** | NJSkeletonRectangle |

## Getting Started

### Prerequisites

- **Node.js** ≥ 22.0.0
- **pnpm** ≥ 10.0.0

### Install & Run

```bash
# Clone
git clone https://github.com/gfortaine/engie-portal.git
cd engie-portal

# Install dependencies
pnpm install

# Start dev servers (BFF + Portal)
pnpm dev

# Portal: http://localhost:3000
# BFF:    http://localhost:4000
```

### Available Commands

```bash
pnpm dev          # Start BFF + Portal in parallel (Turborepo)
pnpm build        # Production build
pnpm test         # Unit tests (Vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm lint         # ESLint + FSD boundary rules
pnpm typecheck    # TypeScript strict mode check
pnpm format       # Prettier formatting
pnpm generate     # Plop generators (feature/entity/page)
```

### Generate New Features

```bash
# Interactive generator
pnpm generate

# Creates FSD-compliant structure:
# src/features/my-feature/
#   ├── model/
#   ├── ui/
#   ├── api/
#   └── index.ts
```

## Deployment

### Vercel (Recommended)

The project deploys as a **single Vercel project** — SPA + serverless BFF:

1. Import repo in [Vercel Dashboard](https://vercel.com/new)
2. Framework: **Vite**
3. Root directory: **`.`** (monorepo root)
4. Add environment variables: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
5. Push to `main` → automatic deploy

Preview deploys are created on every PR.

### GitHub Actions

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | PR + push to main | Typecheck → Lint → Test → Build |
| `deploy.yml` | Push to main | CI + Vercel production deploy |
| `preview.yml` | PR opened | Vercel preview deploy + PR comment |

## Build Stats

| Metric | Value |
|--------|-------|
| JS Bundle | 598 KB (194 KB gzip) |
| CSS Bundle | 658 KB (71 KB gzip) |
| Unit Tests | 24 passing |
| E2E Tests | 16 passing |
| Components | 27+ Fluid DS |
| i18n Keys | 70+ (FR + EN) |

## Contributing

1. Create a feature branch from `develop`
2. Follow FSD architecture — use `pnpm generate` for scaffolding
3. Ensure `pnpm lint && pnpm test && pnpm build` passes
4. Open PR → preview deploy is created automatically

## License

Private — ENGIE internal use only.
