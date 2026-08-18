"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { getAdminRouteTitle, getOrgRouteTitle } from "@/lib/navigation/routeTitles";
import styles from "./Topbar.module.css";

export function OrgRouteHeading({ organizationName }: { organizationName: string }) {
  const pathname = usePathname();
  const title = getOrgRouteTitle(pathname);
  return (
    <div className={styles.titleBlock}>
      <Breadcrumbs items={[{ label: organizationName }, { label: title }]} />
      <div className={styles.title}>{title}</div>
    </div>
  );
}

export function AdminRouteHeading() {
  const pathname = usePathname();
  const title = getAdminRouteTitle(pathname);
  return (
    <div className={styles.titleBlock}>
      <Breadcrumbs items={[{ label: "Platform" }, { label: title }]} />
      <div className={styles.title}>{title}</div>
    </div>
  );
}
