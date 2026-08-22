import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/queries/payments", () => ({
  getPayments: vi.fn(async () => ({ payments: [{ id: "pay-1" }], totalCount: 1, page: 1, pageSize: 5 })),
}));

const { getOrganizationDashboard, getRecentPayments, getUpcomingLeaseExpiries } = await import("@/lib/queries/dashboard");
const { getPayments } = await import("@/lib/queries/payments");

describe("getOrganizationDashboard — organization scoping and empty-org handling", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query to the caller's organization_id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getOrganizationDashboard("org-a");

    expect(callsFor(calls, "eq")).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns latest=null and an empty monthly series for an organization with zero billing/payment activity ever — this is the view's own documented empty state, not an error", async () => {
    const { chain } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getOrganizationDashboard("org-new");

    expect(result.latest).toBeNull();
    expect(result.monthly).toEqual([]);
  });

  it("uses the most recent period_month row as `latest` and reverses the descending rows to ascending for the chart", async () => {
    const rows = [
      { organization_id: "org-a", period_month: "2026-07-01", property_count: 7 },
      { organization_id: "org-a", period_month: "2026-06-01", property_count: 7 },
      { organization_id: "org-a", period_month: "2026-05-01", property_count: 7 },
    ];
    const { chain } = createChainMock({ data: rows, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getOrganizationDashboard("org-a");

    expect(result.latest?.period_month).toBe("2026-07-01");
    expect(result.monthly.map((row) => row.period_month)).toEqual(["2026-05-01", "2026-06-01", "2026-07-01"]);
  });

  it("throws a descriptive error rather than swallowing a query failure", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "connection reset" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getOrganizationDashboard("org-a")).rejects.toThrow(/Failed to load organization dashboard/);
  });
});

describe("getRecentPayments — reuses the existing authoritative payments query", () => {
  it("delegates to getPayments scoped to the organization, first page, small page size — no separate query invented", async () => {
    await getRecentPayments("org-a");

    expect(getPayments).toHaveBeenCalledWith({ organizationId: "org-a", page: 1, pageSize: 5 });
  });
});

describe("getUpcomingLeaseExpiries — reuses kiraya.v_lease_expiry_alerts, no day-math recomputed", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes to the organization and orders by soonest expiry first", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUpcomingLeaseExpiries("org-a");

    expect(callsFor(calls, "eq")).toContainEqual(["organization_id", "org-a"]);
    expect(callsFor(calls, "order")).toContainEqual(["days_until_expiry", { ascending: true }]);
  });

  it("drops rows missing required fields instead of rendering a broken entry", async () => {
    const rows = [
      {
        lease_id: "lease-1",
        tenant_name: "Farida Khan",
        unit_code: "2C",
        property_name: "Green Court",
        days_until_expiry: 12,
        alert_status: "EXPIRING_30_DAYS",
      },
      { lease_id: null, tenant_name: null, unit_code: null, property_name: null, days_until_expiry: null, alert_status: null },
    ];
    const { chain } = createChainMock({ data: rows, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getUpcomingLeaseExpiries("org-a");

    expect(result).toEqual([
      { leaseId: "lease-1", tenantName: "Farida Khan", unitLabel: "Green Court · 2C", daysUntilExpiry: 12, alertStatus: "EXPIRING_30_DAYS" },
    ]);
  });
});
