"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import type { BillingRunStatus } from "@/lib/queries/billingRuns";
import styles from "@/components/properties/PropertyFilters.module.css";

const RUN_STATUSES: BillingRunStatus[] = ["DRAFT", "RUNNING", "COMPLETED", "PARTIAL", "FAILED", "FINALIZED"];

const STATUS_LABELS: Record<BillingRunStatus, string> = {
  DRAFT: "Draft",
  RUNNING: "Running",
  COMPLETED: "Completed",
  PARTIAL: "Partial",
  FAILED: "Failed",
  FINALIZED: "Finalized",
};

export function BillingRunFilters() {
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
          label="Status"
          placeholder="All statuses"
          options={RUN_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateParams({ status: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
