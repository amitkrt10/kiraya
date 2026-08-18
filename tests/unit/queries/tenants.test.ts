import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getTenant, getTenants, getTenantsForPicker } = await import("@/lib/queries/tenants");

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
