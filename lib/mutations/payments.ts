import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentFormValues } from "@/lib/validation/payment";
import type { PaymentRow } from "@/lib/queries/payments";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Creates the payment row only — organization_id is always server-derived,
 * never taken from form input. status is left to its database DEFAULT
 * ('POSTED'); everything downstream (ledger posting, automatic oldest-bill-
 * first allocation, bill status synchronization) is handled entirely by
 * kiraya.trg_process_posted_payment -> kiraya.process_posted_payment(),
 * which now correctly fires on INSERT (see
 * 20260820015101_kiraya_fix_payment_insert_processing.sql). This app never
 * computes or writes allocations, ledger entries, or bill totals itself.
 */
export async function createPayment(
  organizationId: string,
  values: PaymentFormValues,
): Promise<MutationResult<PaymentRow>> {
  const supabase = await createClient();
  const paymentNumber = `PAY-${values.paymentDate.replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { data, error } = await supabase
    .from("payments")
    .insert({
      organization_id: organizationId,
      tenant_id: values.tenantId,
      payment_method_id: values.paymentMethodId,
      payment_number: paymentNumber,
      payment_date: values.paymentDate,
      amount: values.amount,
      reference_number: values.referenceNumber ?? null,
      bank_name: values.bankName ?? null,
      cheque_number: values.chequeNumber ?? null,
      transaction_reference: values.transactionReference ?? null,
      notes: values.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * Calls the authoritative kiraya.reverse_payment() RPC — never a direct
 * `update payments set status = 'REVERSED'` from this app. Requires a
 * non-empty reason (enforced by the RPC itself).
 */
export async function reversePayment(
  paymentId: string,
  reversedBy: string,
  reason: string,
): Promise<MutationResult<{ reversalId: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reverse_payment", {
    p_payment_id: paymentId,
    p_reversed_by: reversedBy,
    p_reason: reason,
  });

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data: { reversalId: data } };
}
