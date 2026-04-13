import { router } from '../trpc';
import { contractRouter } from './contract';
import { invoiceRouter } from './invoice';
import { consumptionRouter } from './consumption';

export const appRouter = router({
  contract: contractRouter,
  invoice: invoiceRouter,
  consumption: consumptionRouter,
});

export type AppRouter = typeof appRouter;
