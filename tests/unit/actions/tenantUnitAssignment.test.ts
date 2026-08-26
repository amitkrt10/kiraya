import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireOrganizationWriteAccess = vi.fn();
vi.mock("@/lib/actions/shared", () => ({
  requireOrganizationWriteAccess: () => mockRequireOrganizationWriteAccess(),
}));

const mockCreateTenantUnitAssignment = vi.fn();
vi.mock("@/lib/mutations/tenantUnitAssignment", () => ({
  createTenantUnitAssignment: (...args: unknown[]) => mockCreateTenantUnitAssignment(...args),
}));

const { createTenantUnitAssignmentAction } = await import("@/lib/actions/tenantUnitAssignment");

function formData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    tenantId: "tenant-1",
    occupancyStartDate: "2026-01-01",
    ruleName: "Base Rent",
    monthlyRent: "20000",
    billingFrequency: "MONTHLY",
    billingDay: "1",
    prorationMethod: "CALENDAR_DAYS",
    dueDaysAfterBill: "0",
  };
  for (const [key, value] of Object.entries({ ...defaults, ...overrides })) {
    fd.set(key, value);
  }
  return fd;
}

describe("createTenantUnitAssignmentAction", () => {
  beforeEach(() => {
    mockRequireOrganizationWriteAccess.mockReset();
    mockCreateTenantUnitAssignment.mockReset();
  });

  it("rejects without calling the mutation when the caller lacks write access", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: false, error: "You don't have permission to perform this action." });

    const result = await createTenantUnitAssignmentAction("unit-1", {}, formData());

    expect(result.error).toBe("You don't have permission to perform this action.");
    expect(mockCreateTenantUnitAssignment).not.toHaveBeenCalled();
  });

  it("rejects with field errors and never calls the mutation on invalid input", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });

    const result = await createTenantUnitAssignmentAction("unit-1", {}, formData({ tenantId: "" }));

    expect(result.error).toBe("Fix the highlighted fields.");
    expect(result.fieldErrors?.tenantId).toBeDefined();
    expect(mockCreateTenantUnitAssignment).not.toHaveBeenCalled();
  });

  it("calls the mutation with the server-derived organizationId and the bound unitId — never values from the form", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-server" });
    mockCreateTenantUnitAssignment.mockResolvedValue({ data: { id: "lease-1" } });

    await createTenantUnitAssignmentAction("unit-server", {}, formData());

    expect(mockCreateTenantUnitAssignment).toHaveBeenCalledWith(
      "org-server",
      "unit-server",
      expect.objectContaining({ tenantId: "tenant-1" }),
    );
  });

  it("returns success on a successful assignment", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockCreateTenantUnitAssignment.mockResolvedValue({ data: { id: "lease-1" } });

    const result = await createTenantUnitAssignmentAction("unit-1", {}, formData());

    expect(result.success).toBe(true);
  });

  it("surfaces the mutation's translated error (e.g. the race-condition message) without a generic override", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockCreateTenantUnitAssignment.mockResolvedValue({
      error: "This unit was just assigned to another tenant. Please choose a different unit.",
    });

    const result = await createTenantUnitAssignmentAction("unit-1", {}, formData());

    expect(result.error).toBe("This unit was just assigned to another tenant. Please choose a different unit.");
  });
});
