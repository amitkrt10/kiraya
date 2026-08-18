import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { isSuperAdmin } from "@/lib/permissions/resolve";
import { getInitials } from "@/lib/utils/initials";
import { AdminShell } from "@/components/layout/AdminShell";
import { StandalonePage } from "@/components/layout/StandalonePage";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const hasPlatformAccess = await isSuperAdmin();
  if (!hasPlatformAccess) {
    return (
      <StandalonePage>
        <PermissionDenied description="The Platform Admin area is limited to Kiraya platform administrators. Ask your Kiraya contact if you believe this is a mistake." />
      </StandalonePage>
    );
  }

  return (
    <ToastProvider>
      <AdminShell userName={profile.full_name ?? "Unnamed user"} userInitials={getInitials(profile.full_name)}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
