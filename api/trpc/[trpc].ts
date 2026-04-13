import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../services/bff/src/routers/index.js';

export const config = {
  runtime: 'nodejs20.x',
  maxDuration: 10,
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200 });
  }

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({ auth: null }),
  });
}
