import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getLease, getLeases, getTenantLeases, getUnitCurrentLease, getUnitCurrentLeasesByIds } = await import(
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
