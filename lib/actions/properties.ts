"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parsePropertyFormData } from "@/lib/validation/property";
import { createProperty, updateProperty } from "@/lib/mutations/properties";
import type { PropertyRow } from "@/lib/queries/properties";

export interface PropertyActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  property?: PropertyRow;
}

export async function createPropertyAction(
  _prevState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parsePropertyFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createProperty(access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/properties");
  return { success: true, property: result.data };
}

export async function updatePropertyAction(
  propertyId: string,
  _prevState: PropertyActionState,
  formData: FormData,
): Promise<PropertyActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parsePropertyFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateProperty(propertyId, access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/properties");
  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true, property: result.data };
}
