import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { mockContracts } from '../mocks/contracts';

export const contractRouter = router({
  list: publicProcedure.query(() => {
    return mockContracts;
  }),

  getById: publicProcedure.input(z.string()).query(({ input }) => {
    const contract = mockContracts.find((c) => c.id === input);
    if (!contract) {
      throw new Error(`Contract ${input} not found`);
    }
    return contract;
  }),
});
