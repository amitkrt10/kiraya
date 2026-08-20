"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { getRequestContext } from "@/lib/context/current";
import { parseBillingRunFormData } from "@/lib/validation/billingRun";
import { generateBillingRun } from "@/lib/mutations/billingRuns";
import { getBillingScopePreviewCount } from "@/lib/queries/billingRuns";

export interface BillingRunActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function generateBillingRunAction(
  _prevState: BillingRunActionState,
  formData: FormData,
): Promise<BillingRunActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseBillingRunFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const context = await getRequestContext();
  if (!context) {
    return { error: "You need to be signed in with an organization to do this." };
  }

  const result = await generateBillingRun(access.organizationId, context.profile.id, parsed.data);
  if (result.error || !result.data) {
    return { error: result.error ?? "Something went wrong running billing. Please try again." };
  }

  revalidatePath("/app/billing");
  redirect(`/app/billing/runs/${result.data.id}`);
}

export interface ScopePreviewState {
  count?: number;
  error?: string;
}

/**
 * Read-only estimate for the Generate Billing Run review step — mirrors
 * generate_billing_run()'s own scope query exactly (see
 * getBillingScopePreviewCount). Never authoritative: the RPC itself
 * re-evaluates scope at execution time.
 */
export async function previewBillingScopeAction(
  periodStart: string,
  periodEnd: string,
  propertyId: string | undefined,
): Promise<ScopePreviewState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  if (!periodStart || !periodEnd) {
    return { error: "Enter a period start and end date first." };
  }

  try {
    const count = await getBillingScopePreviewCount(access.organizationId, propertyId, periodStart, periodEnd);
    return { count };
  } catch {
    return { error: "Couldn't preview this scope. Please try again." };
  }
}
