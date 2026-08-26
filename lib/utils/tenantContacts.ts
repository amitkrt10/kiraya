import type { TenantContactRow, TenantContactType } from "@/lib/queries/tenantContacts";

/**
 * Finds one specific slot out of an already-fetched list — never
 * refetches. A pure, no-I/O helper deliberately kept out of
 * lib/queries/tenantContacts.ts (which has `import "server-only"`) so
 * client components (e.g. TenantForm, prefilling an edit form) can use
 * it without pulling a server-only module into the client bundle.
 */
export function findContactSlot(
  contacts: TenantContactRow[],
  contactType: TenantContactType,
  sortOrder: 1 | 2,
): TenantContactRow | null {
  return contacts.find((contact) => contact.contact_type === contactType && contact.sort_order === sortOrder) ?? null;
}
