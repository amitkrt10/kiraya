"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import styles from "@/components/properties/PropertyFilters.module.css";

const PAYMENT_STATUSES = ["POSTED", "REVERSED"] as const;

const STATUS_LABELS: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  POSTED: "Posted",
  REVERSED: "Reversed",
};

export function PaymentFilters() {
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
          placeholder="Payment number…"
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
          label="Status"
          placeholder="All statuses"
          options={PAYMENT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateParams({ status: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
