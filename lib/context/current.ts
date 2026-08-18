import "server-only";
import { cache } from "react";
import { getCurrentProfile, type Profile } from "@/lib/auth/profile";
import { resolvePermissionContext, type PermissionContext } from "@/lib/permissions/resolve";
import { getCurrentOrganization } from "@/lib/organizations/current";
import type { OrganizationMembership } from "@/lib/permissions/resolve";

export interface RequestContext {
  profile: Profile;
  permissions: PermissionContext;
  organization: OrganizationMembership | null;
}

/**
 * Resolves profile + permission context + current organization once per
 * request, no matter how many Server Components call it (React's `cache()`
 * dedupes by argument-less call within a single render pass — this is the
 * standard Next.js App Router pattern for sharing request-scoped data
 * between a layout and its pages without prop drilling or a client context).
 *
 * Returns null when there's no session/profile — callers decide what to do,
 * same contract as getCurrentProfile().
 */
export const getRequestContext = cache(async (): Promise<RequestContext | null> => {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const permissions = await resolvePermissionContext(profile.id);
  const organization = await getCurrentOrganization(permissions.organizations);

  return { profile, permissions, organization };
});
