# ENGIE Portal — Copilot Instructions

## Architecture
- **Feature-Sliced Design (FSD)**: 6 layers — app → pages → widgets → features → entities → shared
- Import direction: a layer can ONLY import from layers below it
- Each feature/entity exposes through `index.ts` barrel export only

## Stack
- React 19 + TypeScript 5.8 (strict mode)
- Redux Toolkit 2.x + RTK Query (state management)
- TanStack Router (type-safe file-based routing)
- tRPC v11 BFF (end-to-end TypeScript type safety)
- Vite (dev server + bundler)
- Vitest + React Testing Library + Playwright

## Conventions
- Named exports only (no default exports)
- CSS Modules for styling with Fluid DS CSS variables (`--nj-*`)
- Colocated tests: `*.test.tsx` next to source
- French as primary language in i18n, English as secondary

## Redux Patterns
- Use `createSlice` with `selectors` option
- RTK Query endpoints via `rtkApi.injectEndpoints()`
- Custom `trpcBaseQuery` wraps tRPC client calls
- Use `listenerMiddleware` for side effects (never Redux-Saga)
- `useAppSelector` and `useAppDispatch` typed hooks from `@/app/providers/store`

## FSD Rules
- features/ contains user interactions and business logic
- entities/ contains domain models and dumb UI
- shared/ contains app-agnostic utilities, base API, hooks
- widgets/ contains composed layout blocks
- pages/ are route-level composites

## File Naming
- Components: PascalCase (`ContractCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAppAuth.ts`)
- Slices: camelCase with `Slice` suffix (`authSlice.ts`)
- CSS Modules: `*.module.css`
- Tests: `*.test.ts` or `*.test.tsx`
