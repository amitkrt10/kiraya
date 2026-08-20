import { z } from "zod";
import { requiredTrimmedString } from "./shared";

/** Mirrors kiraya.payment_method_type. */
export const PAYMENT_METHOD_TYPES = ["CASH", "ONLINE", "DISCOUNT", "OTHER"] as const;

export const paymentMethodFormSchema = z.object({
  code: requiredTrimmedString("Code", 50),
  name: requiredTrimmedString("Name", 100),
  methodType: z.enum(PAYMENT_METHOD_TYPES),
});

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;

export function parsePaymentMethodFormData(formData: FormData) {
  return paymentMethodFormSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    methodType: formData.get("methodType"),
  });
}
