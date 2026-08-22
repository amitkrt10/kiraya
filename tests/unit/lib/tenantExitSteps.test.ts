import { describe, expect, it } from "vitest";
import {
  resolveReachableStep,
  isStepUnlocked,
  canEditAdjustments,
  canFinalizeSettlement,
  isSettlementFinalized,
  canCompleteExit,
} from "@/lib/tenantExitSteps";
import type { TenantExitRow, ExitSettlementRow } from "@/lib/queries/tenantExits";

function makeExit(overrides: Partial<TenantExitRow> = {}): TenantExitRow {
  return {
    id: "exit-1",
    organization_id: "org-1",
    lease_id: "lease-1",
    tenant_id: "tenant-1",
    exit_reference: "EXIT-1",
    status: "INITIATED",
    notice_date: null,
    planned_exit_date: null,
    actual_exit_date: null,
    handover_date: null,
    reason: null,
    final_meter_reading_date: null,
    initiated_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeSettlement(overrides: Partial<ExitSettlementRow> = {}): ExitSettlementRow {
  return {
    id: "settlement-1",
    organization_id: "org-1",
    tenant_exit_id: "exit-1",
    lease_id: "lease-1",
    tenant_id: "tenant-1",
    settlement_reference: "SET-1",
    settlement_date: "2026-02-01",
    status: "DRAFT",
    previous_dues: 0,
    final_charges: 0,
    deposit_deduction: 0,
    tenant_credit: 0,
    credit_applied: 0,
    deposit_consumed: 0,
    final_amount_due: 0,
    final_amount_refundable: 0,
    deposit_origin_refundable: 0,
    credit_origin_refundable: 0,
    currency_code: "INR",
    finalized_at: null,
    finalized_by: null,
    notes: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("resolveReachableStep", () => {
  it("step 1 only when no exit exists", () => {
    expect(resolveReachableStep(null, null)).toBe(1);
  });

  it("step 2 when the exit exists but no settlement yet", () => {
    expect(resolveReachableStep(makeExit(), null)).toBe(2);
  });

  it("step 6 while the settlement is still DRAFT", () => {
    expect(resolveReachableStep(makeExit(), makeSettlement({ status: "DRAFT" }))).toBe(6);
  });

  it("step 9 once the settlement is FINALIZED", () => {
    expect(resolveReachableStep(makeExit({ status: "PENDING_SETTLEMENT" }), makeSettlement({ status: "FINALIZED" }))).toBe(9);
  });

  it("step 9 once the exit is COMPLETED", () => {
    expect(resolveReachableStep(makeExit({ status: "COMPLETED" }), makeSettlement({ status: "FINALIZED" }))).toBe(9);
  });
});

describe("isStepUnlocked", () => {
  it("steps at or before the reachable step are unlocked", () => {
    const exit = makeExit();
    const settlement = makeSettlement({ status: "DRAFT" });
    expect(isStepUnlocked(1, exit, settlement)).toBe(true);
    expect(isStepUnlocked(6, exit, settlement)).toBe(true);
  });

  it("steps beyond the reachable step are locked", () => {
    const exit = makeExit();
    const settlement = makeSettlement({ status: "DRAFT" });
    expect(isStepUnlocked(7, exit, settlement)).toBe(false);
    expect(isStepUnlocked(9, exit, settlement)).toBe(false);
  });
});

describe("canEditAdjustments / canFinalizeSettlement / isSettlementFinalized", () => {
  it("true only while DRAFT", () => {
    expect(canEditAdjustments(makeSettlement({ status: "DRAFT" }))).toBe(true);
    expect(canFinalizeSettlement(makeSettlement({ status: "DRAFT" }))).toBe(true);
    expect(isSettlementFinalized(makeSettlement({ status: "DRAFT" }))).toBe(false);
  });

  it("false once FINALIZED", () => {
    expect(canEditAdjustments(makeSettlement({ status: "FINALIZED" }))).toBe(false);
    expect(canFinalizeSettlement(makeSettlement({ status: "FINALIZED" }))).toBe(false);
    expect(isSettlementFinalized(makeSettlement({ status: "FINALIZED" }))).toBe(true);
  });

  it("false when there is no settlement at all", () => {
    expect(canEditAdjustments(null)).toBe(false);
    expect(canFinalizeSettlement(null)).toBe(false);
    expect(isSettlementFinalized(null)).toBe(false);
  });
});

describe("canCompleteExit", () => {
  it("true only when PENDING_SETTLEMENT and settlement is FINALIZED", () => {
    expect(canCompleteExit(makeExit({ status: "PENDING_SETTLEMENT" }), makeSettlement({ status: "FINALIZED" }))).toBe(true);
  });

  it("false when the exit is still INITIATED, even with a finalized settlement", () => {
    expect(canCompleteExit(makeExit({ status: "INITIATED" }), makeSettlement({ status: "FINALIZED" }))).toBe(false);
  });

  it("false when the settlement is still DRAFT", () => {
    expect(canCompleteExit(makeExit({ status: "PENDING_SETTLEMENT" }), makeSettlement({ status: "DRAFT" }))).toBe(false);
  });

  it("false when the exit is already COMPLETED", () => {
    expect(canCompleteExit(makeExit({ status: "COMPLETED" }), makeSettlement({ status: "FINALIZED" }))).toBe(false);
  });
});
