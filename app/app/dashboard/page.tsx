import { getRequestContext } from "@/lib/context/current";
import { getOrganizationDashboard, getRecentPayments, getUpcomingLeaseExpiries, getCurrentDues } from "@/lib/queries/dashboard";
import { getBillStatusCounts, getBillDueBreakdown } from "@/lib/queries/bills";
import { getOrganizationUnitCounts } from "@/lib/queries/properties";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { CurrentDuesTable } from "@/components/dashboard/CurrentDuesTable";
import { CollectionPerformanceChart } from "@/components/dashboard/CollectionPerformanceChart";
import { RecentPaymentsTable } from "@/components/dashboard/RecentPaymentsTable";
import { PendingActionsPanel } from "@/components/dashboard/PendingActionsPanel";
import { LeaseExpiriesPanel } from "@/components/dashboard/LeaseExpiriesPanel";
import { BillingStatusStrip } from "@/components/dashboard/BillingStatusStrip";
import styles from "@/components/dashboard/DashboardLayout.module.css";

export default async function DashboardPage() {
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const [dashboard, recentPayments, leaseExpiries, billStatusCounts, dueBreakdown, currentDues, unitCounts] = await Promise.all([
    getOrganizationDashboard(organizationId),
    getRecentPayments(organizationId),
    getUpcomingLeaseExpiries(organizationId),
    getBillStatusCounts(organizationId),
    getBillDueBreakdown(organizationId),
    getCurrentDues(organizationId),
    getOrganizationUnitCounts(organizationId),
  ]);

  return (
    <div>
      <DashboardKpiStrip latest={dashboard.latest} overdueCount={dueBreakdown.overdueCount} unitCounts={unitCounts} />

      <div className={styles.panel} style={{ marginBottom: 28 }}>
        <div className={styles.sectionHeading} style={{ marginBottom: 16 }}>
          Current Dues
        </div>
        <CurrentDuesTable dues={currentDues} />
      </div>

      <div className={styles.twoColumn}>
        <div className={styles.left}>
          <div className={styles.sectionHeadingRow}>
            <div className={styles.sectionHeading}>Collection Performance</div>
            <div className={styles.subHeading}>Last 6 months</div>
          </div>
          <CollectionPerformanceChart monthly={dashboard.monthly} />

          <div className={[styles.sectionHeading, styles.subsection].join(" ")}>Recent Payments</div>
          <RecentPaymentsTable payments={recentPayments} />
        </div>

        <div className={styles.right}>
          <div className={[styles.sectionHeading].join(" ")} style={{ marginBottom: 14 }}>
            Pending Actions
          </div>
          <PendingActionsPanel overdueCount={dueBreakdown.overdueCount} overduePropertyCount={dueBreakdown.overduePropertyCount} />

          <div className={[styles.sectionHeading, styles.subsection].join(" ")}>Occupancy Ending Soon</div>
          <LeaseExpiriesPanel expiries={leaseExpiries} />
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.sectionHeading} style={{ marginBottom: 16 }}>
          Billing Status — This Cycle
        </div>
        <BillingStatusStrip counts={billStatusCounts} dueBreakdown={dueBreakdown} />
      </div>
    </div>
  );
}
