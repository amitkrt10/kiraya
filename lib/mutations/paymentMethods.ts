import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethodFormValues } from "@/lib/validation/paymentMethod";
import type { PaymentMethodRow } from "@/lib/queries/paymentMethods";
import { translateDatabaseError, type MutationResult } from "./errors";

export async function createPaymentMethod(
  organizationId: string,
  values: PaymentMethodFormValues,
): Promise<MutationResult<PaymentMethodRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .insert({
      organization_id: organizationId,
      code: values.code,
      name: values.name,
      method_type: values.methodType,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
