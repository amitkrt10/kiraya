import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getTenantExits, getEligibleLeasesForExit } = await import("@/lib/queries/tenantExits");

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

  it("filters by property id via the leases->units embed", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a", propertyId: "prop-1" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["leases.units.property_id", "prop-1"]);
  });

  it("filters by unit id via the leases embed", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a", unitId: "unit-1" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["leases.unit_id", "unit-1"]);
  });

  it("filters by tenant id directly on tenant_exits", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a", tenantId: "tenant-1" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-1"]);
  });

  it("composes property, unit, tenant, status, and search filters together", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({
      organizationId: "org-a",
      propertyId: "prop-1",
      unitId: "unit-1",
      tenantId: "tenant-1",
      status: "INITIATED",
      search: "EXIT-01",
    });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls).toContainEqual(["leases.units.property_id", "prop-1"]);
    expect(eqCalls).toContainEqual(["leases.unit_id", "unit-1"]);
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-1"]);
    expect(eqCalls).toContainEqual(["status", "INITIATED"]);
    expect(callsFor(calls, "ilike")).toContainEqual(["exit_reference", "%EXIT-01%"]);
  });

  it("does not filter by property or unit when neither is provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantExits({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls.some(([column]) => column === "leases.units.property_id")).toBe(false);
    expect(eqCalls.some(([column]) => column === "leases.unit_id")).toBe(false);
  });
});

describe("getEligibleLeasesForExit — active leases without an in-progress exit", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes both the leases and tenant_exits queries by organization, and filters leases to ACTIVE", async () => {
    const leasesChain = createChainMock({ data: [], error: null });
    const exitsChain = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "leases" ? leasesChain.chain : exitsChain.chain)),
    });

    await getEligibleLeasesForExit("org-a");

    expect(callsFor(leasesChain.calls, "eq")).toContainEqual(["organization_id", "org-a"]);
    expect(callsFor(leasesChain.calls, "eq")).toContainEqual(["status", "ACTIVE"]);
    expect(callsFor(exitsChain.calls, "eq")).toContainEqual(["organization_id", "org-a"]);
    expect(callsFor(exitsChain.calls, "in")).toContainEqual(["status", ["INITIATED", "PENDING_SETTLEMENT"]]);
  });

  it("excludes leases that already have an INITIATED or PENDING_SETTLEMENT exit", async () => {
    const leasesChain = createChainMock({
      data: [
        { id: "lease-1", lease_code: "L-1" },
        { id: "lease-2", lease_code: "L-2" },
        { id: "lease-3", lease_code: "L-3" },
      ],
      error: null,
    });
    const exitsChain = createChainMock({ data: [{ lease_id: "lease-2" }], error: null });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "leases" ? leasesChain.chain : exitsChain.chain)),
    });

    const result = await getEligibleLeasesForExit("org-a");

    expect(result.map((lease) => lease.id)).toEqual(["lease-1", "lease-3"]);
  });

  it("returns every ACTIVE lease unchanged when nothing is blocking", async () => {
    const leasesChain = createChainMock({
      data: [{ id: "lease-1", lease_code: "L-1" }],
      error: null,
    });
    const exitsChain = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "leases" ? leasesChain.chain : exitsChain.chain)),
    });

    const result = await getEligibleLeasesForExit("org-a");

    expect(result).toEqual([{ id: "lease-1", lease_code: "L-1" }]);
  });

  it("throws a descriptive error when the leases query fails", async () => {
    const leasesChain = createChainMock({ data: null, error: { message: "boom" } });
    const exitsChain = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "leases" ? leasesChain.chain : exitsChain.chain)),
    });

    await expect(getEligibleLeasesForExit("org-a")).rejects.toThrow("Failed to load eligible leases: boom");
  });

  it("throws a descriptive error when the blocking-exits query fails", async () => {
    const leasesChain = createChainMock({ data: [], error: null });
    const exitsChain = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "leases" ? leasesChain.chain : exitsChain.chain)),
    });

    await expect(getEligibleLeasesForExit("org-a")).rejects.toThrow("Failed to load eligible leases: boom");
  });
});
