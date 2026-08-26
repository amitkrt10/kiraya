import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TenantUnitAssignmentFormValues } from "@/lib/validation/tenantUnitAssignment";
import type { Database } from "@/types/database";
import { translateDatabaseError, type MutationResult } from "./errors";

export type LeaseRow = Database["kiraya"]["Tables"]["leases"]["Row"];

/**
 * The one and only way this application creates a Tenant-Unit
 * assignment — a thin call to kiraya.create_tenant_unit_assignment()
 * (P6.3-B), never a reimplementation of its four inserts in application
 * code. The RPC itself is what guarantees atomicity (a single PL/pgSQL
 * function body — any failure anywhere unwinds everything) and
 * authorization (security invoker: every insert is still subject to its
 * own table's ordinary RLS, exactly as if issued directly) — this
 * function only shapes the call and translates its errors.
 *
 * first_bill_prorate/final_bill_prorate/bill_in_advance are never passed
 * — the RPC's own column defaults apply, matching the form's decision
 * not to expose currently-inert fields.
 */
export async function createTenantUnitAssignment(
  organizationId: string,
  unitId: string,
  values: TenantUnitAssignmentFormValues,
): Promise<MutationResult<LeaseRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_tenant_unit_assignment", {
    p_organization_id: organizationId,
    p_tenant_id: values.tenantId,
    p_unit_id: unitId,
    p_occupancy_start_date: values.occupancyStartDate,
    p_rent_rule_name: values.ruleName,
    p_monthly_rent: values.monthlyRent,
    p_occupancy_notes: values.occupancyNotes ?? undefined,
    p_billing_frequency: values.billingFrequency,
    p_billing_day: values.billingDay ?? undefined,
    p_proration_method: values.prorationMethod,
    p_due_days_after_bill: values.dueDaysAfterBill,
    p_deposit_required_amount: values.depositRequiredAmount ?? undefined,
    p_deposit_reference: values.depositReference ?? undefined,
    p_deposit_notes: values.depositNotes ?? undefined,
  });

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data: data as LeaseRow };
}
