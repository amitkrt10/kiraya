"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseUtilityRateFormData } from "@/lib/validation/utilityRate";
import { createUtilityRate, deactivateUtilityRate } from "@/lib/mutations/utilityRates";

export interface UtilityRateActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createUtilityRateAction(
  utilityId: string,
  _prevState: UtilityRateActionState,
  formData: FormData,
): Promise<UtilityRateActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseUtilityRateFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createUtilityRate(access.organizationId, utilityId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/utilities/${utilityId}`);
  return { success: true };
}

export async function deactivateUtilityRateAction(rateId: string, utilityId: string): Promise<UtilityRateActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const result = await deactivateUtilityRate(rateId, access.organizationId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/utilities/${utilityId}`);
  return { success: true };
}
