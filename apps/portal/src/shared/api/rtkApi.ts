import { createApi } from '@reduxjs/toolkit/query/react';
import { trpcBaseQuery } from './trpcBaseQuery';

export const rtkApi = createApi({
  reducerPath: 'api',
  baseQuery: trpcBaseQuery,
  tagTypes: ['Contract', 'Invoice', 'User', 'Consumption'],
  endpoints: () => ({}),
});
