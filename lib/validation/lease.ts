import { z } from "zod";
import {
  currencyCodeSchema,
  optionalIsoDate,
  optionalTrimmedString,
  requiredIsoDate,
  requiredTrimmedString,
} from "./shared";

/** Mirrors kiraya.lease_status. */
export const LEASE_STATUSES = ["DRAFT", "ACTIVE", "ENDED", "CANCELLED"] as const;

/**
 * Field-level constraints and cross-field checks mirror
 * supabase/migrations/20260813000117_kiraya_leases.sql exactly — this is a
 * client/server UX pre-check only ("validate obvious user errors client-side:
 * end before start"). The database's own check constraints (and the separate
 * overlap trigger, which this schema does NOT reimplement) remain the
 * authoritative enforcement.
 */
export const leaseFormSchema = z
  .object({
    leaseCode: requiredTrimmedString("Lease code"),
    tenantId: z.string().trim().min(1, { error: "Select a tenant." }),
    unitId: z.string().trim().min(1, { error: "Select a unit." }),
    status: z.enum(LEASE_STATUSES),
    agreementStartDate: requiredIsoDate("Agreement start date"),
    agreementEndDate: optionalIsoDate(),
    occupancyStartDate: requiredIsoDate("Occupancy start date"),
    actualEndDate: optionalIsoDate(),
    noticeDate: optionalIsoDate(),
    moveInDate: optionalIsoDate(),
    moveOutDate: optionalIsoDate(),
    currencyCode: currencyCodeSchema,
    notes: optionalTrimmedString(),
  })
  .refine(
    (value) => !value.agreementEndDate || value.agreementEndDate >= value.agreementStartDate,
    { error: "Agreement end date can't be before the agreement start date.", path: ["agreementEndDate"] },
  )
  .refine((value) => value.occupancyStartDate >= value.agreementStartDate, {
    error: "Occupancy can't start before the agreement start date.",
    path: ["occupancyStartDate"],
  })
  .refine(
    (value) => !value.actualEndDate || value.actualEndDate >= value.occupancyStartDate,
    { error: "Actual end date can't be before occupancy started.", path: ["actualEndDate"] },
  )
  .refine((value) => !value.noticeDate || value.noticeDate >= value.agreementStartDate, {
    error: "Notice date can't be before the agreement start date.",
    path: ["noticeDate"],
  })
  .refine((value) => !value.moveInDate || value.moveInDate >= value.occupancyStartDate, {
    error: "Move-in date can't be before occupancy started.",
    path: ["moveInDate"],
  })
  .refine((value) => !value.moveOutDate || value.moveOutDate >= value.occupancyStartDate, {
    error: "Move-out date can't be before occupancy started.",
    path: ["moveOutDate"],
  });

export type LeaseFormValues = z.infer<typeof leaseFormSchema>;

export function parseLeaseFormData(formData: FormData) {
  return leaseFormSchema.safeParse({
    leaseCode: formData.get("leaseCode"),
    tenantId: formData.get("tenantId"),
    unitId: formData.get("unitId"),
    status: formData.get("status"),
    agreementStartDate: formData.get("agreementStartDate"),
    agreementEndDate: formData.get("agreementEndDate"),
    occupancyStartDate: formData.get("occupancyStartDate"),
    actualEndDate: formData.get("actualEndDate"),
    noticeDate: formData.get("noticeDate"),
    moveInDate: formData.get("moveInDate"),
    moveOutDate: formData.get("moveOutDate"),
    currencyCode: formData.get("currencyCode"),
    notes: formData.get("notes"),
  });
}
