import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UtilityFormValues } from "@/lib/validation/utility";
import type { UtilityRow } from "@/lib/queries/utilities";
import { translateDatabaseError, type MutationResult } from "./errors";

/** Plain catalog-entry creation — utilities has no dedicated creation RPC, same shape as createPaymentMethod(). */
export async function createUtility(organizationId: string, values: UtilityFormValues): Promise<MutationResult<UtilityRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utilities")
    .insert({
      organization_id: organizationId,
      code: values.code,
      name: values.name,
      description: values.description ?? null,
      unit_name: values.unitName ?? null,
      is_metered: values.isMetered,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
