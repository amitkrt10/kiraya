"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { BillTable } from "@/components/billing/BillTable";
import { FileText } from "lucide-react";
import type { BillListItem } from "@/lib/queries/bills";

/**
 * P6.3-D/E: a tenant can hold more than one unit, so "this tenant's bills"
 * is a real, meaningful tenant-wide aggregate (case A) — not something to
 * force into per-unit views. This just adds an optional Unit filter on
 * top of that same aggregate (case C), entirely client-side: every bill
 * is already fetched and already carries its own unit_id, so filtering
 * here never re-queries or duplicates data, and "All Units" (the default)
 * is exactly the unchanged aggregate view.
 */
export function TenantBillsPanel({ bills }: { bills: BillListItem[] }) {
  const [unitId, setUnitId] = useState("");

  const unitOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const bill of bills) {
      if (!bill.unit_id || seen.has(bill.unit_id)) continue;
      const label = bill.units ? `${bill.units.properties?.name ?? ""} · ${bill.units.unit_code}` : bill.unit_id;
      seen.set(bill.unit_id, label);
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [bills]);

  const filteredBills = unitId ? bills.filter((bill) => bill.unit_id === unitId) : bills;

  if (bills.length === 0) {
    return <EmptyState icon={FileText} title="No bills yet" description="Bills for this tenant appear here once billing has run." />;
  }

  return (
    <div>
      {unitOptions.length > 1 ? (
        <div style={{ maxWidth: 280, marginBottom: 16 }}>
          <Select
            label="Unit"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            placeholder="All Units"
            options={unitOptions}
          />
        </div>
      ) : null}
      {filteredBills.length === 0 ? (
        <EmptyState icon={FileText} title="No bills for this unit" description="Try a different unit, or All Units." />
      ) : (
        <BillTable bills={filteredBills} />
      )}
    </div>
  );
}
