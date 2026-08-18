import "server-only";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";

export type WriteAccess =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

/**
 * Every properties/units/owners/property_ownerships write action needs the
 * same two checks: a resolved org context, and kiraya.can_write_organization
 * for that org (the single write gate all four tables' RLS policies share —
 * see lib/permissions/resolve.ts). Centralized so every action performs the
 * exact same check RLS will re-verify anyway — this is a UX layer, not the
 * security boundary.
 */
export async function requireOrganizationWriteAccess(): Promise<WriteAccess> {
  const context = await getRequestContext();
  if (!context || !context.organization) {
    return { ok: false, error: "You need to be signed in with an organization to do this." };
  }

  const allowed = await canWriteOrganization(context.organization.organizationId);
  if (!allowed) {
    return { ok: false, error: "You don't have permission to make changes in this organization." };
  }

  return { ok: true, organizationId: context.organization.organizationId };
}
