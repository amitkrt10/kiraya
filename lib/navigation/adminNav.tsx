import { LayoutDashboard, Building } from "lucide-react";
import type { NavGroupDef } from "@/components/navigation/NavItem";

const ICON_SIZE = 16;

/**
 * Platform shell navigation. The approved spec also lists Platform Reports,
 * Support & Ops, and Platform Settings — deferred here since P5.2A's route
 * scope (Section 23) only requires /admin/dashboard and /admin/organizations;
 * add them alongside their routes in a later phase.
 */
export const adminNavGroups: NavGroupDef[] = [
  {
    label: null,
    items: [
      {
        href: "/admin/dashboard",
        label: "Platform Dashboard",
        icon: <LayoutDashboard size={ICON_SIZE} aria-hidden="true" />,
      },
      { href: "/admin/organizations", label: "Organizations", icon: <Building size={ICON_SIZE} aria-hidden="true" /> },
    ],
  },
];
