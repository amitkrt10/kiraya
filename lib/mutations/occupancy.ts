import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OccupancyFormValues } from "@/lib/validation/occupancy";
import type { LeaseRow } from "@/lib/queries/leases";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * P6.3-F: updates only the occupancy-lifecycle fields the audit found
 * genuinely editable — never lease_code/status/currency_code/tenant_id/
 * unit_id, which stay exactly as they are. agreement_start_date is kept
 * in lockstep with occupancy_start_date (the audit found these identical
 * for all 64 hosted leases created via the Assign Tenant RPC — there is
 * no live path where they diverge, so this is a rename to one
 * user-facing field, not two independently edited ones).
 */
export async function updateLeaseOccupancy(
  leaseId: string,
  organizationId: string,
  values: OccupancyFormValues,
): Promise<MutationResult<LeaseRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .update({
      agreement_start_date: values.occupancyStartDate,
      occupancy_start_date: values.occupancyStartDate,
      notice_date: values.noticeDate ?? null,
      move_in_date: values.moveInDate ?? null,
      move_out_date: values.moveOutDate ?? null,
      notes: values.notes ?? null,
    })
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
