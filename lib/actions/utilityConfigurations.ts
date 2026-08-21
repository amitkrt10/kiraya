"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseUtilityConfigurationFormData } from "@/lib/validation/utilityConfiguration";
import { createUtilityConfiguration, deactivateUtilityConfiguration } from "@/lib/mutations/utilityConfigurations";

export interface UtilityConfigurationActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createUtilityConfigurationAction(
  utilityId: string,
  _prevState: UtilityConfigurationActionState,
  formData: FormData,
): Promise<UtilityConfigurationActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseUtilityConfigurationFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createUtilityConfiguration(access.organizationId, utilityId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/utilities/${utilityId}`);
  return { success: true };
}

export async function deactivateUtilityConfigurationAction(
  configurationId: string,
  utilityId: string,
): Promise<UtilityConfigurationActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const result = await deactivateUtilityConfiguration(configurationId, access.organizationId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/utilities/${utilityId}`);
  return { success: true };
}
