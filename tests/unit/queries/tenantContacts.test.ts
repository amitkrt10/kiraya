import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getTenantContacts } = await import("@/lib/queries/tenantContacts");
const { findContactSlot } = await import("@/lib/utils/tenantContacts");

describe("getTenantContacts — organization context is respected", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("scopes the query by both tenant_id and the caller's organization id", async () => {
    const { chain, calls } = createChainMock({ data: [], error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await getTenantContacts("tenant-1", "org-a");

    const eqCalls = callsFor(calls, "eq");
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-1"]);
    expect(eqCalls).toContainEqual(["organization_id", "org-a"]);
  });

  it("throws a descriptive error when the query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getTenantContacts("tenant-1", "org-a")).rejects.toThrow("Failed to load tenant contacts: boom");
  });
});

describe("findContactSlot", () => {
  const emergency1 = {
    id: "c1",
    organization_id: "org-a",
    tenant_id: "tenant-1",
    contact_type: "EMERGENCY" as const,
    sort_order: 1,
    name: "Ravi",
    phone: null,
    address: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
  const localRef2 = { ...emergency1, id: "c2", contact_type: "LOCAL_REFERENCE" as const, sort_order: 2, name: "Priya" };
  const contacts = [emergency1, localRef2];

  it("finds the exact (contact_type, sort_order) slot requested", () => {
    expect(findContactSlot(contacts, "EMERGENCY", 1)?.name).toBe("Ravi");
    expect(findContactSlot(contacts, "LOCAL_REFERENCE", 2)?.name).toBe("Priya");
  });

  it("returns null for a slot that doesn't exist in the list — never falls back to a different slot", () => {
    expect(findContactSlot(contacts, "EMERGENCY", 2)).toBeNull();
    expect(findContactSlot(contacts, "LOCAL_REFERENCE", 1)).toBeNull();
    expect(findContactSlot([], "EMERGENCY", 1)).toBeNull();
  });
});
