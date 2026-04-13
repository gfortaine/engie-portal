import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@engie-portal/api-client';
import superjson from 'superjson';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  return 'http://localhost:4000';
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
