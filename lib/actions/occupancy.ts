"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizationWriteAccess } from "./shared";
import { parseOccupancyFormData } from "@/lib/validation/occupancy";
import { updateLeaseOccupancy } from "@/lib/mutations/occupancy";
import type { LeaseRow } from "@/lib/queries/leases";

export interface OccupancyActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  lease?: LeaseRow;
}

/**
 * P6.3-F: the Tenant/Unit-facing replacement for updateLeaseAction() —
 * bound to (leaseId, unitId) from Unit Detail, never asks the caller for
 * a lease id directly. Only revalidates the unit's own page: the
 * dedicated /app/leases/[id] page this used to also revalidate now just
 * redirects to this same unit page, so there's nothing else to refresh.
 */
export async function updateOccupancyAction(
  leaseId: string,
  unitId: string,
  _prevState: OccupancyActionState,
  formData: FormData,
): Promise<OccupancyActionState> {
  const access = await requireOrganizationWriteAccess();
  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseOccupancyFormData(formData);
  if (!parsed.success) {
    return { error: "Fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateLeaseOccupancy(leaseId, access.organizationId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/app/units/${unitId}`);
  return { success: true, lease: result.data };
}
