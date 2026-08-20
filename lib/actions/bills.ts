"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { getRequestContext } from "@/lib/context/current";
import { parseVoidBillFormData } from "@/lib/validation/voidBill";
import { finalizeBill, voidBill } from "@/lib/mutations/bills";

export interface BillActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function finalizeBillAction(billId: string): Promise<BillActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await finalizeBill(billId, context.profile.id);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/billing/bills/${billId}`);
  revalidatePath("/app/billing/bills");
  return { success: true };
}

export async function voidBillAction(
  billId: string,
  _prevState: BillActionState,
  formData: FormData,
): Promise<BillActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseVoidBillFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await voidBill(billId, context.profile.id, parsed.data.reason);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/billing/bills/${billId}`);
  revalidatePath("/app/billing/bills");
  return { success: true };
}
