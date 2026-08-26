import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPayments, type PaymentListItem } from "@/lib/queries/payments";
import type { Database } from "@/types/database";

export type OrganizationDashboardRow = Database["kiraya"]["Views"]["v_organization_dashboard"]["Row"];

const CHART_MONTHS = 6;
const RECENT_PAYMENTS_LIMIT = 5;
const LEASE_EXPIRY_LIMIT = 3;
const CURRENT_DUES_LIMIT = 10;

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
  unitId: string;
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
      (
        row,
      ): row is typeof row & {
        lease_id: string;
        unit_id: string;
        tenant_name: string;
        unit_code: string;
        days_until_expiry: number;
        alert_status: string;
      } => Boolean(row.lease_id && row.unit_id && row.tenant_name && row.unit_code && row.days_until_expiry !== null && row.alert_status),
    )
    .map((row) => ({
      leaseId: row.lease_id,
      unitId: row.unit_id,
      tenantName: row.tenant_name,
      unitLabel: row.property_name ? `${row.property_name} · ${row.unit_code}` : row.unit_code,
      daysUntilExpiry: row.days_until_expiry,
      alertStatus: row.alert_status,
    }));
}

export interface CurrentDueRow {
  tenantId: string;
  tenantName: string;
  unitLabel: string;
  amountDue: number;
}

/**
 * "Whose rent is currently pending, and how much." amount_due is
 * kiraya.v_tenant_outstanding's own column, itself a thin wrapper over
 * kiraya.get_tenant_due() — the same authoritative RPC getTenantOutstanding()
 * calls for a single tenant (lib/queries/financial.ts) and the same one
 * kiraya.v_organization_dashboard sums for the KPI strip's own "Outstanding"
 * tile. Nothing is computed here — only filtered (amount_due > 0, credits
 * excluded) and ordered. This view existed already (P3.1, reporting-only,
 * previously unused by any screen) — same precedent as
 * getUpcomingLeaseExpiries()'s reuse of v_lease_expiry_alerts.
 */
export async function getCurrentDues(organizationId: string): Promise<CurrentDueRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_tenant_outstanding")
    .select("tenant_id, tenant_name, property_name, unit_code, amount_due")
    .eq("organization_id", organizationId)
    .gt("amount_due", 0)
    .order("amount_due", { ascending: false })
    .limit(CURRENT_DUES_LIMIT);

  if (error) {
    throw new Error(`Failed to load current dues: ${error.message}`);
  }

  return (data ?? [])
    .filter((row): row is typeof row & { tenant_id: string; tenant_name: string; amount_due: number } =>
      Boolean(row.tenant_id && row.tenant_name && row.amount_due !== null),
    )
    .map((row) => ({
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      unitLabel: row.unit_code ? (row.property_name ? `${row.property_name} · ${row.unit_code}` : row.unit_code) : "—",
      amountDue: row.amount_due,
    }));
}
