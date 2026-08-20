import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BillRow } from "@/lib/queries/bills";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Calls the authoritative kiraya.finalize_bill() RPC. This locks the bill's
 * charges (recomputed subtotal/total from bill_items, DRAFT -> FINALIZED)
 * and posts it to the ledger via the trg_handle_bill_finalization trigger —
 * never a direct `update bills set status = 'FINALIZED'` from this app.
 */
export async function finalizeBill(billId: string, finalizedBy: string): Promise<MutationResult<BillRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finalize_bill", {
    p_bill_id: billId,
    p_finalized_by: finalizedBy,
  });

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * Calls the authoritative kiraya.void_bill() RPC. Requires a non-empty
 * reason (enforced by the RPC itself) and posts reversal ledger entries —
 * never a direct `update bills set status = 'VOID'` from this app.
 *
 * FINANCIAL DEFECT (tracked, not fixed in P5.2D): void_bill() cannot void a
 * bill that was never finalized — it sets status='VOID' without setting
 * finalized_at, which bills_finalization_check requires for any non-DRAFT
 * status, so the underlying UPDATE fails with a check-constraint violation.
 * The documented/validated flow is DRAFT -> FINALIZED -> VOID; the UI only
 * ever offers Void on a FINALIZED bill (see BillHeaderBand.tsx) so this
 * path is never reachable through the app, but the RPC itself is not fixed
 * here per explicit instruction.
 */
export async function voidBill(billId: string, voidedBy: string, reason: string): Promise<MutationResult<BillRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("void_bill", {
    p_bill_id: billId,
    p_voided_by: voidedBy,
    p_reason: reason,
  });

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
