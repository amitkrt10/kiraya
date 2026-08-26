import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  CreditCard,
  ScrollText,
  Shield,
  Gauge,
  LogOut,
  Folder,
  Upload,
  ChartBar,
  Settings,
} from "lucide-react";
import type { NavGroupDef } from "@/components/navigation/NavItem";

const ICON_SIZE = 16;

/**
 * Organization shell navigation — matches the groups in
 * design/Kiraya Handoff Spec.dc.html Section B ("Organization shell").
 * Every item below has a corresponding route under app/app/ per P5.2A
 * Section 23 (most are placeholders in this phase).
 */
export const orgNavGroups: NavGroupDef[] = [
  {
    label: null,
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: <LayoutDashboard size={ICON_SIZE} aria-hidden="true" /> },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { href: "/app/properties", label: "Properties", icon: <Building2 size={ICON_SIZE} aria-hidden="true" /> },
    ],
  },
  {
    label: "People",
    items: [{ href: "/app/tenants", label: "Tenants", icon: <Users size={ICON_SIZE} aria-hidden="true" /> }],
  },
  {
    label: "Money",
    items: [
      { href: "/app/billing", label: "Billing", icon: <Receipt size={ICON_SIZE} aria-hidden="true" /> },
      { href: "/app/payments", label: "Payments", icon: <CreditCard size={ICON_SIZE} aria-hidden="true" /> },
      { href: "/app/ledger", label: "Ledger", icon: <ScrollText size={ICON_SIZE} aria-hidden="true" /> },
      { href: "/app/deposits", label: "Deposits", icon: <Shield size={ICON_SIZE} aria-hidden="true" /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/app/utilities", label: "Utilities & Meters", icon: <Gauge size={ICON_SIZE} aria-hidden="true" /> },
      { href: "/app/exits", label: "Tenant Exits", icon: <LogOut size={ICON_SIZE} aria-hidden="true" /> },
      { href: "/app/documents", label: "Documents", icon: <Folder size={ICON_SIZE} aria-hidden="true" /> },
      { href: "/app/imports", label: "Imports", icon: <Upload size={ICON_SIZE} aria-hidden="true" /> },
    ],
  },
  {
    label: "Insights",
    items: [{ href: "/app/reports", label: "Reports", icon: <ChartBar size={ICON_SIZE} aria-hidden="true" /> }],
  },
  {
    label: "Administration",
    items: [{ href: "/app/settings", label: "Settings", icon: <Settings size={ICON_SIZE} aria-hidden="true" /> }],
  },
];
