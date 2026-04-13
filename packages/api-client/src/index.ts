// Re-export the AppRouter type from the BFF service
// In a monorepo, the BFF types are imported directly via workspace resolution
export type { AppRouter } from '@engie-portal/bff/routers';
