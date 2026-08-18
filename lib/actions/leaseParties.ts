"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseLeasePartyFormData } from "@/lib/validation/leaseParty";
import { createLeaseParty, updateLeaseParty } from "@/lib/mutations/leaseParties";
import type { LeasePartyRow } from "@/lib/queries/leaseParties";

export interface LeasePartyActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  party?: LeasePartyRow;
}

export async function createLeasePartyAction(
  leaseId: string,
  _prevState: LeasePartyActionState,
  formData: FormData,
): Promise<LeasePartyActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseLeasePartyFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createLeaseParty(access.organizationId, leaseId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/leases/${leaseId}`);
  return { success: true, party: result.data };
}

export async function updateLeasePartyAction(
  partyId: string,
  leaseId: string,
  _prevState: LeasePartyActionState,
  formData: FormData,
): Promise<LeasePartyActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseLeasePartyFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateLeaseParty(partyId, access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/leases/${leaseId}`);
  return { success: true, party: result.data };
}
