import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPayments, type PaymentListItem } from "@/lib/queries/payments";
import type { Database } from "@/types/database";

export type OrganizationDashboardRow = Database["kiraya"]["Views"]["v_organization_dashboard"]["Row"];

const CHART_MONTHS = 6;
const RECENT_PAYMENTS_LIMIT = 5;
const LEASE_EXPIRY_LIMIT = 3;

export interface DashboardData {
  /** Most recent month with billing/payment activity, or null for an organization with none yet. */
  latest: OrganizationDashboardRow | null;
  /** Oldest -> newest, for the Collection Performance chart. */
  monthly: OrganizationDashboardRow[];
}

/**
 * kiraya.v_organization_dashboard's row set is the union of months that have
 * a bill or a payment (see its definition) — an organization with zero
 * bills/payments ever legitimately returns zero rows here. That's the
 * approved design's own empty state ("KPI strip still renders with zeros"),
 * not a missing-data bug.
 */
export async function getOrganizationDashboard(organizationId: string): Promise<DashboardData> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_organization_dashboard")
    .select("*")
    .eq("organization_id", organizationId)
    .order("period_month", { ascending: false })
    .limit(CHART_MONTHS);

  if (error) {
    throw new Error(`Failed to load organization dashboard: ${error.message}`);
  }

  const rows = data ?? [];
  return {
    latest: rows[0] ?? null,
    monthly: [...rows].reverse(),
  };
}

export async function getRecentPayments(organizationId: string): Promise<PaymentListItem[]> {
  const result = await getPayments({ organizationId, page: 1, pageSize: RECENT_PAYMENTS_LIMIT });
  return result.payments;
}

export interface UpcomingLeaseExpiry {
  leaseId: string;
  tenantName: string;
  unitLabel: string;
  daysUntilExpiry: number;
  alertStatus: string;
}

/**
 * Reuses the existing kiraya.v_lease_expiry_alerts view (already built for
 * the future Reports module, previously unused by any screen) rather than
 * recomputing day-math in TypeScript — this is the authoritative source.
 */
export async function getUpcomingLeaseExpiries(organizationId: string): Promise<UpcomingLeaseExpiry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_lease_expiry_alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("days_until_expiry", { ascending: true })
    .limit(LEASE_EXPIRY_LIMIT);

  if (error) {
    throw new Error(`Failed to load lease expiries: ${error.message}`);
  }

  return (data ?? [])
    .filter(
      (row): row is typeof row & { lease_id: string; tenant_name: string; unit_code: string; days_until_expiry: number; alert_status: string } =>
        Boolean(row.lease_id && row.tenant_name && row.unit_code && row.days_until_expiry !== null && row.alert_status),
    )
    .map((row) => ({
      leaseId: row.lease_id,
      tenantName: row.tenant_name,
      unitLabel: row.property_name ? `${row.property_name} · ${row.unit_code}` : row.unit_code,
      daysUntilExpiry: row.days_until_expiry,
      alertStatus: row.alert_status,
    }));
}
