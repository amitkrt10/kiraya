import { z } from "zod";
import { optionalTrimmedString, requiredIsoDate, requiredTrimmedString } from "./shared";

/** Mirrors supabase/migrations/20260813000131_kiraya_payment_methods.sql / 20260813000132_kiraya_payments.sql. */
export const paymentFormSchema = z.object({
  tenantId: z.string().trim().min(1, { error: "Select a tenant." }),
  paymentMethodId: z.string().trim().min(1, { error: "Select a payment method." }),
  paymentDate: requiredIsoDate("Payment date"),
  amount: z.coerce.number().gt(0, { error: "Enter a payment amount greater than zero." }),
  referenceNumber: optionalTrimmedString(),
  bankName: optionalTrimmedString(),
  chequeNumber: optionalTrimmedString(),
  transactionReference: optionalTrimmedString(),
  notes: optionalTrimmedString(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function parsePaymentFormData(formData: FormData) {
  return paymentFormSchema.safeParse({
    tenantId: formData.get("tenantId"),
    paymentMethodId: formData.get("paymentMethodId"),
    paymentDate: formData.get("paymentDate"),
    amount: formData.get("amount"),
    referenceNumber: formData.get("referenceNumber"),
    bankName: formData.get("bankName"),
    chequeNumber: formData.get("chequeNumber"),
    transactionReference: formData.get("transactionReference"),
    notes: formData.get("notes"),
  });
}

/** Mirrors kiraya.reverse_payment()'s own required-reason check (errcode 22023). */
export const reversePaymentFormSchema = z.object({
  reason: requiredTrimmedString("Reason", 500),
});

export type ReversePaymentFormValues = z.infer<typeof reversePaymentFormSchema>;

export function parseReversePaymentFormData(formData: FormData) {
  return reversePaymentFormSchema.safeParse({
    reason: formData.get("reason"),
  });
}
