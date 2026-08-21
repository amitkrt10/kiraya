"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseMeterFormData } from "@/lib/validation/meter";
import { createMeter, deactivateMeter } from "@/lib/mutations/meters";

export interface MeterActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createMeterAction(_prevState: MeterActionState, formData: FormData): Promise<MeterActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseMeterFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createMeter(access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/meters");
  return { success: true };
}

export async function deactivateMeterAction(meterId: string): Promise<MeterActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const result = await deactivateMeter(meterId, access.organizationId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/meters");
  revalidatePath(`/app/meters/${meterId}`);
  return { success: true };
}
