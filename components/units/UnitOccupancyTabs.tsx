"use client";

import { useState } from "react";
import { FileText, ScrollText } from "lucide-react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { UnitOccupancySummary } from "./UnitOccupancySummary";
import { RentRuleHistory } from "@/components/leases/RentRuleHistory";
import { BillingConfigPanel } from "@/components/leases/BillingConfigPanel";
import { SecurityDepositTab } from "@/components/securityDeposits/SecurityDepositTab";
import { TenantExitTab } from "@/components/tenantExits/TenantExitTab";
import { BillTable } from "@/components/billing/BillTable";
import { LedgerTable } from "@/components/ledger/LedgerTable";
import type { LeaseRow } from "@/lib/queries/leases";
import type { RentRuleRow } from "@/lib/queries/rentRules";
import type { BillingConfigRow } from "@/lib/queries/billingConfigs";
import type { SecurityDepositRow, SecurityDepositTransactionRow } from "@/lib/queries/securityDeposits";
import type { TenantExitRow, ExitSettlementRow } from "@/lib/queries/tenantExits";
import type { BillListItem } from "@/lib/queries/bills";
import type { LedgerEntryRow } from "@/lib/queries/ledger";

const BASE_TABS = [
  { id: "occupancy", label: "Occupancy" },
  { id: "rent", label: "Rent" },
  { id: "billing", label: "Billing" },
  { id: "deposit", label: "Deposit" },
  { id: "exit", label: "Exit" },
];

/**
 * P6.3-D Part 3 (extended P6.3-J): Occupancy/Rent/Billing/Deposit/Exit —
 * and, when the caller supplies them, Bills/Ledger — for exactly ONE
 * occupancy, all reached from a single place rather than a separate
 * "go to the Lease page" step. Every panel here is the same component
 * LeaseDetailTabs uses (kiraya.leases remains the internal record for
 * all of them); this is a second, unit-scoped place to reach them, not a
 * reimplementation. Because it's always scoped to exactly one leaseId —
 * passed in by the caller, never re-derived here — there's never the
 * ambiguity a multi-unit tenant would create if this lived at the tenant
 * level instead. Used both by the current-occupancy Unit Detail page
 * (`/app/units/[id]`, leaseId = the unit's current ACTIVE lease) and the
 * historical occupancy page (`/app/units/[id]/occupancies/[leaseId]`,
 * leaseId = any specific past or present lease) — `canWrite` is the
 * caller's responsibility to compute correctly for each (the historical
 * page passes `false` for anything that isn't the unit's own current
 * lease, so write actions never appear for an ended occupancy).
 */
export function UnitOccupancyTabs({
  leaseId,
  unitId,
  tenantId,
  lease,
  rentRules,
  billingConfigs,
  deposit,
  depositHeld,
  depositTransactions,
  tenantExit,
  exitSettlement,
  canWrite,
  bills,
  ledgerEntries,
}: {
  leaseId: string;
  unitId: string;
  tenantId: string;
  lease: LeaseRow;
  rentRules: RentRuleRow[];
  billingConfigs: BillingConfigRow[];
  deposit: SecurityDepositRow | null;
  depositHeld: number;
  depositTransactions: SecurityDepositTransactionRow[];
  tenantExit: TenantExitRow | null;
  exitSettlement: ExitSettlementRow | null;
  canWrite: boolean;
  /** P6.3-J: Bills/Ledger tabs are opt-in — omitted entirely (not just empty) on the current-occupancy Unit Detail page, which never passed these before; only the historical occupancy detail page supplies them. */
  bills?: BillListItem[];
  ledgerEntries?: LedgerEntryRow[];
}) {
  const [activeId, setActiveId] = useState("occupancy");
  const tabs = [
    ...BASE_TABS,
    ...(bills ? [{ id: "bills", label: "Bills" }] : []),
    ...(ledgerEntries ? [{ id: "ledger", label: "Ledger" }] : []),
  ];

  return (
    <Tabs tabs={tabs} activeId={activeId} onChange={setActiveId} idPrefix="unit-occupancy">
      <TabPanel id="occupancy" activeId={activeId} idPrefix="unit-occupancy">
        <UnitOccupancySummary leaseId={leaseId} unitId={unitId} lease={lease} canWrite={canWrite} />
      </TabPanel>
      <TabPanel id="rent" activeId={activeId} idPrefix="unit-occupancy">
        <RentRuleHistory leaseId={leaseId} rentRules={rentRules} canWrite={canWrite} />
      </TabPanel>
      <TabPanel id="billing" activeId={activeId} idPrefix="unit-occupancy">
        <BillingConfigPanel leaseId={leaseId} billingConfigs={billingConfigs} canWrite={canWrite} />
      </TabPanel>
      <TabPanel id="deposit" activeId={activeId} idPrefix="unit-occupancy">
        <SecurityDepositTab
          deposit={deposit}
          held={depositHeld}
          transactions={depositTransactions}
          canWrite={canWrite}
          tenantId={tenantId}
          leaseId={leaseId}
        />
      </TabPanel>
      <TabPanel id="exit" activeId={activeId} idPrefix="unit-occupancy">
        <TenantExitTab currentLeaseId={leaseId} exit={tenantExit} settlement={exitSettlement} canWrite={canWrite} />
      </TabPanel>
      {bills ? (
        <TabPanel id="bills" activeId={activeId} idPrefix="unit-occupancy">
          {bills.length === 0 ? (
            <EmptyState icon={FileText} title="No bills yet" description="Bills generated for this occupancy appear here." />
          ) : (
            <BillTable bills={bills} />
          )}
        </TabPanel>
      ) : null}
      {ledgerEntries ? (
        <TabPanel id="ledger" activeId={activeId} idPrefix="unit-occupancy">
          {ledgerEntries.length === 0 ? (
            <EmptyState icon={ScrollText} title="No ledger entries yet" description="Ledger entries for this occupancy appear here once bills are finalized and payments are recorded." />
          ) : (
            <LedgerTable entries={ledgerEntries} />
          )}
        </TabPanel>
      ) : null}
    </Tabs>
  );
}
