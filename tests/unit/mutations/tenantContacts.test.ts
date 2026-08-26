import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock, callsFor } from "../helpers/supabaseMock";
import type { TenantFormValues } from "@/lib/validation/tenant";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { upsertTenantContacts } = await import("@/lib/mutations/tenantContacts");

const baseValues: TenantFormValues = {
  displayName: "Asha Rao",
  tenantType: "INDIVIDUAL",
  status: "ACTIVE",
  countryCode: "IN",
} as TenantFormValues;

describe("upsertTenantContacts — writes exactly 4 slots, correctly typed", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("upserts all 4 slots (EMERGENCY 1/2, LOCAL_REFERENCE 1/2) keyed on tenant_id, scoped to the given tenant/organization", async () => {
    const { chain, calls } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await upsertTenantContacts("tenant-1", "org-a", {
      ...baseValues,
      emergencyContact1Name: "Ravi Kumar",
      emergencyContact1Phone: "9000011111",
      localReference2Name: "Priya Singh",
    });

    const [rows, options] = callsFor(calls, "upsert")[0] as [Record<string, unknown>[], { onConflict: string }];
    expect(rows).toHaveLength(4);
    expect(options.onConflict).toBe("tenant_id,contact_type,sort_order");

    const emergency1 = rows.find((r) => r.contact_type === "EMERGENCY" && r.sort_order === 1);
    expect(emergency1).toMatchObject({
      tenant_id: "tenant-1",
      organization_id: "org-a",
      name: "Ravi Kumar",
      phone: "9000011111",
      address: null,
    });

    const emergency2 = rows.find((r) => r.contact_type === "EMERGENCY" && r.sort_order === 2);
    expect(emergency2).toMatchObject({ tenant_id: "tenant-1", organization_id: "org-a", name: null, phone: null, address: null });

    const localRef1 = rows.find((r) => r.contact_type === "LOCAL_REFERENCE" && r.sort_order === 1);
    expect(localRef1).toMatchObject({ name: null, phone: null, address: null });

    const localRef2 = rows.find((r) => r.contact_type === "LOCAL_REFERENCE" && r.sort_order === 2);
    expect(localRef2).toMatchObject({ name: "Priya Singh" });
  });

  it("every row carries the caller-supplied tenant_id/organization_id — never anything client-derivable", async () => {
    const { chain, calls } = createChainMock({ data: null, error: null });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await upsertTenantContacts("tenant-2", "org-b", baseValues);

    const [rows] = callsFor(calls, "upsert")[0] as [Record<string, unknown>[]];
    for (const row of rows) {
      expect(row.tenant_id).toBe("tenant-2");
      expect(row.organization_id).toBe("org-b");
    }
  });

  it("returns an error when the upsert fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    const result = await upsertTenantContacts("tenant-1", "org-a", baseValues);

    expect(result.error).toBeDefined();
  });
});
