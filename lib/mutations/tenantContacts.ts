import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TenantFormValues, ContactFieldPrefix } from "@/lib/validation/tenant";
import { CONTACT_FIELD_PREFIXES } from "@/lib/validation/tenant";
import { translateDatabaseError, type MutationResult } from "./errors";

const SLOT_META: Record<ContactFieldPrefix, { contactType: "EMERGENCY" | "LOCAL_REFERENCE"; sortOrder: 1 | 2 }> = {
  emergencyContact1: { contactType: "EMERGENCY", sortOrder: 1 },
  emergencyContact2: { contactType: "EMERGENCY", sortOrder: 2 },
  localReference1: { contactType: "LOCAL_REFERENCE", sortOrder: 1 },
  localReference2: { contactType: "LOCAL_REFERENCE", sortOrder: 2 },
};

/**
 * Upserts all 4 contact slots (2 EMERGENCY + 2 LOCAL_REFERENCE) for a
 * tenant in one call, keyed on tenant_contacts_slot_unique_idx
 * (tenant_id, contact_type, sort_order). Always writes all 4 slots,
 * even ones the user left entirely blank — this is what makes clearing
 * a previously-filled slot back to empty on Edit actually work (an
 * upsert that only fired for non-empty slots could never null out an
 * existing one). A brand-new, still-empty slot this creates is
 * indistinguishable from "no data" everywhere it's read, since every
 * caller already filters empty rows for display.
 */
export async function upsertTenantContacts(
  tenantId: string,
  organizationId: string,
  values: TenantFormValues,
): Promise<MutationResult<true>> {
  const supabase = await createClient();

  const rows = CONTACT_FIELD_PREFIXES.map((prefix) => ({
    tenant_id: tenantId,
    organization_id: organizationId,
    contact_type: SLOT_META[prefix].contactType,
    sort_order: SLOT_META[prefix].sortOrder,
    name: values[`${prefix}Name`] ?? null,
    phone: values[`${prefix}Phone`] ?? null,
    address: values[`${prefix}Address`] ?? null,
  }));

  const { error } = await supabase.from("tenant_contacts").upsert(rows, { onConflict: "tenant_id,contact_type,sort_order" });

  if (error) {
    return { error: translateDatabaseError(error) };
  }
  return { data: true };
}
