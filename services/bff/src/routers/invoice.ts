import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { mockInvoices } from '../mocks/invoices';

export const invoiceRouter = router({
  list: publicProcedure.query(() => {
    return mockInvoices;
  }),

  getById: publicProcedure.input(z.string()).query(({ input }) => {
    const invoice = mockInvoices.find((i) => i.id === input);
    if (!invoice) {
      throw new Error(`Invoice ${input} not found`);
    }
    return invoice;
  }),
});
