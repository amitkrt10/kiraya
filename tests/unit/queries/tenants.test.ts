import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getTenant, getTenants, getTenantsForPicker, getActiveTenantsForPicker } = await import("@/lib/queries/tenants");

describe("getTenant — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both tenant id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "tenant-1", organization_id: "org-a", display_name: "Asha Rao" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenant("tenant-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "tenant-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the tenant belongs to a different organization — no cross-org leak", async () => {
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getTenant("tenant-1", "org-b");

    expect(result).toBeNull();
  });

  it("treats an invalid-uuid error (22P02) as not-found rather than throwing", async () => {
    const { chain } = createChainMock({
      data: null,
      error: { code: "22P02", message: "invalid input syntax for type uuid" },
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getTenant("not-a-uuid", "org-a");

    expect(result).toBeNull();
  });
});

describe("getTenants — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the list query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenants({ organizationId: "org-a" });

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getTenantsForPicker — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the picker query by the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantsForPicker("org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });
});

describe("getActiveTenantsForPicker — P6.3-C Assign Tenant picker: active + org-scoped, never filtered by existing occupancy", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes by organization id and status=ACTIVE, and nothing else", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getActiveTenantsForPicker("org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
    expect(eqCalls).toContainEqual(["status", "ACTIVE"]);
    // Critically: no lease/unit-based filter of any kind — a tenant who
    // already occupies another unit must still be selectable here.
    expect(eqCalls.some(([column]) => column === "unit_id" || column === "lease_id")).toBe(false);
    expect(callsFor(calls, "in")).toHaveLength(0);
  });

  it("returns the tenants the query yields, unfiltered by this function beyond what the query itself does", async () => {
    const { chain } = createChainMock({
      data: [{ id: "t1", tenant_code: "KIR-001", display_name: "Tenant One" }],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getActiveTenantsForPicker("org-a");

    expect(result).toEqual([{ id: "t1", tenant_code: "KIR-001", display_name: "Tenant One" }]);
  });

  it("throws a descriptive error when the query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getActiveTenantsForPicker("org-a")).rejects.toThrow("Failed to load tenants: boom");
  });
});
