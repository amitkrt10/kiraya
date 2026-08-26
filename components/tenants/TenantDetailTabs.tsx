"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CreditCard, ScrollText } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import Link from "next/link";
import { TenantOverview, type TenantUnitOccupancyDetail } from "./TenantOverview";
import { TenantLeaseList } from "./TenantLeaseList";
import { TenantBillsPanel } from "./TenantBillsPanel";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { LedgerExportButton } from "@/components/ledger/LedgerExportButton";
import { SecurityDepositTab } from "@/components/securityDeposits/SecurityDepositTab";
import { TenantExitTab } from "@/components/tenantExits/TenantExitTab";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import type { BillListItem } from "@/lib/queries/bills";
import type { PaymentListItem } from "@/lib/queries/payments";
import type { GetLedgerEntriesResult } from "@/lib/queries/ledger";
import type { SecurityDepositRow, SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";
import type { TenantExitRow, ExitSettlementRow } from "@/lib/queries/tenantExits";
import type { TenantContactRow } from "@/lib/queries/tenantContacts";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "occupancy", label: "Occupancy History" },
  { id: "bills", label: "Bills" },
  { id: "payments", label: "Payments" },
  { id: "ledger", label: "Ledger" },
  { id: "deposit", label: "Deposit" },
  { id: "documents", label: "Documents" },
  { id: "exit", label: "Exit" },
];

/**
 * P6.3-D Parts 7/8 (and P6.3-H): deposit and tenant-exit are per-unit
 * operations, never tenant-level. For the common single-occupancy tenant,
 * the tab below still resolves that one occupancy directly (unchanged from
 * before). For a tenant with more than one *relevant* occupancy — either
 * multiple currently-ACTIVE units, or (once there's no active lease left)
 * multiple ENDED ones — picking just one would silently hide the others'
 * deposit/exit state, so this points at each occupancy's own unit page
 * instead, where the correct, unambiguous per-occupancy section lives.
 */
function MultiUnitRedirect({ leases, note }: { leases: LeaseListItem[]; note: string }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--color-neutral-700)", marginBottom: 14 }}>{note}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {leases.map((lease) => (
          <Link
            key={lease.id}
            href={`/app/units/${lease.unit_id}`}
            style={{
              display: "block",
              padding: "10px 12px",
              border: "1px solid var(--color-neutral-300)",
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            {lease.units ? `${lease.units.properties?.name ?? ""} · ${lease.units.unit_code}` : "—"}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TenantDetailTabs({
  tenant,
  currentLease,
  activeLeaseCount,
  leases,
  unitDetails,
  bills,
  payments,
  ledger,
  deposit,
  depositHeld,
  depositTransactions,
  tenantExit,
  exitSettlement,
  contacts,
  canWrite,
}: {
  tenant: TenantRow;
  currentLease: LeaseListItem | null;
  activeLeaseCount: number;
  leases: LeaseListItem[];
  unitDetails: Record<string, TenantUnitOccupancyDetail>;
  bills: BillListItem[];
  payments: PaymentListItem[];
  ledger: GetLedgerEntriesResult;
  deposit: SecurityDepositRow | null;
  depositHeld: number;
  depositTransactions: SecurityDepositTransactionRow[];
  tenantExit: TenantExitRow | null;
  exitSettlement: ExitSettlementRow | null;
  contacts: TenantContactRow[];
  canWrite: boolean;
}) {
  const activeLeases = leases.filter((lease) => lease.status === "ACTIVE");
  // P6.3-H: Deposit/Exit are always scoped to one specific occupancy. With
  // exactly one ACTIVE lease, that's unambiguous no matter how many ENDED
  // leases also exist elsewhere in this tenant's history — the deposit/exit
  // shown is always that one current occupancy's own (server-resolved via
  // currentLease.id). With zero ACTIVE leases, the page falls back to the
  // tenant's most recent ENDED lease/exit instead — safe only when there's
  // at most one ended lease to choose from. Two or more ended leases means
  // that fallback would silently pick the newest and hide the rest, so this
  // widens the same per-unit redirect P6.3-D already uses for the
  // multiple-active case to the multiple-ended case too.
  const endedLeases = leases.filter((lease) => lease.status === "ENDED");
  const relevantLeasesForSingleOccupancyView = activeLeaseCount > 0 ? activeLeases : endedLeases;
  const showMultiOccupancyRedirect = relevantLeasesForSingleOccupancyView.length > 1;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Entry-point convenience only (e.g. the Deposits overview linking into a
  // tenant's Deposit tab) — read once on mount, same as every other
  // *DetailTabs component's hardcoded default; switching tabs afterward
  // still doesn't sync back to the URL anywhere in this app.
  const [activeId, setActiveId] = useState<string>(() => {
    const requestedTab = searchParams.get("tab");
    return TABS.some((tab) => tab.id === requestedTab) ? requestedTab! : "overview";
  });

  // P6.3-E: every unit this tenant has ever occupied, for the Ledger tab's
  // Unit filter and its per-row Unit column — derived from `leases`
  // (already fetched for the page), never a new query.
  const unitByLeaseId: Record<string, string> = {};
  const unitOptions: { value: string; label: string }[] = [];
  const seenUnits = new Set<string>();
  for (const lease of leases) {
    const label = lease.units ? `${lease.units.properties?.name ?? ""} · ${lease.units.unit_code}` : lease.unit_id;
    unitByLeaseId[lease.id] = label;
    if (!seenUnits.has(lease.unit_id)) {
      seenUnits.add(lease.unit_id);
      unitOptions.push({ value: lease.unit_id, label });
    }
  }
  const selectedUnitId = searchParams.get("unit") ?? "";

  // Both of these trigger a real navigation (this page re-fetches server-
  // side on every searchParams change), which would otherwise reset
  // `activeId` back to Overview — so both carry `tab` through explicitly
  // to keep the user on the Ledger tab they were just on.
  function buildLedgerHref(nextPage: number): string {
    const query = new URLSearchParams(searchParams.toString());
    query.set("tab", activeId);
    if (nextPage > 1) {
      query.set("ledgerPage", String(nextPage));
    } else {
      query.delete("ledgerPage");
    }
    const search = query.toString();
    return search ? `${pathname}?${search}` : pathname;
  }

  function handleLedgerUnitChange(nextUnitId: string) {
    const query = new URLSearchParams(searchParams.toString());
    query.set("tab", activeId);
    if (nextUnitId) {
      query.set("unit", nextUnitId);
    } else {
      query.delete("unit");
    }
    query.delete("ledgerPage");
    const search = query.toString();
    router.push(search ? `${pathname}?${search}` : pathname);
  }

  return (
    <Tabs tabs={TABS} activeId={activeId} onChange={setActiveId} idPrefix="tenant-detail">
      <TabPanel id="overview" activeId={activeId} idPrefix="tenant-detail">
        <TenantOverview tenant={tenant} leases={leases} unitDetails={unitDetails} contacts={contacts} />
      </TabPanel>
      <TabPanel id="occupancy" activeId={activeId} idPrefix="tenant-detail">
        <TenantLeaseList leases={leases} />
      </TabPanel>
      <TabPanel id="bills" activeId={activeId} idPrefix="tenant-detail">
        <TenantBillsPanel bills={bills} />
      </TabPanel>
      <TabPanel id="payments" activeId={activeId} idPrefix="tenant-detail">
        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" description="Payments recorded for this tenant appear here." />
        ) : (
          <PaymentTable payments={payments} />
        )}
      </TabPanel>
      <TabPanel id="ledger" activeId={activeId} idPrefix="tenant-detail">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, gap: 16 }}>
          {unitOptions.length > 1 ? (
            <div style={{ maxWidth: 280, flex: "1 1 auto" }}>
              <Select
                label="Unit"
                value={selectedUnitId}
                onChange={(event) => handleLedgerUnitChange(event.target.value)}
                placeholder="All Units"
                options={unitOptions}
              />
            </div>
          ) : (
            <div />
          )}
          <LedgerExportButton query={{ tenant: tenant.id, unit: selectedUnitId || undefined }} />
        </div>
        {ledger.entries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No ledger entries yet"
            description="Ledger entries appear here once bills are finalized and payments are recorded."
          />
        ) : (
          <>
            <LedgerTable entries={ledger.entries} unitByLeaseId={unitOptions.length > 1 ? unitByLeaseId : undefined} />
            <Pagination page={ledger.page} pageSize={ledger.pageSize} totalCount={ledger.totalCount} buildHref={buildLedgerHref} />
          </>
        )}
      </TabPanel>
      <TabPanel id="deposit" activeId={activeId} idPrefix="tenant-detail">
        {showMultiOccupancyRedirect ? (
          <MultiUnitRedirect
            leases={relevantLeasesForSingleOccupancyView}
            note={
              activeLeaseCount > 0
                ? "This tenant occupies multiple units, each with its own deposit. Open a unit below to view or manage its deposit."
                : "This tenant has occupied multiple units. Open a unit below to view its deposit history."
            }
          />
        ) : (
          <SecurityDepositTab
            deposit={deposit}
            held={depositHeld}
            transactions={depositTransactions}
            canWrite={canWrite}
            tenantId={tenant.id}
            leaseId={currentLease?.id ?? null}
          />
        )}
      </TabPanel>
      <TabPanel id="documents" activeId={activeId} idPrefix="tenant-detail">
        <PlaceholderPage title="Documents" description="Document management for this tenant arrives in a later phase." />
      </TabPanel>
      <TabPanel id="exit" activeId={activeId} idPrefix="tenant-detail">
        {showMultiOccupancyRedirect ? (
          <MultiUnitRedirect
            leases={relevantLeasesForSingleOccupancyView}
            note={
              activeLeaseCount > 0
                ? "This tenant occupies multiple units. A tenant exit applies to one unit at a time — open a unit below to start or continue its exit."
                : "This tenant has occupied multiple units. Open a unit below to view its exit history."
            }
          />
        ) : (
          <TenantExitTab currentLeaseId={currentLease?.id ?? null} exit={tenantExit} settlement={exitSettlement} canWrite={canWrite} />
        )}
      </TabPanel>
    </Tabs>
  );
}
