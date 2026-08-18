import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getProperty } = await import("@/lib/queries/properties");

describe("getProperty — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both property id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({
      data: { id: "prop-1", organization_id: "org-a", name: "Shanti Nivas" },
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getProperty("prop-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["id", "prop-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("returns null (not an error) when the property belongs to a different organization — no cross-org leak", async () => {
    // RLS + the explicit organization_id filter mean a cross-org id simply
    // yields no row, not a distinguishable "forbidden" response.
    const { chain } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await getProperty("prop-1", "org-b");

    expect(result).toBeNull();
  });
});
