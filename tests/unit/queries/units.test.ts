import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getPropertyUnits, getUnit, getSuggestedUnitCode } = await import("@/lib/queries/units");

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

describe("getSuggestedUnitCode — preview only, scoped per property", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("suggests PREFIX-001 for a property with no existing units in this prefix", async () => {
    const { chain } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedUnitCode("prop-1", "Kumar Building");

    expect(code).toBe("KB-001");
  });

  it("continues numbering from the highest existing PREFIX-NNN code in this property", async () => {
    const { chain } = createChainMock({
      data: [{ unit_code: "KB-001" }, { unit_code: "KB-002" }],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedUnitCode("prop-1", "Kumar Building");

    expect(code).toBe("KB-003");
  });

  it("ignores existing/legacy codes that don't match the generated shape", async () => {
    const { chain } = createChainMock({
      data: [{ unit_code: "P54D-S1-1787290253224" }, { unit_code: "KB001" }, { unit_code: "KB-001" }],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedUnitCode("prop-1", "Kumar Building");

    expect(code).toBe("KB-002");
  });

  it("scopes the lookup to the given property", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getSuggestedUnitCode("prop-1", "Kumar Building");

    expect(callsFor(calls, "eq")).toContainEqual(["property_id", "prop-1"]);
  });

  it("computes independent numbering for a different property sharing the same prefix", async () => {
    const propAChain = createChainMock({ data: [{ unit_code: "KB-001" }], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => propAChain.chain) });
    const propACode = await getSuggestedUnitCode("prop-a", "Kumar Building");

    const propBChain = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => propBChain.chain) });
    const propBCode = await getSuggestedUnitCode("prop-b", "Kumar Building");

    expect(propACode).toBe("KB-002");
    expect(propBCode).toBe("KB-001");
  });

  it("derives the prefix from the property name given, not from a unit's own name", async () => {
    const { chain } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedUnitCode("prop-1", "Green Valley Apartments");

    expect(code).toBe("GVA-001");
  });

  it("falls back to PREFIX-001 rather than throwing if the lookup query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "500", message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedUnitCode("prop-1", "Kumar Building");

    expect(code).toBe("KB-001");
  });
});
