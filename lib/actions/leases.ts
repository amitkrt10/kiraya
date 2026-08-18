"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseLeaseFormData } from "@/lib/validation/lease";
import { parseRentRuleFormData } from "@/lib/validation/rentRule";
import { parseBillingConfigFormData } from "@/lib/validation/billingConfig";
import { createLease, updateLease } from "@/lib/mutations/leases";
import { createRentRule } from "@/lib/mutations/rentRules";
import { createBillingConfig } from "@/lib/mutations/billingConfigs";

export interface LeaseActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/** Pulls `${prefix}.fieldName` entries out of a combined FormData into their own FormData with the prefix stripped. */
function extractNamespaced(formData: FormData, prefix: string): FormData {
  const result = new FormData();
  const marker = `${prefix}.`;
  for (const [key, value] of formData.entries()) {
    if (key.startsWith(marker)) {
      result.set(key.slice(marker.length), value);
    }
  }
  return result;
}

function prefixFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
  prefix: string,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (value) result[`${prefix}.${key}`] = value;
  }
  return result;
}

/**
 * The create form submits lease terms + an initial rent rule + an initial
 * billing config together (namespaced field names avoid collisions on
 * shared names like `notes`/`effectiveFrom`). These are sequential inserts,
 * not one DB transaction (no RPC exists for this) — if the lease itself
 * saves but a follow-up insert fails, the lease still exists as a valid
 * DRAFT and the redirect flags exactly what's missing so it can be added
 * from the lease detail page, rather than losing the whole submission.
 */
export async function createLeaseAction(
  _prevState: LeaseActionState,
  formData: FormData,
): Promise<LeaseActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const leaseParsed = parseLeaseFormData(extractNamespaced(formData, "lease"));
  const rentRuleParsed = parseRentRuleFormData(extractNamespaced(formData, "rentRule"));
  const billingConfigParsed = parseBillingConfigFormData(extractNamespaced(formData, "billingConfig"));

  if (!leaseParsed.success || !rentRuleParsed.success || !billingConfigParsed.success) {
    const fieldErrors: Record<string, string[]> = {
      ...(leaseParsed.success ? {} : prefixFieldErrors(z.flattenError(leaseParsed.error).fieldErrors, "lease")),
      ...(rentRuleParsed.success
        ? {}
        : prefixFieldErrors(z.flattenError(rentRuleParsed.error).fieldErrors, "rentRule")),
      ...(billingConfigParsed.success
        ? {}
        : prefixFieldErrors(z.flattenError(billingConfigParsed.error).fieldErrors, "billingConfig")),
    };
    return { error: "Fix the highlighted fields.", fieldErrors };
  }

  const leaseResult = await createLease(access.organizationId, leaseParsed.data);
  if (leaseResult.error || !leaseResult.data) {
    return { error: leaseResult.error ?? "Something went wrong saving this. Please try again." };
  }

  const leaseId = leaseResult.data.id;
  const incomplete: string[] = [];

  const rentRuleResult = await createRentRule(access.organizationId, leaseId, rentRuleParsed.data);
  if (rentRuleResult.error) incomplete.push("rentRule");

  const billingConfigResult = await createBillingConfig(access.organizationId, leaseId, billingConfigParsed.data);
  if (billingConfigResult.error) incomplete.push("billingConfig");

  revalidatePath("/app/leases");
  const query = incomplete.length > 0 ? `?setupIncomplete=${incomplete.join(",")}` : "";
  redirect(`/app/leases/${leaseId}${query}`);
}

export async function updateLeaseAction(
  leaseId: string,
  _prevState: LeaseActionState,
  formData: FormData,
): Promise<LeaseActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseLeaseFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateLease(leaseId, access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/app/leases");
  revalidatePath(`/app/leases/${leaseId}`);
  redirect(`/app/leases/${leaseId}`);
}
