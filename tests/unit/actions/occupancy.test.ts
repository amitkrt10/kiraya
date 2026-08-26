import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireOrganizationWriteAccess = vi.fn();
vi.mock("@/lib/actions/shared", () => ({
  requireOrganizationWriteAccess: () => mockRequireOrganizationWriteAccess(),
}));

const mockUpdateLeaseOccupancy = vi.fn();
vi.mock("@/lib/mutations/occupancy", () => ({
  updateLeaseOccupancy: (...args: unknown[]) => mockUpdateLeaseOccupancy(...args),
}));

const { revalidatePath } = await import("next/cache");
const { updateOccupancyAction } = await import("@/lib/actions/occupancy");

function formData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("occupancyStartDate", "2026-01-01");
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

describe("updateOccupancyAction — P6.3-F: bound to (leaseId, unitId) from Unit Detail", () => {
  beforeEach(() => {
    mockRequireOrganizationWriteAccess.mockReset();
    mockUpdateLeaseOccupancy.mockReset();
    vi.mocked(revalidatePath).mockClear();
  });

  it("rejects without calling the mutation when the caller lacks write access", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: false, error: "You don't have permission to perform this action." });

    const result = await updateOccupancyAction("lease-1", "unit-1", {}, formData());

    expect(result.error).toBe("You don't have permission to perform this action.");
    expect(mockUpdateLeaseOccupancy).not.toHaveBeenCalled();
  });

  it("rejects with field errors and never calls the mutation on invalid input", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });

    const result = await updateOccupancyAction("lease-1", "unit-1", {}, formData({ occupancyStartDate: "" }));

    expect(result.error).toBe("Fix the highlighted fields.");
    expect(result.fieldErrors?.occupancyStartDate).toBeDefined();
    expect(mockUpdateLeaseOccupancy).not.toHaveBeenCalled();
  });

  it("calls the mutation with the bound leaseId and the server-derived organizationId", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-server" });
    mockUpdateLeaseOccupancy.mockResolvedValue({ data: { id: "lease-1" } });

    await updateOccupancyAction("lease-1", "unit-1", {}, formData());

    expect(mockUpdateLeaseOccupancy).toHaveBeenCalledWith(
      "lease-1",
      "org-server",
      expect.objectContaining({ occupancyStartDate: "2026-01-01" }),
    );
  });

  it("revalidates only the bound unit's own page on success", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockUpdateLeaseOccupancy.mockResolvedValue({ data: { id: "lease-1" } });

    await updateOccupancyAction("lease-1", "unit-42", {}, formData());

    expect(revalidatePath).toHaveBeenCalledWith("/app/units/unit-42");
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });

  it("returns success with the updated lease on success", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockUpdateLeaseOccupancy.mockResolvedValue({ data: { id: "lease-1", occupancy_start_date: "2026-01-01" } });

    const result = await updateOccupancyAction("lease-1", "unit-1", {}, formData());

    expect(result.success).toBe(true);
    expect(result.lease).toEqual({ id: "lease-1", occupancy_start_date: "2026-01-01" });
  });

  it("surfaces the mutation's translated error without a generic override, and never revalidates", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockUpdateLeaseOccupancy.mockResolvedValue({ error: "You don't have permission to perform this action." });

    const result = await updateOccupancyAction("lease-1", "unit-1", {}, formData());

    expect(result.error).toBe("You don't have permission to perform this action.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
