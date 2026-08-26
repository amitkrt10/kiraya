import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getLease, getLeases, getTenantLeases, getUnitCurrentLease, getUnitCurrentLeasesByIds, getLeaseUnitId, getUnitLeases } = await import(
  "@/lib/queries/leases"
);

describe("getLease — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both lease id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "lease-1", organization_id: "org-a", lease_code: "LSE-01" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLease("lease-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "lease-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the lease belongs to a different organization — no cross-org leak", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getLease("lease-1", "org-b");

    expect(result).toBeNull();
  });

  it("treats an invalid-uuid error (22P02) as not-found rather than throwing", async () => {
    const { chain } = createChainMock({
      data: null,
      error: { code: "22P02", message: "invalid input syntax for type uuid" },
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getLease("not-a-uuid", "org-a");

    expect(result).toBeNull();
  });
});

describe("getLeases — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLeases({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getTenantLeases — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both tenant id and organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantLeases("tenant-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getUnitCurrentLease — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by unit id, organization id, and ACTIVE status", async () => {
    const { chain, calls } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUnitCurrentLease("unit-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["unit_id", "unit-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls).toContainEqual(["status", "ACTIVE"]);
  });
});

describe("getUnitCurrentLeasesByIds — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the batched query by organization id and ACTIVE status", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUnitCurrentLeasesByIds(["unit-1", "unit-2"], "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls).toContainEqual(["status", "ACTIVE"]);
    const inCalls = callsFor(calls, "in");
    expect(inCalls).toContainEqual(["unit_id", ["unit-1", "unit-2"]]);
  });

  it("returns an empty object without querying when given no unit ids", async () => {
    mockCreateClient.mockReturnValue({ from: vi.fn() });

    const result = await getUnitCurrentLeasesByIds([], "org-a");

    expect(result).toEqual({});
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe("getUnitLeases — P6.3-J: every occupancy a unit has ever had, powers the Past Occupancies list", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes by unit id and organization id, with no status filter (active and ended both included)", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUnitLeases("unit-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["unit_id", "unit-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls.some((args) => args[0] === "status")).toBe(false);
  });

  it("returns every lease row found, regardless of status", async () => {
    const rows = [
      { id: "lease-a", status: "ENDED" },
      { id: "lease-b", status: "ACTIVE" },
    ];
    const { chain } = createChainMock({ data: rows, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getUnitLeases("unit-1", "org-a");

    expect(result).toEqual(rows);
  });

  it("throws a descriptive error on query failure", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getUnitLeases("unit-1", "org-a")).rejects.toThrow("Failed to load unit leases: boom");
  });
});

describe("getLeaseUnitId — P6.3-F: powers the /app/leases/[id] and /app/leases/[id]/edit retirement redirects", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the lookup by both lease id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: { unit_id: "unit-1" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getLeaseUnitId("lease-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "lease-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns the unit id when the lease is visible to the caller", async () => {
    const { chain } = createChainMock({ data: { unit_id: "unit-42" }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getLeaseUnitId("lease-1", "org-a")).resolves.toBe("unit-42");
  });

  it("returns null (not an error) for a cross-organization lease id — no distinguishable leak", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getLeaseUnitId("lease-1", "org-b")).resolves.toBeNull();
  });

  it("treats an invalid-uuid error (22P02) as not-found rather than throwing", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getLeaseUnitId("not-a-uuid", "org-a")).resolves.toBeNull();
  });

  it("throws a descriptive error for any other query failure", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "500", message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getLeaseUnitId("lease-1", "org-a")).rejects.toThrow("Failed to load lease: boom");
  });
});
