import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { RentRuleFormValues } from "@/lib/validation/rentRule";
import type { RentRuleRow } from "@/lib/queries/rentRules";
import { translateDatabaseError, type MutationResult } from "./errors";

/**
 * Append-only — a new rent amount is a new row, never an edit of history
 * (see lib/queries/rentRules.ts). auto_apply is left at its database default
 * (false); there's no billing engine yet to honor it.
 */
export async function createRentRule(
  organizationId: string,
  leaseId: string,
  values: RentRuleFormValues,
): Promise<MutationResult<RentRuleRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lease_rent_rules")
    .insert({
      organization_id: organizationId,
      lease_id: leaseId,
      rule_name: values.ruleName,
      monthly_rent: values.monthlyRent,
      effective_from: values.effectiveFrom,
      effective_to: values.effectiveTo ?? null,
      notes: values.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data };
}
