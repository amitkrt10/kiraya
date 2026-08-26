import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getLedgerEntries, getLedgerEntriesForExport } = await import("@/lib/queries/ledger");

describe("getLedgerEntries — organization scoping and filters", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("always scopes by organization_id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntries({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("applies the tenant filter when provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntries({ organizationId: "org-a", tenantId: "tenant-1" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-1"]);
  });

  it("omits the tenant filter when not provided (org-wide view)", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntries({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls.some((args) => args[0] === "tenant_id")).toBe(false);
  });

  it("applies the entry-type filter when provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntries({ organizationId: "org-a", entryType: "PAYMENT" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["entry_type", "PAYMENT"]);
  });

  it("applies the date-range filters when provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntries({ organizationId: "org-a", dateFrom: "2026-01-01", dateTo: "2026-01-31" });

    expect(callsFor(calls, "gte")).toContainEqual(["entry_date", "2026-01-01"]);
    expect(callsFor(calls, "lte")).toContainEqual(["entry_date", "2026-01-31"]);
  });

  it("paginates via range(), computed from page and pageSize", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntries({ organizationId: "org-a", page: 3, pageSize: 10 });

    const rangeCalls = callsFor(calls, "range");
    expect(rangeCalls).toContainEqual([20, 29]);
  });

  it("resolves the property filter via the tenant's leases, then filters the ledger by lease_id", async () => {
    const leaseChain = createChainMock({ data: [{ id: "lease-1" }, { id: "lease-2" }], error: null });
    const ledgerChain = createChainMock({ data: [], error: null, count: 0 });

    const fromMock = vi.fn((table: string) => (table === "leases" ? leaseChain.chain : ledgerChain.chain));
    mockCreateClient.mockReturnValue({ from: fromMock });

    await getLedgerEntries({ organizationId: "org-a", propertyId: "prop-1" });

    expect(fromMock).toHaveBeenCalledWith("leases");
    expect(fromMock).toHaveBeenCalledWith("v_tenant_ledger");
    expect(callsFor(leaseChain.calls, "eq")).toContainEqual(["units.property_id", "prop-1"]);
    expect(callsFor(ledgerChain.calls, "in")).toContainEqual(["lease_id", ["lease-1", "lease-2"]]);
  });

  it("filters to a sentinel (no rows) when the property has no leases, instead of returning everything", async () => {
    const leaseChain = createChainMock({ data: [], error: null });
    const ledgerChain = createChainMock({ data: [], error: null, count: 0 });

    const fromMock = vi.fn((table: string) => (table === "leases" ? leaseChain.chain : ledgerChain.chain));
    mockCreateClient.mockReturnValue({ from: fromMock });

    await getLedgerEntries({ organizationId: "org-a", propertyId: "prop-empty" });

    const inCalls = callsFor(ledgerChain.calls, "in");
    expect(inCalls[0]?.[0]).toBe("lease_id");
    expect(inCalls[0]?.[1]).not.toEqual([]);
  });

  it("P6.3-E: resolves the unit filter via that tenant's own leases for the unit, then filters the ledger by lease_id", async () => {
    const leaseChain = createChainMock({ data: [{ id: "lease-1" }], error: null });
    const ledgerChain = createChainMock({ data: [], error: null, count: 0 });

    const fromMock = vi.fn((table: string) => (table === "leases" ? leaseChain.chain : ledgerChain.chain));
    mockCreateClient.mockReturnValue({ from: fromMock });

    await getLedgerEntries({ organizationId: "org-a", tenantId: "tenant-1", unitId: "unit-1" });

    expect(fromMock).toHaveBeenCalledWith("leases");
    const eqCalls = callsFor(leaseChain.calls, "eq");
    expect(eqCalls).toContainEqual(["unit_id", "unit-1"]);
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-1"]);
    expect(callsFor(ledgerChain.calls, "in")).toContainEqual(["lease_id", ["lease-1"]]);
  });

  it("filters to a sentinel (no rows) when the tenant never held that unit, instead of returning everything", async () => {
    const leaseChain = createChainMock({ data: [], error: null });
    const ledgerChain = createChainMock({ data: [], error: null, count: 0 });

    const fromMock = vi.fn((table: string) => (table === "leases" ? leaseChain.chain : ledgerChain.chain));
    mockCreateClient.mockReturnValue({ from: fromMock });

    await getLedgerEntries({ organizationId: "org-a", tenantId: "tenant-1", unitId: "unit-empty" });

    const inCalls = callsFor(ledgerChain.calls, "in");
    expect(inCalls[0]?.[0]).toBe("lease_id");
    expect(inCalls[0]?.[1]).not.toEqual([]);
  });

  it("P6.3-J: applies the leaseId filter directly (no lease-resolution round trip needed, unlike propertyId/unitId)", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    const fromMock = vi.fn(() => chain);
    mockCreateClient.mockReturnValue({ from: fromMock });

    await getLedgerEntries({ organizationId: "org-a", leaseId: "lease-42" });

    expect(fromMock).not.toHaveBeenCalledWith("leases");
    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["lease_id", "lease-42"]);
  });

  it("omits the unit filter when not provided (all of the tenant's units shown)", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntries({ organizationId: "org-a", tenantId: "tenant-1" });

    expect(callsFor(calls, "in").some((args) => args[0] === "lease_id")).toBe(false);
  });

  it("returns the authoritative rows and total count untouched", async () => {
    const rows = [{ ledger_entry_id: "e1", running_balance: 5000 }];
    const { chain } = createChainMock({ data: rows, error: null, count: 1 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getLedgerEntries({ organizationId: "org-a" });

    expect(result.entries).toEqual(rows);
    expect(result.totalCount).toBe(1);
  });

  it("throws a clean error when the query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "db error" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getLedgerEntries({ organizationId: "org-a" })).rejects.toThrow(/Failed to load ledger entries/);
  });
});

describe("getLedgerEntriesForExport — same filters, unpaginated", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes by organization and applies the same filters as getLedgerEntries", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntriesForExport({ organizationId: "org-a", tenantId: "tenant-1", entryType: "BILL" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-1"]);
    expect(eqCalls).toContainEqual(["entry_type", "BILL"]);
  });

  it("P6.3-J: applies the leaseId filter too", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntriesForExport({ organizationId: "org-a", leaseId: "lease-42" });

    expect(callsFor(calls, "eq")).toContainEqual(["lease_id", "lease-42"]);
  });

  it("does not paginate — uses a capped limit() instead of range()", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLedgerEntriesForExport({ organizationId: "org-a" });

    expect(callsFor(calls, "range")).toHaveLength(0);
    expect(callsFor(calls, "limit").length).toBeGreaterThan(0);
  });
});
