import { rtkApi } from '@/shared/api/rtkApi';

export interface Contract {
  id: string;
  reference: string;
  type: 'electricity' | 'gas' | 'solar';
  status: 'active' | 'pending' | 'terminated';
  address: string;
  startDate: string;
  endDate?: string;
  monthlyAmount: number;
  meterNumber: string;
}

export const contractApi = rtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getContracts: builder.query<Contract[], void>({
      query: () => (client) => client.contract.list.query(),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Contract' as const, id })),
              { type: 'Contract', id: 'LIST' },
            ]
          : [{ type: 'Contract', id: 'LIST' }],
    }),
    getContract: builder.query<Contract, string>({
      query: (id) => (client) => client.contract.getById.query(id),
      providesTags: (_result, _error, id) => [{ type: 'Contract', id }],
    }),
  }),
});

export const { useGetContractsQuery, useGetContractQuery } = contractApi;
