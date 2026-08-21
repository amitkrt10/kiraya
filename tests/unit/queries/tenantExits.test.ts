import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getTenantExits } = await import("@/lib/queries/tenantExits");

describe("getTenantExits — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("filters by status when provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a", status: "PENDING_SETTLEMENT" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["status", "PENDING_SETTLEMENT"]);
  });

  it("does not filter by status when none is provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls.some(([column]) => column === "status")).toBe(false);
  });

  it("searches by exit_reference when a search term is provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a", search: "EXT-01" });

    const ilikeCalls = callsFor(calls, "ilike");
    expect(ilikeCalls).toContainEqual(["exit_reference", "%EXT-01%"]);
  });

  it("returns the paginated result shape from the query response", async () => {
    const { chain } = createChainMock({
      data: [{ id: "exit-1", organization_id: "org-a" }],
      error: null,
      count: 1,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getTenantExits({ organizationId: "org-a", page: 2, pageSize: 10 });

    expect(result).toEqual({
      exits: [{ id: "exit-1", organization_id: "org-a" }],
      totalCount: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it("throws a descriptive error when the query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" }, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getTenantExits({ organizationId: "org-a" })).rejects.toThrow("Failed to load tenant exits: boom");
  });
});
