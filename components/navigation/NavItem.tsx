"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./NavItem.module.css";

export type NavShellVariant = "light" | "dark";

export interface NavItemDef {
  href: string;
  label: string;
  /**
   * A pre-rendered icon element (e.g. `<Building2 />`), not a component
   * reference. NavItem/NavGroup are Client Components, and these nav
   * definitions are authored in a Server Component module (lib/navigation) —
   * a raw component *reference* can't cross that server/client boundary as a
   * prop, only an already-rendered element can.
   */
  icon: ReactNode;
}

export interface NavGroupDef {
  label: string | null;
  items: NavItemDef[];
}

const activeColors: Record<NavShellVariant, { active: string; activeBg: string; inactive: string }> = {
  light: { active: "var(--color-bg)", activeBg: "var(--color-text)", inactive: "var(--color-text)" },
  dark: { active: "var(--color-neutral-900)", activeBg: "var(--color-bg)", inactive: "var(--color-bg)" },
};

export function NavItem({ href, label, icon, variant }: NavItemDef & { variant: NavShellVariant }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const colors = activeColors[variant];

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={styles.item}
      style={{
        color: isActive ? colors.active : colors.inactive,
        background: isActive ? colors.activeBg : "transparent",
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function NavGroup({ group, variant }: { group: NavGroupDef; variant: NavShellVariant }) {
  const colors = activeColors[variant];
  return (
    <div className={styles.group}>
      {group.label ? (
        <div className={styles.groupLabel} style={{ color: variant === "dark" ? "var(--color-neutral-300)" : colors.inactive }}>
          {group.label}
        </div>
      ) : null}
      {group.items.map((item) => (
        <NavItem key={item.href} {...item} variant={variant} />
      ))}
    </div>
  );
}
