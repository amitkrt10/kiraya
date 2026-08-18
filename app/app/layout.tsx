import { getRequestContext } from "@/lib/context/current";
import { personaLabelForRoleCodes } from "@/lib/permissions/personas";
import { getInitials } from "@/lib/utils/initials";
import { AppShell } from "@/components/layout/AppShell";
import { StandalonePage } from "@/components/layout/StandalonePage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToastProvider } from "@/components/ui/Toast";
import { ShieldOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await getRequestContext();

  if (!context) {
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

  const { profile, organization } = context;

  if (!organization) {
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
  const roleLabel = personaLabelForRoleCodes(organization.roleCodes);
  // The permission catalog only has 2 seeded codes today (P5.2A finding) —
  // "not an org admin" is the best available proxy for view-only until more
  // granular permissions exist server-side.
  const isViewer = !organization.isOrgAdmin;

  return (
    <ToastProvider>
      <AppShell
        organizations={context.permissions.organizations}
        currentOrganizationId={organization.organizationId}
        currentOrganizationName={organization.organizationName}
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
