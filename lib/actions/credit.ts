"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { getRequestContext } from "@/lib/context/current";
import { parseApplyCreditFormData } from "@/lib/validation/applyCredit";
import { applyTenantCreditToBill } from "@/lib/mutations/credit";

export interface ApplyCreditActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function applyCreditAction(
  billId: string,
  tenantId: string,
  _prevState: ApplyCreditActionState,
  formData: FormData,
): Promise<ApplyCreditActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseApplyCreditFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await applyTenantCreditToBill(billId, parsed.data.amount, context.profile.id);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/billing/bills/${billId}`);
  revalidatePath("/app/billing/bills");
  revalidatePath(`/app/tenants/${tenantId}`);
  revalidatePath("/app/ledger");
  return { success: true };
}
