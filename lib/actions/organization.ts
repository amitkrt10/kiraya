"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CURRENT_ORG_COOKIE } from "@/lib/organizations/current";
import { getCurrentProfile } from "@/lib/auth/profile";
import { resolvePermissionContext } from "@/lib/permissions/resolve";

/**
 * Switches the "current organization" cookie. Validates the requested id
 * against the caller's actual memberships first — never trusts the
 * submitted value on its own, since that's client-suppliable input.
 */
export async function setCurrentOrganizationAction(formData: FormData) {
  const organizationId = formData.get("organizationId");
  if (typeof organizationId !== "string" || organizationId.length === 0) {
    return;
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const context = await resolvePermissionContext(profile.id);
  const isMember = context.organizations.some((org) => org.organizationId === organizationId);
  if (!isMember) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_ORG_COOKIE, organizationId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/app/dashboard");
}
