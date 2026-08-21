import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getSecurityDeposits } = await import("@/lib/queries/securityDeposits");

function mockClientWithHeld(chain: unknown, heldValue: number) {
  mockCreateClient.mockReturnValue({
    from: vi.fn(() => chain),
    rpc: vi.fn(() => Promise.resolve({ data: heldValue, error: null })),
  });
}

describe("getSecurityDeposits — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockClientWithHeld(chain, 0);

    await getSecurityDeposits({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("filters by status when provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockClientWithHeld(chain, 0);

    await getSecurityDeposits({ organizationId: "org-a", status: "PARTIALLY_RECEIVED" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["status", "PARTIALLY_RECEIVED"]);
  });

  it("does not filter by status when none is provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockClientWithHeld(chain, 0);

    await getSecurityDeposits({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls.some(([column]) => column === "status")).toBe(false);
  });

  it("searches by deposit_reference when a search term is provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockClientWithHeld(chain, 0);

    await getSecurityDeposits({ organizationId: "org-a", search: "DEP-01" });

    const ilikeCalls = callsFor(calls, "ilike");
    expect(ilikeCalls).toContainEqual(["deposit_reference", "%DEP-01%"]);
  });

  it("attaches the authoritative held amount (from the RPC, never computed client-side) to each row", async () => {
    const { chain } = createChainMock({
      data: [
        { id: "dep-1", organization_id: "org-a", received_amount: 10000, deducted_amount: 2000, refunded_amount: 0 },
      ],
      error: null,
      count: 1,
    });
    mockClientWithHeld(chain, 8000);

    const result = await getSecurityDeposits({ organizationId: "org-a" });

    expect(result.deposits).toEqual([
      { id: "dep-1", organization_id: "org-a", received_amount: 10000, deducted_amount: 2000, refunded_amount: 0, held: 8000 },
    ]);
  });

  it("returns the paginated result shape from the query response", async () => {
    const { chain } = createChainMock({ data: [], error: null, count: 0 });
    mockClientWithHeld(chain, 0);

    const result = await getSecurityDeposits({ organizationId: "org-a", page: 2, pageSize: 10 });

    expect(result).toMatchObject({ deposits: [], totalCount: 0, page: 2, pageSize: 10 });
  });

  it("throws a descriptive error when the query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" }, count: 0 });
    mockClientWithHeld(chain, 0);

    await expect(getSecurityDeposits({ organizationId: "org-a" })).rejects.toThrow(
      "Failed to load security deposits: boom",
    );
  });
});
