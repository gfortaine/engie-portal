import { rtkApi } from '@/shared/api/rtkApi';

export interface ConsumptionPoint {
  date: string;
  value: number;
  unit: 'kWh' | 'm³';
}

export interface ConsumptionData {
  contractId: string;
  period: string;
  total: number;
  unit: 'kWh' | 'm³';
  points: ConsumptionPoint[];
  comparisonPeriod?: {
    total: number;
    percentChange: number;
  };
}

export const consumptionApi = rtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getConsumption: builder.query<ConsumptionData, { contractId: string; period: string }>({
      query: ({ contractId, period }) =>
        (client) => client.consumption.getData.query({ contractId, period }),
      providesTags: (_result, _error, { contractId }) => [
        { type: 'Consumption', id: contractId },
      ],
    }),
  }),
});

export const { useGetConsumptionQuery } = consumptionApi;
