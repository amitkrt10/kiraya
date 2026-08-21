"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseUtilityFormData } from "@/lib/validation/utility";
import { createUtility } from "@/lib/mutations/utilities";

export interface UtilityActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createUtilityAction(_prevState: UtilityActionState, formData: FormData): Promise<UtilityActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseUtilityFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createUtility(access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/utilities");
  return { success: true };
}
