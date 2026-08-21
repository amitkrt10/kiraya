import type { TenantExitRow, ExitSettlementRow } from "@/lib/queries/tenantExits";

export const EXIT_STEPS = [
  { n: 1, slug: "initiation", label: "Exit Initiation" },
  { n: 2, slug: "review", label: "Tenant / Lease Review" },
  { n: 3, slug: "dues", label: "Outstanding Dues" },
  { n: 4, slug: "deposit", label: "Deposit Review" },
  { n: 5, slug: "adjustments", label: "Adjustments" },
  { n: 6, slug: "settlement", label: "Settlement" },
  { n: 7, slug: "statement", label: "Final Statement" },
  { n: 8, slug: "refund", label: "Refund / Amount Payable" },
  { n: 9, slug: "completion", label: "Completion" },
] as const;

export type ExitStepSlug = (typeof EXIT_STEPS)[number]["slug"];

/**
 * Which steps are reachable, purely from the exit/settlement's own
 * status columns — no financial calculation, just conditional logic on
 * already-authoritative state. Steps 2-4 (review-only) are reachable as
 * soon as the exit exists; step 5 (Adjustments) and 6 (Settlement) too,
 * but adjustments can only be added while the settlement is still DRAFT
 * (kiraya.prevent_finalized_exit_settlement_item_mutation() enforces
 * this server-side regardless — this is a UX convenience, not the
 * security boundary). Steps 7-9 require the settlement to be FINALIZED.
 */
export function resolveReachableStep(exit: TenantExitRow | null, settlement: ExitSettlementRow | null): number {
  if (!exit) return 1;
  if (!settlement) return 2;
  if (settlement.status === "FINALIZED" || settlement.status === "SETTLED") {
    if (exit.status === "COMPLETED") return 9;
    return 9;
  }
  return 6;
}

export function isStepUnlocked(stepNumber: number, exit: TenantExitRow | null, settlement: ExitSettlementRow | null): boolean {
  return stepNumber <= resolveReachableStep(exit, settlement);
}

export function canEditAdjustments(settlement: ExitSettlementRow | null): boolean {
  return settlement?.status === "DRAFT";
}

export function canFinalizeSettlement(settlement: ExitSettlementRow | null): boolean {
  return settlement?.status === "DRAFT";
}

export function isSettlementFinalized(settlement: ExitSettlementRow | null): boolean {
  return settlement?.status === "FINALIZED" || settlement?.status === "SETTLED";
}

export function canCompleteExit(exit: TenantExitRow | null, settlement: ExitSettlementRow | null): boolean {
  return exit?.status === "PENDING_SETTLEMENT" && isSettlementFinalized(settlement);
}
