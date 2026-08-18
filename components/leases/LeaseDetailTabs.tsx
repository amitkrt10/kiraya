"use client";

import { useState } from "react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { LeaseOverview } from "./LeaseOverview";
import { LeasePartiesTable } from "./LeasePartiesTable";
import { RentRuleHistory } from "./RentRuleHistory";
import { BillingConfigPanel } from "./BillingConfigPanel";
import type { LeaseDetail } from "@/lib/queries/leases";
import type { LeasePartyItem } from "@/lib/queries/leaseParties";
import type { RentRuleRow } from "@/lib/queries/rentRules";
import type { BillingConfigRow } from "@/lib/queries/billingConfigs";
import type { TenantPickerItem } from "@/lib/queries/tenants";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "parties", label: "Parties" },
  { id: "rent", label: "Rent Rules" },
  { id: "billing", label: "Billing Configuration" },
  { id: "bills", label: "Bills" },
  { id: "documents", label: "Documents" },
];

export function LeaseDetailTabs({
  lease,
  parties,
  tenants,
  rentRules,
  billingConfigs,
  canWrite,
}: {
  lease: LeaseDetail;
  parties: LeasePartyItem[];
  tenants: TenantPickerItem[];
  rentRules: RentRuleRow[];
  billingConfigs: BillingConfigRow[];
  canWrite: boolean;
}) {
  const [activeId, setActiveId] = useState("overview");

  return (
    <Tabs tabs={TABS} activeId={activeId} onChange={setActiveId} idPrefix="lease-detail">
      <TabPanel id="overview" activeId={activeId} idPrefix="lease-detail">
        <LeaseOverview lease={lease} />
      </TabPanel>
      <TabPanel id="parties" activeId={activeId} idPrefix="lease-detail">
        <LeasePartiesTable leaseId={lease.id} parties={parties} tenants={tenants} canWrite={canWrite} />
      </TabPanel>
      <TabPanel id="rent" activeId={activeId} idPrefix="lease-detail">
        <RentRuleHistory leaseId={lease.id} rentRules={rentRules} canWrite={canWrite} />
      </TabPanel>
      <TabPanel id="billing" activeId={activeId} idPrefix="lease-detail">
        <BillingConfigPanel leaseId={lease.id} billingConfigs={billingConfigs} canWrite={canWrite} />
      </TabPanel>
      <TabPanel id="bills" activeId={activeId} idPrefix="lease-detail">
        <PlaceholderPage title="Bills" description="Billing for this lease arrives in a later phase." />
      </TabPanel>
      <TabPanel id="documents" activeId={activeId} idPrefix="lease-detail">
        <PlaceholderPage title="Documents" description="Document management for this lease arrives in a later phase." />
      </TabPanel>
    </Tabs>
  );
}
