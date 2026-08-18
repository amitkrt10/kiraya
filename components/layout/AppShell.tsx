import { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { OrgRouteHeading } from "@/components/layout/RouteHeading";
import { UserMenu } from "@/components/navigation/UserMenu";
import { orgNavGroups } from "@/lib/navigation/orgNav";
import type { OrganizationMembership } from "@/lib/permissions/resolve";
import styles from "./Shell.module.css";

export interface AppShellProps {
  organizations: OrganizationMembership[];
  currentOrganizationId: string;
  currentOrganizationName: string;
  userName: string;
  userInitials: string;
  roleLabel: string;
  isViewer: boolean;
  children: ReactNode;
}

export function AppShell({
  organizations,
  currentOrganizationId,
  currentOrganizationName,
  userName,
  userInitials,
  roleLabel,
  isViewer,
  children,
}: AppShellProps) {
  return (
    <div className={styles.root}>
      <AppSidebar
        navGroups={orgNavGroups}
        organizations={organizations}
        currentOrganizationId={currentOrganizationId}
        userName={userName}
        roleLabel={roleLabel}
      />
      <div className={styles.main}>
        <Topbar
          titleSlot={<OrgRouteHeading organizationName={currentOrganizationName} />}
          searchPlaceholder="Search tenants, bills, units…"
          userMenu={<UserMenu name={userName} roleLabel={roleLabel} initials={userInitials} />}
          viewOnlyBanner={
            isViewer
              ? "View-only role — you can see all figures below but cannot record payments, finalize bills, or edit records."
              : undefined
          }
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
