import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BillingConfigFormValues } from "@/lib/validation/billingConfig";
import type { BillingConfigRow } from "@/lib/queries/billingConfigs";
import { translateDatabaseError, type MutationResult } from "./errors";

/** Append-only, same reasoning as lib/mutations/rentRules.ts. */
export async function createBillingConfig(
  organizationId: string,
  leaseId: string,
  values: BillingConfigFormValues,
): Promise<MutationResult<BillingConfigRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lease_billing_configs")
    .insert({
      organization_id: organizationId,
      lease_id: leaseId,
      billing_frequency: values.billingFrequency,
      billing_day: values.billingDay ?? null,
      billing_anchor_month: values.billingAnchorMonth ?? null,
      proration_method: values.prorationMethod,
      first_bill_prorate: values.firstBillProrate,
      final_bill_prorate: values.finalBillProrate,
      bill_in_advance: values.billInAdvance,
      due_days_after_bill: values.dueDaysAfterBill,
      effective_from: values.effectiveFrom,
      effective_to: values.effectiveTo ?? null,
      notes: values.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
