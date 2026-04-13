import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { trpcClient } from './trpcClient';

type TrpcQueryFn = (client: typeof trpcClient) => Promise<unknown>;

interface TrpcError {
  status: string;
  message: string;
  data?: unknown;
}

export const trpcBaseQuery: BaseQueryFn<TrpcQueryFn, unknown, TrpcError> = async (
  queryFn,
  _api,
  _extraOptions,
) => {
  try {
    const data = await queryFn(trpcClient);
    return { data };
  } catch (error: unknown) {
    const err = error as { message?: string; data?: unknown };
    return {
      error: {
        status: 'TRPC_ERROR',
        message: err?.message ?? 'Unknown error',
        data: err?.data,
      },
    };
  }
};
