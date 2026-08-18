import Link from "next/link";
import { NavGroup, type NavGroupDef } from "@/components/navigation/NavItem";
import { OrgSwitcher } from "@/components/navigation/OrgSwitcher";
import type { OrganizationMembership } from "@/lib/permissions/resolve";
import styles from "./Sidebar.module.css";

export interface AppSidebarProps {
  navGroups: NavGroupDef[];
  organizations: OrganizationMembership[];
  currentOrganizationId: string;
  userName: string;
  roleLabel: string;
}

export function AppSidebar({
  navGroups,
  organizations,
  currentOrganizationId,
  userName,
  roleLabel,
}: AppSidebarProps) {
  return (
    <aside className={[styles.sidebar, styles.light].join(" ")}>
      <div className={styles.logoRow}>
        <div className={styles.logoMark}>
          <span className={styles.logoMarkText}>K</span>
        </div>
        <span className={styles.wordmark}>KIRAYA</span>
      </div>

      <div className={styles.orgRow}>
        <div className={styles.orgLabel}>Organization</div>
        <OrgSwitcher organizations={organizations} currentOrganizationId={currentOrganizationId} />
      </div>

      <nav className={styles.nav} aria-label="Primary">
        {navGroups.map((group, index) => (
          <NavGroup key={group.label ?? `group-${index}`} group={group} variant="light" />
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerLabel}>Signed in as</div>
        <div className={styles.footerName}>
          {userName} · {roleLabel}
        </div>
      </div>
    </aside>
  );
}

export interface AdminSidebarProps {
  navGroups: NavGroupDef[];
  userName: string;
}

export function AdminSidebar({ navGroups, userName }: AdminSidebarProps) {
  return (
    <aside className={[styles.sidebar, styles.dark].join(" ")}>
      <div className={styles.logoRow}>
        <div className={styles.logoMark}>
          <span className={styles.logoMarkText}>K</span>
        </div>
        <div>
          <div className={styles.wordmark}>KIRAYA</div>
          <div className={styles.modeLabel}>Platform Admin</div>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        {navGroups.map((group, index) => (
          <NavGroup key={group.label ?? `group-${index}`} group={group} variant="dark" />
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerLabel}>Signed in as</div>
        <div className={styles.footerName}>{userName} · Platform Admin</div>
        <Link href="/app/dashboard" className={styles.switchLink}>
          ← Switch to organization view
        </Link>
      </div>
    </aside>
  );
}
