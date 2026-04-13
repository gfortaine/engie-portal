import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { generateConsumptionData } from '../mocks/consumption';

export const consumptionRouter = router({
  getData: publicProcedure
    .input(z.object({ contractId: z.string(), period: z.string() }))
    .query(({ input }) => {
      return generateConsumptionData(input.contractId, input.period);
    }),
});
