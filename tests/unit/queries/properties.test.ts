import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getProperty, getSuggestedPropertyCode } = await import("@/lib/queries/properties");

describe("getProperty — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both property id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "prop-1", organization_id: "org-a", name: "Shanti Nivas" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getProperty("prop-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "prop-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the property belongs to a different organization — no cross-org leak", async () => {
    // RLS + the explicit organization_id filter mean a cross-org id simply
    // yields no row, not a distinguishable "forbidden" response.
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getProperty("prop-1", "org-b");

    expect(result).toBeNull();
  });
});

describe("getSuggestedPropertyCode — preview only, scoped per organization", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("suggests PREFIX-001 for an organization with no existing properties in this prefix", async () => {
    const { chain } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-001");
  });

  it("continues numbering from the highest existing PREFIX-NNN code in this organization", async () => {
    const { chain } = createChainMock({
      data: [{ property_code: "REN-001" }, { property_code: "REN-002" }],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-003");
  });

  it("ignores existing/legacy codes that don't match the generated shape", async () => {
    const { chain } = createChainMock({
      data: [{ property_code: "E2E-PROP-A" }, { property_code: "REN-HQ" }, { property_code: "REN-001" }],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-002");
  });

  it("scopes the lookup to the caller's organization", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(callsFor(calls, "eq")).toContainEqual(["organization_id", "org-a"]);
  });

  it("computes independent numbering for a different organization sharing the same prefix", async () => {
    const orgAChain = createChainMock({ data: [{ property_code: "REN-001" }], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => orgAChain.chain) });
    const orgACode = await getSuggestedPropertyCode("org-a", "Rent Management");

    const orgBChain = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => orgBChain.chain) });
    const orgBCode = await getSuggestedPropertyCode("org-b", "Rent Management");

    expect(orgACode).toBe("REN-002");
    expect(orgBCode).toBe("REN-001");
  });

  it("falls back to PREFIX-001 rather than throwing if the lookup query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "500", message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const code = await getSuggestedPropertyCode("org-a", "Rent Management");

    expect(code).toBe("REN-001");
  });
});
