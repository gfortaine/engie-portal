import { rtkApi } from '@/shared/api/rtkApi';

export interface Invoice {
  id: string;
  contractId: string;
  reference: string;
  period: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  downloadUrl?: string;
}

export const invoiceApi = rtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<Invoice[], void>({
      query: () => (client) => client.invoice.list.query(),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Invoice' as const, id })),
              { type: 'Invoice', id: 'LIST' },
            ]
          : [{ type: 'Invoice', id: 'LIST' }],
    }),
    getInvoice: builder.query<Invoice, string>({
      query: (id) => (client) => client.invoice.getById.query(id),
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),
  }),
});

export const { useGetInvoicesQuery, useGetInvoiceQuery } = invoiceApi;
