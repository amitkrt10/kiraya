/** Maps a route prefix to its page title, for the topbar heading + tab title. */
const orgRouteTitles: Array<[prefix: string, title: string]> = [
  ["/app/dashboard", "Dashboard"],
  ["/app/properties", "Properties"],
  ["/app/units", "Units"],
  ["/app/owners", "Owners"],
  ["/app/tenants", "Tenants"],
  ["/app/leases", "Leases"],
  ["/app/billing", "Billing"],
  ["/app/payments", "Payments"],
  ["/app/ledger", "Ledger"],
  ["/app/deposits", "Deposits"],
  ["/app/exits", "Tenant Exits"],
  ["/app/utilities", "Utilities & Meters"],
  ["/app/meters", "Meters"],
  ["/app/documents", "Documents"],
  ["/app/imports", "Imports"],
  ["/app/reports", "Reports"],
  ["/app/settings", "Settings"],
];

const adminRouteTitles: Array<[prefix: string, title: string]> = [
  ["/admin/dashboard", "Platform Dashboard"],
  ["/admin/organizations", "Organizations"],
];

function lookup(pathname: string, table: Array<[string, string]>, fallback: string): string {
  const match = table.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? match[1] : fallback;
}

export function getOrgRouteTitle(pathname: string): string {
  return lookup(pathname, orgRouteTitles, "Dashboard");
}

export function getAdminRouteTitle(pathname: string): string {
  return lookup(pathname, adminRouteTitles, "Platform Dashboard");
}
