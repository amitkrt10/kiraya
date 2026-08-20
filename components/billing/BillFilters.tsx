"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { BillStatus } from "@/lib/queries/bills";
import type { PropertyPickerItem } from "@/lib/queries/properties";
import styles from "@/components/properties/PropertyFilters.module.css";

const BILL_STATUSES: BillStatus[] = ["DRAFT", "FINALIZED", "PARTIALLY_PAID", "PAID", "VOID"];

const STATUS_LABELS: Record<BillStatus, string> = {
  DRAFT: "Draft",
  FINALIZED: "Finalized",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  VOID: "Void",
};

export function BillFilters({ properties }: { properties: PropertyPickerItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <div className={styles.search}>
        <Input
          label="Search"
          placeholder="Bill number…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => updateParams({ q: value || undefined }), 350);
          }}
        />
      </div>
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
          label="Status"
          placeholder="All statuses"
          options={BILL_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateParams({ status: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
