"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parsePaymentMethodFormData } from "@/lib/validation/paymentMethod";
import { createPaymentMethod } from "@/lib/mutations/paymentMethods";

export interface PaymentMethodActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createPaymentMethodAction(
  _prevState: PaymentMethodActionState,
  formData: FormData,
): Promise<PaymentMethodActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parsePaymentMethodFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createPaymentMethod(access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/payments/methods");
  revalidatePath("/app/payments/new");
  return { success: true };
}
