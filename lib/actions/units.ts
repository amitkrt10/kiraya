"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseUnitFormData } from "@/lib/validation/unit";
import { createUnit, updateUnit } from "@/lib/mutations/units";
import type { UnitRow } from "@/lib/queries/units";

export interface UnitActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  unit?: UnitRow;
}

export async function createUnitAction(
  propertyId: string,
  _prevState: UnitActionState,
  formData: FormData,
): Promise<UnitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseUnitFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createUnit(access.organizationId, propertyId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/properties/${propertyId}`);
  return { success: true, unit: result.data };
}

export async function updateUnitAction(
  unitId: string,
  propertyId: string,
  _prevState: UnitActionState,
  formData: FormData,
): Promise<UnitActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseUnitFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateUnit(unitId, access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/properties/${propertyId}`);
  revalidatePath(`/app/units/${unitId}`);
  return { success: true, unit: result.data };
}
