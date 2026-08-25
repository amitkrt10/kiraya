"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // Closes the off-canvas sidebar after any navigation, regardless of which
  // nav link (or in-page link) triggered it — simpler and more reliable
  // than wiring an onClick through every NavItem. Adjusting state during
  // render (React's recommended pattern for "reset state when a prop
  // changes") rather than in an effect, which would cause an extra render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

  return (
    <div className={styles.root}>
      {mobileNavOpen ? (
        <button
          type="button"
          className={styles.backdropVisible}
          aria-label="Close menu overlay"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <AppSidebar
        navGroups={orgNavGroups}
        organizations={organizations}
        currentOrganizationId={currentOrganizationId}
        userName={userName}
        roleLabel={roleLabel}
        mobileOpen={mobileNavOpen}
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
          mobileNavOpen={mobileNavOpen}
          onMobileNavToggle={() => setMobileNavOpen((open) => !open)}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
