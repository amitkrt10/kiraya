import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockRequireOrganizationWriteAccess = vi.fn();
vi.mock("@/lib/actions/shared", () => ({
  requireOrganizationWriteAccess: () => mockRequireOrganizationWriteAccess(),
}));

const mockGetExitSettlementById = vi.fn();
const mockGetDepositRefunds = vi.fn();
const mockGetTenantCreditRefunds = vi.fn();
vi.mock("@/lib/queries/tenantExits", () => ({
  getExitSettlementById: (...args: unknown[]) => mockGetExitSettlementById(...args),
  getDepositRefunds: (...args: unknown[]) => mockGetDepositRefunds(...args),
  getTenantCreditRefunds: (...args: unknown[]) => mockGetTenantCreditRefunds(...args),
}));

const mockGetSecurityDepositByLease = vi.fn();
vi.mock("@/lib/queries/securityDeposits", () => ({
  getSecurityDepositByLease: (...args: unknown[]) => mockGetSecurityDepositByLease(...args),
}));

const mockCreateDepositRefund = vi.fn();
const mockCompleteDepositRefund = vi.fn();
vi.mock("@/lib/mutations/tenantExits", () => ({
  initiateTenantExit: vi.fn(),
  calculateExitSettlement: vi.fn(),
  addSettlementAdjustment: vi.fn(),
  finalizeExitSettlement: vi.fn(),
  createDepositRefund: (...args: unknown[]) => mockCreateDepositRefund(...args),
  completeDepositRefund: (...args: unknown[]) => mockCompleteDepositRefund(...args),
  createCreditRefund: vi.fn(),
  completeCreditRefund: vi.fn(),
  confirmActualExitDateIfMissing: vi.fn(),
  completeTenantExit: vi.fn(),
}));

const { createDepositRefundAction } = await import("@/lib/actions/tenantExits");

function formData(): FormData {
  const fd = new FormData();
  fd.set("refundDate", "2026-08-26");
  return fd;
}

/**
 * Tenant A holds two occupancies:
 *   Lease A -> Unit 101 -> Deposit A (₹30,000)
 *   Lease B -> Unit 102 -> Deposit B (₹50,000)
 * getSecurityDepositByLease is the only thing that can resolve a
 * deposit here — modeled as a lookup table keyed by lease_id so a test
 * calling it with the wrong lease_id gets the WRONG deposit (or none),
 * exactly like the real, lease-scoped query would.
 */
const depositA = { id: "deposit-a", lease_id: "lease-a", tenant_id: "tenant-a", required_amount: 30000 };
const depositB = { id: "deposit-b", lease_id: "lease-b", tenant_id: "tenant-a", required_amount: 50000 };
const depositsByLease: Record<string, typeof depositA> = { "lease-a": depositA, "lease-b": depositB };

const settlementA = {
  id: "settlement-a",
  tenant_exit_id: "exit-a",
  lease_id: "lease-a",
  tenant_id: "tenant-a",
  deposit_origin_refundable: 30000,
};
const settlementB = {
  id: "settlement-b",
  tenant_exit_id: "exit-b",
  lease_id: "lease-b",
  tenant_id: "tenant-a",
  deposit_origin_refundable: 50000,
};

describe("createDepositRefundAction — resolves the deposit by the exit's own lease, never by tenant alone", () => {
  beforeEach(() => {
    mockRequireOrganizationWriteAccess.mockReset();
    mockGetExitSettlementById.mockReset();
    mockGetDepositRefunds.mockReset();
    mockGetSecurityDepositByLease.mockReset();
    mockCreateDepositRefund.mockReset();
    mockCompleteDepositRefund.mockReset();

    mockRequireOrganizationWriteAccess.mockResolvedValue({ ok: true, organizationId: "org-1" });
    mockGetDepositRefunds.mockResolvedValue([]);
    mockGetSecurityDepositByLease.mockImplementation((leaseId: string) => Promise.resolve(depositsByLease[leaseId] ?? null));
    mockCreateDepositRefund.mockResolvedValue({ data: { id: "refund-1" } });
    mockCompleteDepositRefund.mockResolvedValue({ data: { id: "refund-1", status: "COMPLETED" } });
  });

  it("Scenario A: exiting Lease A resolves Deposit A, never Deposit B", async () => {
    mockGetExitSettlementById.mockResolvedValue(settlementA);

    const result = await createDepositRefundAction("settlement-a", "tenant-a", {}, formData());

    expect(result.error).toBeUndefined();
    expect(mockGetSecurityDepositByLease).toHaveBeenCalledWith("lease-a", "org-1");
    expect(mockGetSecurityDepositByLease).not.toHaveBeenCalledWith("lease-b", expect.anything());
    const [refundArgs] = mockCreateDepositRefund.mock.calls[0] as [{ securityDepositId: string }];
    expect(refundArgs.securityDepositId).toBe("deposit-a");
  });

  it("Scenario A, reversed: exiting Lease B resolves Deposit B, never Deposit A", async () => {
    mockGetExitSettlementById.mockResolvedValue(settlementB);

    const result = await createDepositRefundAction("settlement-b", "tenant-a", {}, formData());

    expect(result.error).toBeUndefined();
    expect(mockGetSecurityDepositByLease).toHaveBeenCalledWith("lease-b", "org-1");
    const [refundArgs] = mockCreateDepositRefund.mock.calls[0] as [{ securityDepositId: string }];
    expect(refundArgs.securityDepositId).toBe("deposit-b");
  });

  it("never looks up the deposit by tenantId — only by the settlement's lease_id", async () => {
    mockGetExitSettlementById.mockResolvedValue(settlementA);

    await createDepositRefundAction("settlement-a", "tenant-a", {}, formData());

    // The only argument getSecurityDepositByLease ever receives as its
    // first parameter is a lease id, never "tenant-a" — this is what
    // structurally prevents the tenant-scoped "most recent deposit" bug
    // from coming back.
    for (const call of mockGetSecurityDepositByLease.mock.calls) {
      expect(call[0]).not.toBe("tenant-a");
    }
  });

  it("rejects when the caller-supplied tenantId does not match the settlement's own tenant (defense against a tampered/stale bound argument)", async () => {
    mockGetExitSettlementById.mockResolvedValue(settlementA);

    const result = await createDepositRefundAction("settlement-a", "some-other-tenant", {}, formData());

    expect(result.error).toBe("Exit settlement does not belong to this tenant.");
    expect(mockGetSecurityDepositByLease).not.toHaveBeenCalled();
    expect(mockCreateDepositRefund).not.toHaveBeenCalled();
  });

  it("errors cleanly when no deposit exists for the exit's own lease, even if the tenant has a deposit on a different lease", async () => {
    mockGetExitSettlementById.mockResolvedValue({ ...settlementA, lease_id: "lease-c" });

    const result = await createDepositRefundAction("settlement-a", "tenant-a", {}, formData());

    expect(result.error).toBe("No security deposit is on file for this lease.");
    expect(mockCreateDepositRefund).not.toHaveBeenCalled();
  });
});
