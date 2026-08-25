import { vi } from "vitest";

export interface ChainCall {
  method: string;
  args: unknown[];
}

/**
 * Minimal chainable mock of a Supabase PostgrestFilterBuilder: every filter
 * method records its call and returns itself, and it resolves like the real
 * builder does (awaitable directly, plus explicit .single()/.maybeSingle()).
 */
export function createChainMock(terminalResult: { data: unknown; error: unknown; count?: number }) {
  const calls: ChainCall[] = [];
  const chain: Record<string, unknown> = {};

  const chainableMethods = ["select", "insert", "update", "eq", "in", "or", "order", "range", "limit", "gt", "gte", "lte", "lt", "ilike"];
  for (const method of chainableMethods) {
    chain[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    });
  }

  chain.single = vi.fn(() => Promise.resolve(terminalResult));
  chain.maybeSingle = vi.fn(() => Promise.resolve(terminalResult));
  // Supabase's query builder is itself thenable — `await query` resolves
  // without an explicit terminal call (used by range()-based list queries).
  chain.then = (resolve: (value: typeof terminalResult) => void) => resolve(terminalResult);

  return { chain, calls };
}

export function callsFor(calls: ChainCall[], method: string): unknown[][] {
  return calls.filter((call) => call.method === method).map((call) => call.args);
}
