"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseBillingConfigFormData } from "@/lib/validation/billingConfig";
import { createBillingConfig } from "@/lib/mutations/billingConfigs";
import { getLeaseUnitId } from "@/lib/queries/leases";
import type { BillingConfigRow } from "@/lib/queries/billingConfigs";

export interface BillingConfigActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  billingConfig?: BillingConfigRow;
}

export async function createBillingConfigAction(
  leaseId: string,
  _prevState: BillingConfigActionState,
  formData: FormData,
): Promise<BillingConfigActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseBillingConfigFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createBillingConfig(access.organizationId, leaseId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/leases/${leaseId}`);
  const unitId = await getLeaseUnitId(leaseId, access.organizationId);
  if (unitId) {
    revalidatePath(`/app/units/${unitId}`);
  }
  return { success: true, billingConfig: result.data };
}
