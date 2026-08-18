"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseOwnershipFormData } from "@/lib/validation/ownership";
import {
  createPropertyOwnership,
  updatePropertyOwnership,
  removePropertyOwnership,
} from "@/lib/mutations/ownerships";
import type { PropertyOwnershipRow } from "@/lib/queries/owners";

export interface OwnershipActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  ownership?: PropertyOwnershipRow;
}

export async function createOwnershipAction(
  propertyId: string,
  _prevState: OwnershipActionState,
  formData: FormData,
): Promise<OwnershipActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseOwnershipFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createPropertyOwnership(access.organizationId, propertyId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true, ownership: result.data };
}

export async function updateOwnershipAction(
  ownershipId: string,
  propertyId: string,
  _prevState: OwnershipActionState,
  formData: FormData,
): Promise<OwnershipActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseOwnershipFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updatePropertyOwnership(ownershipId, access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true, ownership: result.data };
}

export async function removeOwnershipAction(
  ownershipId: string,
  propertyId: string,
): Promise<OwnershipActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const result = await removePropertyOwnership(ownershipId, access.organizationId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true, ownership: result.data };
}
