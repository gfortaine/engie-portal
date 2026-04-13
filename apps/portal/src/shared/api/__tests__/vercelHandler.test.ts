import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for the Vercel tRPC handler (api/trpc/[trpc].ts)
 * We inline-import via dynamic require since the handler is outside the Vite root.
 * Instead we test the handler's logic by re-implementing the key functions.
 */

// Replicate the safeJsonParse from the handler
function safeJsonParse(raw: unknown, fallback: unknown): unknown {
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

describe('safeJsonParse (API handler utility)', () => {
  it('parses valid JSON string', () => {
    expect(safeJsonParse('{"key":"value"}', {})).toEqual({ key: 'value' });
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeJsonParse('{broken', 'default')).toBe('default');
  });

  it('returns fallback for non-string input', () => {
    expect(safeJsonParse(123, 'fallback')).toBe('fallback');
    expect(safeJsonParse(null, 'fallback')).toBe('fallback');
    expect(safeJsonParse(undefined, 'fallback')).toBe('fallback');
  });

  it('parses array input (repeated query params)', () => {
    // When query param repeats, Vercel sends array — should fallback
    expect(safeJsonParse(['a', 'b'], {})).toEqual({});
  });

  it('parses quoted string', () => {
    expect(safeJsonParse('"hello"', '')).toBe('hello');
  });

  it('parses nested objects', () => {
    const input = JSON.stringify({ contractId: 'ctr_001', period: '2026-03' });
    const result = safeJsonParse(input, {}) as Record<string, string>;
    expect(result.contractId).toBe('ctr_001');
    expect(result.period).toBe('2026-03');
  });
});

describe('tRPC response envelope', () => {
  function trpcResult(data: unknown) {
    return { result: { data: { json: data, meta: { values: {} } } } };
  }

  it('wraps data in superjson-compatible envelope', () => {
    const result = trpcResult([{ id: '1' }]);
    expect(result.result.data.json).toEqual([{ id: '1' }]);
    expect(result.result.data.meta).toEqual({ values: {} });
  });

  it('wraps null data', () => {
    const result = trpcResult(null);
    expect(result.result.data.json).toBeNull();
  });

  it('wraps empty array', () => {
    const result = trpcResult([]);
    expect(result.result.data.json).toEqual([]);
  });
});
