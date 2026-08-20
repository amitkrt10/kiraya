"use client";

import { useState } from "react";
import { CreditCard, FileText } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { TenantOverview } from "./TenantOverview";
import { TenantLeaseList } from "./TenantLeaseList";
import { BillTable } from "@/components/billing/BillTable";
import { PaymentTable } from "@/components/payments/PaymentTable";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import type { BillListItem } from "@/lib/queries/bills";
import type { PaymentListItem } from "@/lib/queries/payments";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lease", label: "Lease" },
  { id: "bills", label: "Bills" },
  { id: "payments", label: "Payments" },
  { id: "ledger", label: "Ledger" },
  { id: "documents", label: "Documents" },
  { id: "exit", label: "Exit" },
];

export function TenantDetailTabs({
  tenant,
  currentLease,
  leases,
  bills,
  payments,
}: {
  tenant: TenantRow;
  currentLease: LeaseListItem | null;
  leases: LeaseListItem[];
  bills: BillListItem[];
  payments: PaymentListItem[];
}) {
  const [activeId, setActiveId] = useState("overview");

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
        <PlaceholderPage title="Ledger" description="The tenant ledger arrives in a later phase." />
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
