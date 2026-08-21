"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CreditCard, FileText, ScrollText } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { TenantOverview } from "./TenantOverview";
import { TenantLeaseList } from "./TenantLeaseList";
import { BillTable } from "@/components/billing/BillTable";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import { LedgerExportButton } from "@/components/ledger/LedgerExportButton";
import { SecurityDepositTab } from "@/components/securityDeposits/SecurityDepositTab";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import type { BillListItem } from "@/lib/queries/bills";
import type { PaymentListItem } from "@/lib/queries/payments";
import type { GetLedgerEntriesResult } from "@/lib/queries/ledger";
import type { SecurityDepositRow, SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lease", label: "Lease" },
  { id: "bills", label: "Bills" },
  { id: "payments", label: "Payments" },
  { id: "ledger", label: "Ledger" },
  { id: "deposit", label: "Deposit" },
  { id: "documents", label: "Documents" },
  { id: "exit", label: "Exit" },
];

export function TenantDetailTabs({
  tenant,
  currentLease,
  leases,
  bills,
  payments,
  ledger,
  deposit,
  depositHeld,
  depositTransactions,
  canWrite,
}: {
  tenant: TenantRow;
  currentLease: LeaseListItem | null;
  leases: LeaseListItem[];
  bills: BillListItem[];
  payments: PaymentListItem[];
  ledger: GetLedgerEntriesResult;
  deposit: SecurityDepositRow | null;
  depositHeld: number;
  depositTransactions: SecurityDepositTransactionRow[];
  canWrite: boolean;
}) {
  const [activeId, setActiveId] = useState("overview");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildLedgerHref(nextPage: number): string {
    const query = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) {
      query.set("ledgerPage", String(nextPage));
    } else {
      query.delete("ledgerPage");
    }
    const search = query.toString();
    return search ? `${pathname}?${search}` : pathname;
  }

  return (
    <Tabs tabs={TABS} activeId={activeId} onChange={setActiveId} idPrefix="tenant-detail">
      <TabPanel id="overview" activeId={activeId} idPrefix="tenant-detail">
        <TenantOverview tenant={tenant} currentLease={currentLease} />
      </TabPanel>
      <TabPanel id="lease" activeId={activeId} idPrefix="tenant-detail">
        <TenantLeaseList leases={leases} />
      </TabPanel>
      <TabPanel id="bills" activeId={activeId} idPrefix="tenant-detail">
        {bills.length === 0 ? (
          <EmptyState icon={FileText} title="No bills yet" description="Bills for this tenant appear here once billing has run." />
        ) : (
          <BillTable bills={bills} />
        )}
      </TabPanel>
      <TabPanel id="payments" activeId={activeId} idPrefix="tenant-detail">
        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" description="Payments recorded for this tenant appear here." />
        ) : (
          <PaymentTable payments={payments} />
        )}
      </TabPanel>
      <TabPanel id="ledger" activeId={activeId} idPrefix="tenant-detail">
        {ledger.entries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No ledger entries yet"
            description="Ledger entries appear here once bills are finalized and payments are recorded."
          />
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <LedgerExportButton query={{ tenant: tenant.id }} />
            </div>
            <LedgerTable entries={ledger.entries} />
            <Pagination page={ledger.page} pageSize={ledger.pageSize} totalCount={ledger.totalCount} buildHref={buildLedgerHref} />
          </>
        )}
      </TabPanel>
      <TabPanel id="deposit" activeId={activeId} idPrefix="tenant-detail">
        <SecurityDepositTab
          deposit={deposit}
          held={depositHeld}
          transactions={depositTransactions}
          canWrite={canWrite}
          tenantId={tenant.id}
          leaseId={currentLease?.id ?? null}
        />
      </TabPanel>
      <TabPanel id="documents" activeId={activeId} idPrefix="tenant-detail">
        <PlaceholderPage title="Documents" description="Document management for this tenant arrives in a later phase." />
      </TabPanel>
      <TabPanel id="exit" activeId={activeId} idPrefix="tenant-detail">
        <PlaceholderPage title="Tenant Exit" description="The guided tenant exit workflow arrives in a later phase." />
      </TabPanel>
    </Tabs>
  );
}
