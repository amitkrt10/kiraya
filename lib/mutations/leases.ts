import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LeaseFormValues } from "@/lib/validation/lease";
import type { LeaseRow } from "@/lib/queries/leases";
import { translateDatabaseError, type MutationResult } from "./errors";

/** Fields shared by create and edit — dates/status/currency/notes, never id/org/created_at. */
function toLeaseFields(values: LeaseFormValues) {
  return {
    lease_code: values.leaseCode,
    status: values.status,
    agreement_start_date: values.agreementStartDate,
    agreement_end_date: values.agreementEndDate ?? null,
    occupancy_start_date: values.occupancyStartDate,
    actual_end_date: values.actualEndDate ?? null,
    notice_date: values.noticeDate ?? null,
    move_in_date: values.moveInDate ?? null,
    move_out_date: values.moveOutDate ?? null,
    currency_code: values.currencyCode,
    notes: values.notes ?? null,
  };
}

/**
 * organization_id is derived server-side from the caller's current org
 * context — never from the form. tenant_id/unit_id are set here, at
 * creation, only.
 */
export async function createLease(
  organizationId: string,
  values: LeaseFormValues,
): Promise<MutationResult<LeaseRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .insert({
      organization_id: organizationId,
      tenant_id: values.tenantId,
      unit_id: values.unitId,
      ...toLeaseFields(values),
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * tenant_id/unit_id are intentionally not editable here — the approved
 * design has no "reassign lease" control, matching the same reasoning as
 * units not being reassignable between properties in P5.2B. Flagged as an
 * open product decision for a later phase if it's actually needed.
 */
export async function updateLease(
  leaseId: string,
  organizationId: string,
  values: LeaseFormValues,
): Promise<MutationResult<LeaseRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leases")
    .update(toLeaseFields(values))
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
