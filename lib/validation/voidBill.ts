import { z } from "zod";
import { requiredTrimmedString } from "./shared";

/** Mirrors kiraya.void_bill()'s own required-reason check (errcode 22023). */
export const voidBillFormSchema = z.object({
  reason: requiredTrimmedString("Reason", 500),
});

export type VoidBillFormValues = z.infer<typeof voidBillFormSchema>;

export function parseVoidBillFormData(formData: FormData) {
  return voidBillFormSchema.safeParse({
    reason: formData.get("reason"),
  });
}
