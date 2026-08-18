import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { resolvePermissionContext } from "@/lib/permissions/resolve";
import { getCurrentOrganization } from "@/lib/organizations/current";
import { personaLabelForRoleCodes } from "@/lib/permissions/personas";
import { getInitials } from "@/lib/utils/initials";
import { AppShell } from "@/components/layout/AppShell";
import { StandalonePage } from "@/components/layout/StandalonePage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToastProvider } from "@/components/ui/Toast";
import { ShieldOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    // Authenticated with Supabase Auth but no (or no longer active) kiraya.profiles
    // row — a real state, not a bug: don't loop back to /login, explain it.
    return (
      <StandalonePage>
        <EmptyState
          icon={ShieldOff}
          title="Your account isn't fully set up"
          description="You're signed in, but there's no active Kiraya profile linked to this account yet. Ask your organization admin to finish setting up your access."
        />
      </StandalonePage>
    );
  }

  const context = await resolvePermissionContext(profile.id);
  const currentOrganization = await getCurrentOrganization(context.organizations);

  if (!currentOrganization) {
    return (
      <StandalonePage>
        <EmptyState
          icon={ShieldOff}
          title="No organization access yet"
          description="You're signed in, but you don't belong to any organization yet. Ask an organization admin to invite you."
        />
      </StandalonePage>
    );
  }

  const userName = profile.full_name ?? "Unnamed user";
  const roleLabel = personaLabelForRoleCodes(currentOrganization.roleCodes);
  // The permission catalog only has 2 seeded codes today (P5.2A finding) —
  // "not an org admin" is the best available proxy for view-only until more
  // granular permissions exist server-side.
  const isViewer = !currentOrganization.isOrgAdmin;

  return (
    <ToastProvider>
      <AppShell
        organizations={context.organizations}
        currentOrganizationId={currentOrganization.organizationId}
        currentOrganizationName={currentOrganization.organizationName}
        userName={userName}
        userInitials={getInitials(profile.full_name)}
        roleLabel={roleLabel}
        isViewer={isViewer}
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
