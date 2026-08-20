import { z } from "zod";

/**
 * Mirrors kiraya.apply_tenant_credit_to_bill()'s own amount>0 check
 * (errcode 22003). The <= available-credit / <= bill-balance clamp is
 * authoritative on the database side (kiraya.post_credit_application_to_ledger()
 * re-derives and re-clamps independently) — this schema only enforces the
 * one client-side-checkable invariant that's always true regardless of the
 * live credit/balance figures at submit time.
 */
export const applyCreditFormSchema = z.object({
  amount: z.coerce.number().gt(0, { error: "Enter an amount greater than zero." }),
});

export type ApplyCreditFormValues = z.infer<typeof applyCreditFormSchema>;

export function parseApplyCreditFormData(formData: FormData) {
  return applyCreditFormSchema.safeParse({
    amount: formData.get("amount"),
  });
}
