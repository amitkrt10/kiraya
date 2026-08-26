import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getSecurityDeposits, getSecurityDepositByLease, getTenantSecurityDeposits } = await import("@/lib/queries/securityDeposits");

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

describe("getSecurityDepositByLease — resolves by lease_id, never by tenant_id", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("filters by lease_id and organization_id, and never filters by tenant_id at all", async () => {
    const { chain, calls } = createChainMock({ data: { id: "deposit-a", lease_id: "lease-a" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getSecurityDepositByLease("lease-a", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["lease_id", "lease-a"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls.some(([column]) => column === "tenant_id")).toBe(false);
  });

  it("never orders or limits — security_deposits_lease_unique_idx guarantees at most one row per lease, so there is no 'most recent' to pick", async () => {
    const { chain, calls } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getSecurityDepositByLease("lease-a", "org-a");

    expect(callsFor(calls, "order")).toHaveLength(0);
    expect(callsFor(calls, "limit")).toHaveLength(0);
  });

  it("Scenario A — same tenant, two leases: querying by Lease A's id returns Deposit A, not Deposit B", async () => {
    // Two independent calls, two independent deposits — proves the
    // function is a deterministic per-lease lookup, not a tenant-wide
    // pick that could return either one depending on recency.
    const chainA = createChainMock({ data: { id: "deposit-a", lease_id: "lease-a", tenant_id: "tenant-a" }, error: null });
    mockCreateClient.mockReturnValueOnce({ from: vi.fn(() => chainA.chain) });
    const depositA = await getSecurityDepositByLease("lease-a", "org-a");
    expect(depositA?.id).toBe("deposit-a");

    const chainB = createChainMock({ data: { id: "deposit-b", lease_id: "lease-b", tenant_id: "tenant-a" }, error: null });
    mockCreateClient.mockReturnValueOnce({ from: vi.fn(() => chainB.chain) });
    const depositB = await getSecurityDepositByLease("lease-b", "org-a");
    expect(depositB?.id).toBe("deposit-b");

    expect(callsFor(chainA.calls, "eq")).toContainEqual(["lease_id", "lease-a"]);
    expect(callsFor(chainB.calls, "eq")).toContainEqual(["lease_id", "lease-b"]);
  });

  it("returns null (not an error) for a lease with no deposit configured", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getSecurityDepositByLease("lease-a", "org-a")).resolves.toBeNull();
  });

  it("returns null (not a thrown error) for a malformed lease id, matching getLease()'s not-found-vs-leak convention", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getSecurityDepositByLease("not-a-uuid", "org-a")).resolves.toBeNull();
  });

  it("throws a descriptive error when the query genuinely fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getSecurityDepositByLease("lease-a", "org-a")).rejects.toThrow("Failed to load security deposit: boom");
  });
});

describe("getTenantSecurityDeposits — explicit tenant-wide aggregate, distinct from the lease-scoped lookup", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("filters by tenant_id and organization_id — this is the one query allowed to be tenant-scoped, because it's explicitly a list, never presented as a single deposit", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantSecurityDeposits("tenant-a", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-a"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns every deposit across a tenant's occupancies, each labeled with its own lease/unit", async () => {
    const { chain } = createChainMock({
      data: [
        { id: "deposit-a", lease_id: "lease-a", leases: { lease_code: "LSE-A", units: { unit_code: "101" } } },
        { id: "deposit-b", lease_id: "lease-b", leases: { lease_code: "LSE-B", units: { unit_code: "102" } } },
      ],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const deposits = await getTenantSecurityDeposits("tenant-a", "org-a");

    expect(deposits).toHaveLength(2);
    expect(deposits.map((d) => d.leases?.units?.unit_code)).toEqual(["101", "102"]);
  });
});
