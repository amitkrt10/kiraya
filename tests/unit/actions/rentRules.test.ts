import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRequireOrganizationWriteAccess = vi.fn();
vi.mock("@/lib/actions/shared", () => ({
  requireOrganizationWriteAccess: () => mockRequireOrganizationWriteAccess(),
}));

const mockCreateRentRule = vi.fn();
vi.mock("@/lib/mutations/rentRules", () => ({
  createRentRule: (...args: unknown[]) => mockCreateRentRule(...args),
}));

const mockGetLeaseUnitId = vi.fn();
vi.mock("@/lib/queries/leases", () => ({
  getLeaseUnitId: (...args: unknown[]) => mockGetLeaseUnitId(...args),
}));

const { revalidatePath } = await import("next/cache");
const { createRentRuleAction } = await import("@/lib/actions/rentRules");

function formData(): FormData {
  const fd = new FormData();
  fd.set("ruleName", "Base Rent");
  fd.set("monthlyRent", "20000");
  fd.set("effectiveFrom", "2026-01-01");
  return fd;
}

describe("createRentRuleAction — P6.3-E: revalidates Unit Detail too, not just the Lease page", () => {
  beforeEach(() => {
    mockRequireOrganizationWriteAccess.mockReset();
    mockCreateRentRule.mockReset();
    mockGetLeaseUnitId.mockReset();
    vi.mocked(revalidatePath).mockClear();
  });

  it("revalidates both /app/leases/[id] and the rule's unit's /app/units/[id] on success", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockCreateRentRule.mockResolvedValue({ data: { id: "rule-1" } });
    mockGetLeaseUnitId.mockResolvedValue("unit-1");

    await createRentRuleAction("lease-1", {}, formData());

    expect(revalidatePath).toHaveBeenCalledWith("/app/leases/lease-1");
    expect(revalidatePath).toHaveBeenCalledWith("/app/units/unit-1");
  });

  it("does not attempt to revalidate a unit path when the lease's unit can't be resolved", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockCreateRentRule.mockResolvedValue({ data: { id: "rule-1" } });
    mockGetLeaseUnitId.mockResolvedValue(null);

    await createRentRuleAction("lease-1", {}, formData());

    expect(revalidatePath).toHaveBeenCalledWith("/app/leases/lease-1");
    expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringMatching(/^\/app\/units\//));
  });

  it("never revalidates anything when the mutation fails", async () => {
    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockCreateRentRule.mockResolvedValue({ error: "boom" });

    await createRentRuleAction("lease-1", {}, formData());

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(mockGetLeaseUnitId).not.toHaveBeenCalled();
  });
});
