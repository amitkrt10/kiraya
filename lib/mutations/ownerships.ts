import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OwnershipFormValues } from "@/lib/validation/ownership";
import type { PropertyOwnershipRow } from "@/lib/queries/owners";
import { translateDatabaseError, type MutationResult } from "./errors";

/** organization_id/property_id/owner_id are derived server-side — never taken from form input. */
export async function createPropertyOwnership(
  organizationId: string,
  propertyId: string,
  values: OwnershipFormValues,
): Promise<MutationResult<PropertyOwnershipRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_ownerships")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      owner_id: values.ownerId,
      ownership_percentage: values.ownershipPercentage,
      ownership_start_date: values.ownershipStartDate ?? null,
      ownership_end_date: values.ownershipEndDate ?? null,
      notes: values.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/** owner_id isn't editable here — reassigning which owner a record refers to isn't supported; end this one and create a new one instead. */
export async function updatePropertyOwnership(
  ownershipId: string,
  organizationId: string,
  values: OwnershipFormValues,
): Promise<MutationResult<PropertyOwnershipRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("property_ownerships")
    .update({
      ownership_percentage: values.ownershipPercentage,
      ownership_start_date: values.ownershipStartDate ?? null,
      ownership_end_date: values.ownershipEndDate ?? null,
      notes: values.notes ?? null,
    })
    .eq("id", ownershipId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/**
 * There is no DELETE RLS policy on kiraya.property_ownerships (confirmed in
 * supabase/migrations/20260813000191_kiraya_owner_rls.sql) — "removing" an
 * owner is implemented as ending their interest today, matching the
 * schema's own ownership_end_date design and the task's archive-over-delete
 * guidance, not a hard delete.
 */
export async function removePropertyOwnership(
  ownershipId: string,
  organizationId: string,
): Promise<MutationResult<PropertyOwnershipRow>> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("property_ownerships")
    .update({ ownership_end_date: today })
    .eq("id", ownershipId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
