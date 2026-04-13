import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { AuthContext } from './middleware/auth';

export interface TrpcContext {
  auth: AuthContext | null;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Protected procedure — requires auth context
export const protectedProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.auth) {
      throw new Error('UNAUTHORIZED');
    }
    return next({ ctx: { auth: ctx.auth } });
  }),
);
