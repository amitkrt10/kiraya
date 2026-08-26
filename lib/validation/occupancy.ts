import { z } from "zod";
import { optionalIsoDate, optionalTrimmedString, requiredIsoDate } from "./shared";

/**
 * P6.3-F: the Tenant/Unit-facing replacement for editing a lease's
 * occupancy-lifecycle fields (formerly /app/leases/[id]/edit's
 * LeaseEditForm, whose Save action was found to be broken — see the
 * P6.3-F audit). Deliberately NOT leaseFormSchema: this covers only the
 * fields the audit found genuinely still meaningful for a human to set —
 * never lease_code/status/currency/tenantId/unitId, which are either
 * fully automatic (status, via the Assign Tenant RPC and Tenant Exit
 * completion) or never user-facing (lease_code, currency — always INR).
 */
export const occupancyFormSchema = z
  .object({
    occupancyStartDate: requiredIsoDate("Occupancy start date"),
    noticeDate: optionalIsoDate(),
    moveInDate: optionalIsoDate(),
    moveOutDate: optionalIsoDate(),
    notes: optionalTrimmedString(2000),
  })
  .refine((value) => !value.noticeDate || value.noticeDate >= value.occupancyStartDate, {
    error: "Notice date can't be before the occupancy start date.",
    path: ["noticeDate"],
  })
  .refine((value) => !value.moveInDate || value.moveInDate >= value.occupancyStartDate, {
    error: "Move-in date can't be before the occupancy start date.",
    path: ["moveInDate"],
  })
  .refine((value) => !value.moveOutDate || value.moveOutDate >= value.occupancyStartDate, {
    error: "Move-out date can't be before the occupancy start date.",
    path: ["moveOutDate"],
  });

export type OccupancyFormValues = z.infer<typeof occupancyFormSchema>;

export function parseOccupancyFormData(formData: FormData) {
  return occupancyFormSchema.safeParse({
    occupancyStartDate: formData.get("occupancyStartDate"),
    noticeDate: formData.get("noticeDate"),
    moveInDate: formData.get("moveInDate"),
    moveOutDate: formData.get("moveOutDate"),
    notes: formData.get("notes"),
  });
}
