import { z } from "zod";
import { optionalTrimmedString } from "./shared";

const optionalIsoDate = () =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.iso.date({ error: "Enter a valid date." }).optional(),
  );

/** Mirrors supabase/migrations/20260813000114_kiraya_property_ownerships.sql. */
export const ownershipFormSchema = z
  .object({
    ownerId: z.string().trim().min(1, { error: "Select an owner." }),
    ownershipPercentage: z.coerce
      .number()
      .gt(0, { error: "Ownership percentage must be greater than 0." })
      .lte(100, { error: "Ownership percentage cannot exceed 100." }),
    ownershipStartDate: optionalIsoDate(),
    ownershipEndDate: optionalIsoDate(),
    notes: optionalTrimmedString(),
  })
  .refine(
    (value) =>
      !value.ownershipEndDate ||
      !value.ownershipStartDate ||
      value.ownershipEndDate >= value.ownershipStartDate,
    {
      error: "End date can't be before the start date.",
      path: ["ownershipEndDate"],
    },
  );

export type OwnershipFormValues = z.infer<typeof ownershipFormSchema>;

export function parseOwnershipFormData(formData: FormData) {
  return ownershipFormSchema.safeParse({
    ownerId: formData.get("ownerId"),
    ownershipPercentage: formData.get("ownershipPercentage"),
    ownershipStartDate: formData.get("ownershipStartDate"),
    ownershipEndDate: formData.get("ownershipEndDate"),
    notes: formData.get("notes"),
  });
}
