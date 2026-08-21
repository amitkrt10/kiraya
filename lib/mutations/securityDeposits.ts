import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SecurityDepositRow, SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";
import { translateDatabaseError, type MutationResult } from "./errors";

interface RecordDepositTransactionArgs {
  securityDepositId: string;
  organizationId: string;
  tenantId: string;
  leaseId: string;
  amount: number;
  transactionDate: string;
  description: string;
  referenceCode?: string;
  createdBy: string;
}

/**
 * Inserts a RECEIPT row directly — kiraya.security_deposit_transactions
 * has an ordinary can_write_organization()-gated INSERT policy for
 * RECEIPT/DEDUCTION (P5.4B confirmed only REFUND is blocked from direct
 * insertion). kiraya.validate_security_deposit_transaction() and
 * kiraya.sync_security_deposit_summary() do all the authoritative
 * validation and cached-summary sync — this function never computes
 * held/received/deducted itself.
 */
export async function recordDepositReceipt(args: RecordDepositTransactionArgs): Promise<MutationResult<SecurityDepositTransactionRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("security_deposit_transactions")
    .insert({
      organization_id: args.organizationId,
      security_deposit_id: args.securityDepositId,
      tenant_id: args.tenantId,
      lease_id: args.leaseId,
      transaction_type: "RECEIPT",
      transaction_date: args.transactionDate,
      amount: args.amount,
      description: args.description,
      reference_code: args.referenceCode || null,
      created_by: args.createdBy,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

interface CreateSecurityDepositWithReceiptArgs extends RecordDepositTransactionArgs {
  requiredAmount: number;
  depositReference: string;
}

/**
 * Creates the kiraya.security_deposits row first (ordinary
 * can_write_organization()-gated insert, confirmed live in P5.4A —
 * no dedicated creation RPC exists, and none is invented here), then
 * the RECEIPT transaction against it. Not wrapped in a database
 * transaction (no RPC bundles this) — if the receipt insert fails
 * after the deposit was created, the deposit row still exists as a
 * valid PENDING deposit with received_amount=0, a legitimate
 * intermediate state the user can retry a receipt against, exactly
 * the same non-rollback reasoning already established for lease
 * creation (rent rule/billing config) in P5.2C.
 */
export async function createSecurityDepositWithReceipt(
  args: CreateSecurityDepositWithReceiptArgs,
): Promise<MutationResult<{ deposit: SecurityDepositRow; transaction: SecurityDepositTransactionRow }>> {
  const supabase = await createClient();

  const { data: deposit, error: depositError } = await supabase
    .from("security_deposits")
    .insert({
      organization_id: args.organizationId,
      lease_id: args.leaseId,
      tenant_id: args.tenantId,
      deposit_reference: args.depositReference,
      required_amount: args.requiredAmount,
    })
    .select("*")
    .single();

  if (depositError) {
    return { error: translateDatabaseError(depositError) };
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("security_deposit_transactions")
    .insert({
      organization_id: args.organizationId,
      security_deposit_id: deposit.id,
      tenant_id: args.tenantId,
      lease_id: args.leaseId,
      transaction_type: "RECEIPT",
      transaction_date: args.transactionDate,
      amount: args.amount,
      description: args.description,
      reference_code: args.referenceCode || null,
      created_by: args.createdBy,
    })
    .select("*")
    .single();

  if (transactionError) {
    return { error: translateDatabaseError(transactionError) };
  }

  return { data: { deposit, transaction } };
}

/** Same shape as recordDepositReceipt(), transaction_type='DEDUCTION' — the "cannot exceed held" invariant is enforced by the database trigger. */
export async function recordDepositDeduction(
  args: Omit<RecordDepositTransactionArgs, "referenceCode">,
): Promise<MutationResult<SecurityDepositTransactionRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("security_deposit_transactions")
    .insert({
      organization_id: args.organizationId,
      security_deposit_id: args.securityDepositId,
      tenant_id: args.tenantId,
      lease_id: args.leaseId,
      transaction_type: "DEDUCTION",
      transaction_date: args.transactionDate,
      amount: args.amount,
      description: args.description,
      created_by: args.createdBy,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
