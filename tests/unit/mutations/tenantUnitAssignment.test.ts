import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TenantUnitAssignmentFormValues } from "@/lib/validation/tenantUnitAssignment";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { createTenantUnitAssignment } = await import("@/lib/mutations/tenantUnitAssignment");

const baseValues: TenantUnitAssignmentFormValues = {
  tenantId: "tenant-1",
  occupancyStartDate: "2026-01-01",
  ruleName: "Base Rent",
  monthlyRent: 20000,
  billingFrequency: "MONTHLY",
  billingDay: 1,
  prorationMethod: "CALENDAR_DAYS",
  dueDaysAfterBill: 0,
} as TenantUnitAssignmentFormValues;

describe("createTenantUnitAssignment — thin RPC wrapper, never reimplements the four inserts", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("calls kiraya.create_tenant_unit_assignment() with the organization/unit from server context, never recomputing them from the form", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: { id: "lease-1" }, error: null }));
    mockCreateClient.mockReturnValue({ rpc });

    await createTenantUnitAssignment("org-server", "unit-server", baseValues);

    expect(rpc).toHaveBeenCalledWith(
      "create_tenant_unit_assignment",
      expect.objectContaining({
        p_organization_id: "org-server",
        p_unit_id: "unit-server",
        p_tenant_id: "tenant-1",
        p_occupancy_start_date: "2026-01-01",
        p_rent_rule_name: "Base Rent",
        p_monthly_rent: 20000,
      }),
    );
  });

  it("never sends p_billing_frequency/effective dates or first/final/advance-bill flags of its own invention — only what the schema defines", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: { id: "lease-1" }, error: null }));
    mockCreateClient.mockReturnValue({ rpc });

    await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    const [, args] = rpc.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(args).not.toHaveProperty("p_effective_from");
    expect(args).not.toHaveProperty("p_first_bill_prorate");
    expect(args).not.toHaveProperty("p_final_bill_prorate");
    expect(args).not.toHaveProperty("p_bill_in_advance");
  });

  it("omits deposit params entirely when no deposit amount was given", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: { id: "lease-1" }, error: null }));
    mockCreateClient.mockReturnValue({ rpc });

    await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    const [, args] = rpc.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(args.p_deposit_required_amount).toBeUndefined();
  });

  it("passes the deposit amount through when provided", async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: { id: "lease-1" }, error: null }));
    mockCreateClient.mockReturnValue({ rpc });

    await createTenantUnitAssignment("org-a", "unit-1", { ...baseValues, depositRequiredAmount: 20000 });

    const [, args] = rpc.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(args.p_deposit_required_amount).toBe(20000);
  });

  it("returns the created lease on success", async () => {
    mockCreateClient.mockReturnValue({ rpc: vi.fn(() => Promise.resolve({ data: { id: "lease-1", status: "ACTIVE" }, error: null })) });

    const result = await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    expect(result.data).toEqual({ id: "lease-1", status: "ACTIVE" });
  });

  it("translates a raw unique-violation on leases_unit_active_unique_idx into a friendly race-condition message", async () => {
    mockCreateClient.mockReturnValue({
      rpc: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: {
            code: "23505",
            message: 'duplicate key value violates unique constraint "leases_unit_active_unique_idx"',
          },
        }),
      ),
    });

    const result = await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    expect(result.error).toBe("This unit was just assigned to another tenant. Please choose a different unit.");
  });

  it("passes through the RPC's own clean, authored 'not assignable' message unchanged", async () => {
    mockCreateClient.mockReturnValue({
      rpc: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: {
            code: "23514",
            message: "This unit is not currently assignable (already occupied, or marked maintenance/unavailable).",
          },
        }),
      ),
    });

    const result = await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    expect(result.error).toBe("This unit is not currently assignable (already occupied, or marked maintenance/unavailable).");
  });

  it("P6.3-H: passes through the RPC's own clean 'tenant not active' rejection unchanged", async () => {
    mockCreateClient.mockReturnValue({
      rpc: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: { code: "23514", message: "This tenant is not active and cannot be assigned to a unit." },
        }),
      ),
    });

    const result = await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    expect(result.error).toBe("This tenant is not active and cannot be assigned to a unit.");
  });

  it("P6.3-H: passes through the RPC's own clean 'tenant does not exist' rejection unchanged (cross-org or nonexistent tenant id)", async () => {
    mockCreateClient.mockReturnValue({
      rpc: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: { code: "23503", message: "Tenant does not exist." },
        }),
      ),
    });

    const result = await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    expect(result.error).toBe("Tenant does not exist.");
  });

  it("translates a raw RLS policy violation into a friendly permission message", async () => {
    mockCreateClient.mockReturnValue({
      rpc: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: { code: "42501", message: 'new row violates row-level security policy for table "leases"' },
        }),
      ),
    });

    const result = await createTenantUnitAssignment("org-a", "unit-1", baseValues);

    expect(result.error).toBe("You don't have permission to perform this action.");
  });
});
