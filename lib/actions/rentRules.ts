"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseRentRuleFormData } from "@/lib/validation/rentRule";
import { createRentRule } from "@/lib/mutations/rentRules";
import { getLeaseUnitId } from "@/lib/queries/leases";
import type { RentRuleRow } from "@/lib/queries/rentRules";

export interface RentRuleActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  rentRule?: RentRuleRow;
}

export async function createRentRuleAction(
  leaseId: string,
  _prevState: RentRuleActionState,
  formData: FormData,
): Promise<RentRuleActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseRentRuleFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createRentRule(access.organizationId, leaseId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/leases/${leaseId}`);
  const unitId = await getLeaseUnitId(leaseId, access.organizationId);
  if (unitId) {
    revalidatePath(`/app/units/${unitId}`);
  }
  return { success: true, rentRule: result.data };
}
