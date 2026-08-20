"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { getRequestContext } from "@/lib/context/current";
import { parsePaymentFormData, parseReversePaymentFormData } from "@/lib/validation/payment";
import { createPayment, reversePayment } from "@/lib/mutations/payments";

export interface PaymentActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createPaymentAction(
  _prevState: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parsePaymentFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createPayment(access.organizationId, parsed.data);
  if (result.error || !result.data) {
    return { error: result.error ?? "Something went wrong recording this payment. Please try again." };
  }

  revalidatePath("/app/payments");
  redirect(`/app/payments/${result.data.id}`);
}

export interface ReversePaymentActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function reversePaymentAction(
  paymentId: string,
  _prevState: ReversePaymentActionState,
  formData: FormData,
): Promise<ReversePaymentActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseReversePaymentFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await reversePayment(paymentId, context.profile.id, parsed.data.reason);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/payments/${paymentId}`);
  revalidatePath("/app/payments");
  return { success: true };
}
