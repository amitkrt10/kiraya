import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BillingRunFormValues } from "@/lib/validation/billingRun";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Calls the authoritative kiraya.generate_billing_run() RPC — this
 * application never computes bills itself. The RPC iterates ACTIVE leases
 * in scope, generates a bill per lease (catching each lease's failure
 * independently, e.g. a missing billing configuration or an already-billed
 * period per bills_lease_period_unique_idx), and returns the new run's id.
 */
export async function generateBillingRun(
  organizationId: string,
  initiatedBy: string,
  values: BillingRunFormValues,
): Promise<MutationResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_billing_run", {
    p_organization_id: organizationId,
    p_period_start: values.periodStart,
    p_period_end: values.periodEnd,
    p_bill_date: values.billDate,
    p_due_date: values.dueDate,
    p_property_id: values.propertyId,
    p_initiated_by: initiatedBy,
  });

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data: { id: data } };
}
