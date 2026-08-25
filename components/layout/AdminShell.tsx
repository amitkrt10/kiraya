"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AdminRouteHeading } from "@/components/layout/RouteHeading";
import { UserMenu } from "@/components/navigation/UserMenu";
import { adminNavGroups } from "@/lib/navigation/adminNav";
import styles from "./Shell.module.css";

export interface AdminShellProps {
  userName: string;
  userInitials: string;
  children: ReactNode;
}

export function AdminShell({ userName, userInitials, children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  // See AppShell's identical pattern: adjusting state during render rather
  // than in an effect, matching React's recommended "reset on prop change".
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
      <AdminSidebar navGroups={adminNavGroups} userName={userName} mobileOpen={mobileNavOpen} />
      <div className={styles.main}>
        <Topbar
          titleSlot={<AdminRouteHeading />}
          searchPlaceholder="Search organizations…"
          userMenu={<UserMenu name={userName} roleLabel="Platform Admin" initials={userInitials} />}
          mobileNavOpen={mobileNavOpen}
          onMobileNavToggle={() => setMobileNavOpen((open) => !open)}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
