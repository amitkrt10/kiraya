import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface OrganizationMembership {
  organizationId: string;
  organizationName: string;
  status: string;
  roleCodes: string[];
  isOrgAdmin: boolean;
}

export interface PermissionContext {
  profileId: string;
  isSuperAdmin: boolean;
  organizations: OrganizationMembership[];
}

/**
 * Resolves the full authorization context for the current session: whether
 * they're a platform SUPER_ADMIN, and every organization they belong to with
 * that org's role codes. Backed entirely by `kiraya`'s existing RLS-scoped
 * tables and RPCs (`kiraya.is_super_admin`, `kiraya.is_organization_admin`)
 * — this never invents authorization logic, it only reads what the database
 * already decided.
 *
 * Role/permission catalogs are sparsely seeded today (see P5.2A findings) —
 * `roleCodes` may legitimately be empty for a member whose role assignment
 * hasn't been seeded yet. Treat an empty list as "unknown", not "no access":
 * `isOrgAdmin` and RLS remain the actual authority.
 */
export async function resolvePermissionContext(profileId: string): Promise<PermissionContext> {
  const supabase = await createClient();

  const [{ data: isSuperAdminResult }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase.rpc("is_super_admin"),
      supabase
        .from("organization_members")
        .select(
          `
          organization_id,
          status,
          organizations ( name ),
          organization_member_roles ( roles ( code ) )
        `,
        )
        .eq("profile_id", profileId)
        .eq("status", "ACTIVE"),
    ]);

  if (membershipsError) {
    throw new Error(`Failed to load organization memberships: ${membershipsError.message}`);
  }

  const isSuperAdmin = isSuperAdminResult ?? false;

  const organizations: OrganizationMembership[] = await Promise.all(
    (memberships ?? []).map(async (membership) => {
      const { data: isOrgAdmin } = await supabase.rpc("is_organization_admin", {
        p_organization_id: membership.organization_id,
      });

      return {
        organizationId: membership.organization_id,
        organizationName: membership.organizations?.name ?? "Unknown organization",
        status: membership.status,
        roleCodes: (membership.organization_member_roles ?? [])
          .map((entry) => entry.roles?.code)
          .filter((code): code is string => Boolean(code)),
        isOrgAdmin: isOrgAdmin ?? false,
      };
    }),
  );

  return { profileId, isSuperAdmin, organizations };
}

/** Thin wrapper over `kiraya.has_organization_permission` — the RPC is the source of truth. */
export async function hasOrganizationPermission(
  organizationId: string,
  permissionCode: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_organization_permission", {
    p_organization_id: organizationId,
    p_permission_code: permissionCode,
  });

  if (error) {
    throw new Error(`Failed to check permission: ${error.message}`);
  }

  return data ?? false;
}

/** Thin wrapper over `kiraya.is_super_admin`. */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_super_admin");

  if (error) {
    throw new Error(`Failed to check platform admin status: ${error.message}`);
  }

  return data ?? false;
}

/**
 * Thin wrapper over `kiraya.can_write_organization` — the same check every
 * properties/units/owners/property_ownerships RLS write policy uses
 * (super admin OR org admin OR the `organization.write` permission code).
 * There's no more granular per-entity permission in the database today, so
 * this is the single gate for "can create/edit a property, unit, or
 * ownership record" — deliberately not split into invented codes.
 */
export async function canWriteOrganization(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("can_write_organization", {
    p_organization_id: organizationId,
  });

  if (error) {
    throw new Error(`Failed to check write access: ${error.message}`);
  }

  return data ?? false;
}
