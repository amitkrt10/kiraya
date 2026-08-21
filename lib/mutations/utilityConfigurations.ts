import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UtilityConfigurationFormValues } from "@/lib/validation/utilityConfiguration";
import type { UtilityConfigurationRow } from "@/lib/queries/utilityConfigurations";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Plain configuration-row creation. utility_configurations has no
 * dedicated creation RPC — kiraya.validate_utility_configuration_
 * organization() (P5.5B.1) and the utility_configurations_no_active_
 * overlap exclusion constraint (P5.5B) are the actual safety net here,
 * not this function; a rejected insert surfaces through
 * translateDatabaseError().
 */
export async function createUtilityConfiguration(
  organizationId: string,
  utilityId: string,
  values: UtilityConfigurationFormValues,
): Promise<MutationResult<UtilityConfigurationRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utility_configurations")
    .insert({
      organization_id: organizationId,
      utility_id: utilityId,
      property_id: values.scope === "PROPERTY" ? values.propertyId : null,
      unit_id: values.scope === "UNIT" ? values.unitId : null,
      meter_type: values.meterType,
      fixed_amount: values.meterType === "FIXED" ? values.fixedAmount : null,
      effective_from: values.effectiveFrom,
      effective_to: values.effectiveTo ?? null,
      is_tenant_chargeable: values.isTenantChargeable,
      is_active: values.isActive,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}

/** Deactivate rather than delete — matches the "supersede by deactivating" convention already established for utility_configurations (P5.5B), and there is no DELETE RLS policy on this table anyway. */
export async function deactivateUtilityConfiguration(
  configurationId: string,
  organizationId: string,
): Promise<MutationResult<UtilityConfigurationRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utility_configurations")
    .update({ is_active: false })
    .eq("id", configurationId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
