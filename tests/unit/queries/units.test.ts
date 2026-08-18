import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getPropertyUnits, getUnit } = await import("@/lib/queries/units");

describe("getPropertyUnits — property + organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both property id and organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getPropertyUnits("prop-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["property_id", "prop-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getUnit — cross-organization access returns null, not a leak", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes by unit id and organization id", async () => {
    const { chain, calls } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getUnit("unit-1", "org-b");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "unit-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-b"]);
    expect(result).toBeNull();
  });
});
