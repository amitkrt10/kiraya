import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getBillDueBreakdown } = await import("@/lib/queries/bills");

describe("getBillDueBreakdown — due-date split of open bills, never a stored status", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("only counts FINALIZED/PARTIALLY_PAID bills for both outstanding and overdue — PAID/VOID/DRAFT never carry a balance", async () => {
    const outstanding = createChainMock({ data: null, error: null, count: 3 });
    const overdue = createChainMock({ data: null, error: null, count: 1 });
    const overdueUnits = createChainMock({ data: [], error: null });

    let call = 0;
    const chains = [outstanding, overdue, overdueUnits];
    mockCreateClient.mockReturnValue({
      from: vi.fn(() => chains[call++]!.chain),
    });

    const result = await getBillDueBreakdown("org-a");

    expect(result).toEqual({ outstandingCount: 3, overdueCount: 1, overduePropertyCount: 0 });
    expect(callsFor(outstanding.calls, "in")).toContainEqual(["status", ["FINALIZED", "PARTIALLY_PAID"]]);
    expect(callsFor(overdue.calls, "in")).toContainEqual(["status", ["FINALIZED", "PARTIALLY_PAID"]]);
  });

  it("scopes every one of its three queries to the caller's organization", async () => {
    const outstanding = createChainMock({ data: null, error: null, count: 0 });
    const overdue = createChainMock({ data: null, error: null, count: 0 });
    const overdueUnits = createChainMock({ data: [], error: null });

    let call = 0;
    const chains = [outstanding, overdue, overdueUnits];
    mockCreateClient.mockReturnValue({
      from: vi.fn(() => chains[call++]!.chain),
    });

    await getBillDueBreakdown("org-a");

    for (const { calls } of chains) {
      expect(callsFor(calls, "eq")).toContainEqual(["organization_id", "org-a"]);
    }
  });

  it("counts distinct properties across overdue bills, not a raw row count", async () => {
    const outstanding = createChainMock({ data: null, error: null, count: 0 });
    const overdue = createChainMock({ data: null, error: null, count: 2 });
    const overdueUnits = createChainMock({
      data: [{ units: { property_id: "prop-1" } }, { units: { property_id: "prop-1" } }],
      error: null,
    });

    let call = 0;
    const chains = [outstanding, overdue, overdueUnits];
    mockCreateClient.mockReturnValue({
      from: vi.fn(() => chains[call++]!.chain),
    });

    const result = await getBillDueBreakdown("org-a");

    expect(result.overdueCount).toBe(2);
    expect(result.overduePropertyCount).toBe(1);
  });

  it("throws a descriptive error rather than swallowing a query failure", async () => {
    const failing = createChainMock({ data: null, error: { message: "boom" }, count: 0 });
    const ok = createChainMock({ data: null, error: null, count: 0 });
    const okUnits = createChainMock({ data: [], error: null });

    let call = 0;
    const chains = [failing, ok, okUnits];
    mockCreateClient.mockReturnValue({
      from: vi.fn(() => chains[call++]!.chain),
    });

    await expect(getBillDueBreakdown("org-a")).rejects.toThrow(/Failed to load outstanding bill count/);
  });
});
