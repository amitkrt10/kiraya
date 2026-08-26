"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseTenantUnitAssignmentFormData } from "@/lib/validation/tenantUnitAssignment";
import { createTenantUnitAssignment } from "@/lib/mutations/tenantUnitAssignment";

export interface TenantUnitAssignmentActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/**
 * organization_id is derived server-side from the caller's own write
 * access, never taken from the form — unitId is a bound argument from
 * the Unit Detail page's own URL, not user input either. The unit's
 * assignability and the tenant/unit's organization membership are
 * re-verified by kiraya.create_tenant_unit_assignment() itself
 * (P6.3-B) regardless of what the client believed when the drawer
 * opened — this action never trusts a stale "this unit looked vacant"
 * read from earlier in the page lifecycle.
 */
export async function createTenantUnitAssignmentAction(
  unitId: string,
  _prevState: TenantUnitAssignmentActionState,
  formData: FormData,
): Promise<TenantUnitAssignmentActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseTenantUnitAssignmentFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await createTenantUnitAssignment(access.organizationId, unitId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/units/${unitId}`);
  return { success: true };
}
