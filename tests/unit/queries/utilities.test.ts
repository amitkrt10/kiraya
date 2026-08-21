import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getUtilities, getUtility } = await import("@/lib/queries/utilities");

describe("getUtilities — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the count sub-query per row but never queries a different organization's rows", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUtilities({ organizationId: "org-a" });

    // No configuration-count lookups happen when the page is empty; scoping itself
    // relies on RLS (utilities_select already returns org-a + shared rows) rather
    // than an explicit organization_id filter — confirmed by the absence of any
    // eq("organization_id", ...) call here, unlike every other org-scoped query.
    expect(callsFor(calls, "eq").some(([column]) => column === "organization_id")).toBe(false);
  });

  it("searches by utility name only (never combining columns via .or(), which would need extra escaping beyond escapeIlike)", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUtilities({ organizationId: "org-a", search: "Elec" });

    const ilikeCalls = callsFor(calls, "ilike");
    expect(ilikeCalls).toContainEqual(["name", "%Elec%"]);
    expect(callsFor(calls, "or")).toHaveLength(0);
  });

  it("filters by active/inactive status when provided", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null, count: 0 });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUtilities({ organizationId: "org-a", status: "inactive" });

    expect(callsFor(calls, "eq")).toContainEqual(["is_active", false]);
  });
});

describe("getUtility — shared vs organization-owned utilities", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("allows both this organization's own utilities and globally shared ones (organization_id IS NULL)", async () => {
    const { chain, calls } = createChainMock({ data: { id: "util-1", organization_id: null }, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getUtility("util-1", "org-a");

    const orCalls = callsFor(calls, "or");
    expect(orCalls).toContainEqual(["organization_id.is.null,organization_id.eq.org-a"]);
  });

  it("treats an invalid-uuid error (22P02) as not-found rather than throwing", async () => {
    const { chain } = createChainMock({ data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getUtility("not-a-uuid", "org-a");

    expect(result).toBeNull();
  });
});
