import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UtilityRateFormValues } from "@/lib/validation/utilityRate";
import type { UtilityRateRow } from "@/lib/queries/utilityRates";
import { translateDatabaseError, type MutationResult } from "./errors";

export async function createUtilityRate(
  organizationId: string,
  utilityId: string,
  values: UtilityRateFormValues,
): Promise<MutationResult<UtilityRateRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utility_rates")
    .insert({
      organization_id: organizationId,
      utility_id: utilityId,
      rate: values.rate,
      unit_name: values.unitName,
      effective_from: values.effectiveFrom,
      effective_to: values.effectiveTo ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/** Deactivate rather than delete — a rate already used by a generated bill_item is snapshotted there, so deactivating never alters history. No DELETE RLS policy exists on utility_rates either. */
export async function deactivateUtilityRate(rateId: string, organizationId: string): Promise<MutationResult<UtilityRateRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utility_rates")
    .update({ is_active: false })
    .eq("id", rateId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
