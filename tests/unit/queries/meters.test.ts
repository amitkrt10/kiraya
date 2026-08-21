import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getMeters, getMeter } = await import("@/lib/queries/meters");

describe("getMeters — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getMeters({ organizationId: "org-a" });

    expect(callsFor(calls, "eq")).toContainEqual(["organization_id", "org-a"]);
  });

  it("filters by utility and status when provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getMeters({ organizationId: "org-a", utilityId: "util-1", status: "active" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["utility_id", "util-1"]);
    expect(eqCalls).toContainEqual(["is_active", true]);
  });

  it("attaches each meter's own latest reading (a plain per-row lookup, not a calculation)", async () => {
    const listChain = createChainMock({ data: [{ id: "meter-1" }], error: null, count: 1 });
    const readingChain = createChainMock({ data: { reading_value: 42, reading_date: "2026-05-01" }, error: null });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "meters" ? listChain.chain : readingChain.chain)),
    });

    const result = await getMeters({ organizationId: "org-a" });

    expect(result.meters).toEqual([{ id: "meter-1", latest_reading: { reading_value: 42, reading_date: "2026-05-01" } }]);
  });
});

describe("getMeter — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both meter id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: { id: "meter-1", organization_id: "org-a" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getMeter("meter-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "meter-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the meter belongs to a different organization — no cross-org leak", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getMeter("meter-1", "org-b");

    expect(result).toBeNull();
  });
});
