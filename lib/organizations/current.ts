import "server-only";
import { cookies } from "next/headers";
import type { OrganizationMembership } from "@/lib/permissions/resolve";

const CURRENT_ORG_COOKIE = "kiraya-current-org";

/**
 * Resolves which organization is "current" for this request: the cookie
 * value if it's still one the profile actually belongs to, otherwise the
 * first active membership. Returns null if the profile has no memberships
 * at all. The client never gets to assert an organization id on its own —
 * this only ever picks from `memberships`, which was already loaded from
 * RLS-scoped data.
 */
export async function getCurrentOrganization(
  memberships: OrganizationMembership[],
): Promise<OrganizationMembership | null> {
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const requestedId = cookieStore.get(CURRENT_ORG_COOKIE)?.value;

  const requested = memberships.find((membership) => membership.organizationId === requestedId);
  return requested ?? memberships[0] ?? null;
}

export { CURRENT_ORG_COOKIE };
