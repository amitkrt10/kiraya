"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { LedgerEntryType } from "@/lib/queries/ledger";
import type { PropertyPickerItem } from "@/lib/queries/properties";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import styles from "@/components/properties/PropertyFilters.module.css";

const ENTRY_TYPES: LedgerEntryType[] = [
  "BILL",
  "PAYMENT",
  "ADJUSTMENT",
  "CREDIT_APPLICATION",
  "REVERSAL",
  "ALLOCATION_REVERSAL",
  "EXIT_SETTLEMENT",
  "DEPOSIT_RECEIPT",
  "DEPOSIT_DEDUCTION",
  "DEPOSIT_REFUND",
];

const ENTRY_TYPE_LABELS: Record<LedgerEntryType, string> = {
  BILL: "Bill",
  PAYMENT: "Payment",
  ADJUSTMENT: "Adjustment",
  CREDIT_APPLICATION: "Credit Applied",
  REVERSAL: "Reversal",
  ALLOCATION_REVERSAL: "Allocation Reversal",
  EXIT_SETTLEMENT: "Exit Settlement",
  DEPOSIT_RECEIPT: "Deposit Received",
  DEPOSIT_DEDUCTION: "Deposit Deduction",
  DEPOSIT_REFUND: "Deposit Refund",
};

export function LedgerFilters({
  properties,
  tenants,
}: {
  properties: PropertyPickerItem[];
  tenants: TenantPickerItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={styles.row}>
      <div className={styles.select}>
        <Select
          label="Property"
          placeholder="All properties"
          options={properties.map((property) => ({ value: property.id, label: property.name }))}
          value={searchParams.get("property") ?? ""}
          onChange={(event) => updateParams({ property: event.target.value || undefined })}
        />
      </div>
      <div className={styles.select}>
        <Select
          label="Tenant"
          placeholder="All tenants"
          options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.display_name }))}
          value={searchParams.get("tenant") ?? ""}
          onChange={(event) => updateParams({ tenant: event.target.value || undefined })}
        />
      </div>
      <div className={styles.select}>
        <Select
          label="Entry Type"
          placeholder="All types"
          options={ENTRY_TYPES.map((value) => ({ value, label: ENTRY_TYPE_LABELS[value] }))}
          value={searchParams.get("type") ?? ""}
          onChange={(event) => updateParams({ type: event.target.value || undefined })}
        />
      </div>
      <div className={styles.select}>
        <Input
          type="date"
          label="From"
          value={searchParams.get("from") ?? ""}
          onChange={(event) => updateParams({ from: event.target.value || undefined })}
        />
      </div>
      <div className={styles.select}>
        <Input
          type="date"
          label="To"
          value={searchParams.get("to") ?? ""}
          onChange={(event) => updateParams({ to: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
