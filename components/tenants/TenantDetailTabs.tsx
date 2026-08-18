"use client";

import { useState } from "react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { TenantOverview } from "./TenantOverview";
import { TenantLeaseList } from "./TenantLeaseList";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";

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
}: {
  tenant: TenantRow;
  currentLease: LeaseListItem | null;
  leases: LeaseListItem[];
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
        <PlaceholderPage title="Bills" description="Billing for this tenant arrives in a later phase." />
      </TabPanel>
      <TabPanel id="payments" activeId={activeId} idPrefix="tenant-detail">
        <PlaceholderPage title="Payments" description="Payment history for this tenant arrives in a later phase." />
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
