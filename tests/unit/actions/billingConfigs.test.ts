import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireOrganizationWriteAccess = vi.fn();
vi.mock("@/lib/actions/shared", () => ({
  requireOrganizationWriteAccess: () => mockRequireOrganizationWriteAccess(),
}));

const mockCreateBillingConfig = vi.fn();
vi.mock("@/lib/mutations/billingConfigs", () => ({
  createBillingConfig: (...args: unknown[]) => mockCreateBillingConfig(...args),
}));

const mockGetLeaseUnitId = vi.fn();
vi.mock("@/lib/queries/leases", () => ({
  getLeaseUnitId: (...args: unknown[]) => mockGetLeaseUnitId(...args),
}));

const { revalidatePath } = await import("next/cache");
const { createBillingConfigAction } = await import("@/lib/actions/billingConfigs");

function formData(): FormData {
  const fd = new FormData();
  fd.set("billingFrequency", "MONTHLY");
  fd.set("billingDay", "1");
  fd.set("prorationMethod", "CALENDAR_DAYS");
  fd.set("dueDaysAfterBill", "0");
  fd.set("effectiveFrom", "2026-01-01");
  return fd;
}

describe("createBillingConfigAction — P6.3-E: revalidates Unit Detail too, not just the Lease page", () => {
  beforeEach(() => {
    mockRequireOrganizationWriteAccess.mockReset();
    mockCreateBillingConfig.mockReset();
    mockGetLeaseUnitId.mockReset();
    vi.mocked(revalidatePath).mockClear();
  });

  it("revalidates both /app/leases/[id] and the config's unit's /app/units/[id] on success", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockCreateBillingConfig.mockResolvedValue({ data: { id: "config-1" } });
    mockGetLeaseUnitId.mockResolvedValue("unit-1");

    await createBillingConfigAction("lease-1", {}, formData());

    expect(revalidatePath).toHaveBeenCalledWith("/app/leases/lease-1");
    expect(revalidatePath).toHaveBeenCalledWith("/app/units/unit-1");
  });

  it("never revalidates anything when the mutation fails", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockCreateBillingConfig.mockResolvedValue({ error: "boom" });

    await createBillingConfigAction("lease-1", {}, formData());

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
