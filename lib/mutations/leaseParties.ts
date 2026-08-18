import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LeasePartyFormValues } from "@/lib/validation/leaseParty";
import type { LeasePartyRow } from "@/lib/queries/leaseParties";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Note: kiraya.lease_parties has no organization-consistency trigger of its
 * own (unlike properties/units/leases) — RLS still protects writes via a
 * join to the parent lease's real organization, but this function must
 * always derive organization_id from a lease already confirmed to be in the
 * caller's org (never trust a client-supplied value).
 */
export async function createLeaseParty(
  organizationId: string,
  leaseId: string,
  values: LeasePartyFormValues,
): Promise<MutationResult<LeasePartyRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lease_parties")
    .insert({
      organization_id: organizationId,
      lease_id: leaseId,
      party_role: values.partyRole,
      tenant_id: values.tenantId ?? null,
      display_name: values.displayName ?? null,
      phone: values.phone ?? null,
      email: values.email ?? null,
      notes: values.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/** tenant_id isn't editable here — swap the tenant by ending... there's no end mechanism either; add a new party instead if the identity is wrong. */
export async function updateLeaseParty(
  partyId: string,
  organizationId: string,
  values: LeasePartyFormValues,
): Promise<MutationResult<LeasePartyRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lease_parties")
    .update({
      party_role: values.partyRole,
      display_name: values.displayName ?? null,
      phone: values.phone ?? null,
      email: values.email ?? null,
      notes: values.notes ?? null,
    })
    .eq("id", partyId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
