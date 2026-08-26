import { describe, expect, it, vi, beforeEach } from "vitest";
import { createChainMock } from "../helpers/supabaseMock";
import type { BillingRunRow } from "@/lib/queries/billingRuns";

vi.mock("server-only", () => ({}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const { getBillingRunFailures } = await import("@/lib/queries/billingRuns");

function makeRun(overrides: Partial<BillingRunRow> = {}): BillingRunRow {
  return {
    id: "run-1",
    organization_id: "org-1",
    property_id: null,
    run_code: "RUN-01",
    bill_date: "2026-08-01",
    due_date: null,
    period_start: "2026-08-01",
    period_end: "2026-08-31",
    status: "COMPLETED",
    total_bills: 5,
    successful_bills: 4,
    failed_bills: 1,
    started_at: "2026-08-01T00:00:00Z",
    completed_at: "2026-08-01T00:05:00Z",
    initiated_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:05:00Z",
    ...overrides,
  };
}

describe("getBillingRunFailures — P6.3-E: Tenant + Unit, never the internal lease code/id", () => {
  beforeEach(() => {
    mockCreateClient.mockReset();
  });

  it("returns an empty list without querying anything when failed_bills is zero", async () => {
    const fromSpy = vi.fn();
    mockCreateClient.mockReturnValue({ from: fromSpy });

    const result = await getBillingRunFailures(makeRun({ failed_bills: 0 }));

    expect(result).toEqual([]);
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it("resolves each failure's tenant/unit/property via the lease join, never exposing the lease id/code", async () => {
    const auditLogsChain = createChainMock({
      data: [
        {
          id: "audit-1",
          resource_id: "lease-1",
          description: "insufficient billing configuration",
          created_at: "2026-08-01T00:01:00Z",
          new_data: { period_start: "2026-08-01", period_end: "2026-08-31" },
        },
      ],
      error: null,
    });
    const leasesChain = createChainMock({
      data: [
        {
          id: "lease-1",
          tenant_id: "tenant-1",
          unit_id: "unit-1",
          tenants: { display_name: "Asha Rao" },
          units: { unit_code: "A-101", properties: { name: "Shanti Nivas" } },
        },
      ],
      error: null,
    });
    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => (table === "audit_logs" ? auditLogsChain.chain : leasesChain.chain)),
    });

    const result = await getBillingRunFailures(makeRun({}));

    expect(result).toEqual([
      {
        id: "audit-1",
        description: "insufficient billing configuration",
        created_at: "2026-08-01T00:01:00Z",
        tenantId: "tenant-1",
        tenantName: "Asha Rao",
        unitId: "unit-1",
        unitCode: "A-101",
        propertyName: "Shanti Nivas",
      },
    ]);
    expect(result[0]).not.toHaveProperty("leaseCode");
    expect(result[0]).not.toHaveProperty("resource_id");
  });

  it("filters out audit log rows from a different billing period", async () => {
    const auditLogsChain = createChainMock({
      data: [
        {
          id: "audit-1",
          resource_id: "lease-1",
          description: "boom",
          created_at: "2026-07-01T00:01:00Z",
          new_data: { period_start: "2026-07-01", period_end: "2026-07-31" },
        },
      ],
      error: null,
    });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => auditLogsChain.chain) });

    const result = await getBillingRunFailures(makeRun({ period_start: "2026-08-01", period_end: "2026-08-31" }));

    expect(result).toEqual([]);
  });

  it("throws a descriptive error when the audit log query fails", async () => {
    const { chain } = createChainMock({ data: null, error: { message: "boom" } });
    mockCreateClient.mockReturnValue({ from: vi.fn(() => chain) });

    await expect(getBillingRunFailures(makeRun({}))).rejects.toThrow("Failed to load this run's failures: boom");
  });
});
