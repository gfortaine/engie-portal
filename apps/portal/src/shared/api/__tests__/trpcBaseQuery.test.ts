import { describe, it, expect } from 'vitest';
import { trpcBaseQuery } from '../trpcBaseQuery';

describe('trpcBaseQuery', () => {
  const mockApi = {} as Parameters<typeof trpcBaseQuery>[1];
  const mockExtraOptions = {} as Parameters<typeof trpcBaseQuery>[2];

  it('returns data on successful query', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    const queryFn = () => Promise.resolve(mockData);
    const result = await trpcBaseQuery(queryFn, mockApi, mockExtraOptions);

    expect(result).toEqual({ data: mockData });
    expect(result).not.toHaveProperty('error');
  });

  it('returns error with TRPC_ERROR status on failure', async () => {
    const queryFn = () => Promise.reject(new Error('Network error'));
    const result = await trpcBaseQuery(queryFn, mockApi, mockExtraOptions);

    expect(result).toHaveProperty('error');
    expect(result.error).toEqual({
      status: 'TRPC_ERROR',
      message: 'Network error',
      data: undefined,
    });
  });

  it('handles non-Error thrown values', async () => {
    const queryFn = () => Promise.reject({ message: 'Custom error', data: { code: 'NOT_FOUND' } });
    const result = await trpcBaseQuery(queryFn, mockApi, mockExtraOptions);

    expect(result.error).toEqual({
      status: 'TRPC_ERROR',
      message: 'Custom error',
      data: { code: 'NOT_FOUND' },
    });
  });

  it('returns "Unknown error" when thrown value has no message', async () => {
    const queryFn = () => Promise.reject({});
    const result = await trpcBaseQuery(queryFn, mockApi, mockExtraOptions);

    expect(result.error?.message).toBe('Unknown error');
  });

  it('handles null/undefined rejection', async () => {
    const queryFn = () => Promise.reject(null);
    const result = await trpcBaseQuery(queryFn, mockApi, mockExtraOptions);

    expect(result.error).toEqual({
      status: 'TRPC_ERROR',
      message: 'Unknown error',
      data: undefined,
    });
  });
});
