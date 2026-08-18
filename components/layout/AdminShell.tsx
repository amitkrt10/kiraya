import { ReactNode } from "react";
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
  return (
    <div className={styles.root}>
      <AdminSidebar navGroups={adminNavGroups} userName={userName} />
      <div className={styles.main}>
        <Topbar
          titleSlot={<AdminRouteHeading />}
          searchPlaceholder="Search organizations…"
          userMenu={<UserMenu name={userName} roleLabel="Platform Admin" initials={userInitials} />}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
