"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { UtilityRow } from "@/lib/queries/utilities";
import styles from "@/components/properties/PropertyFilters.module.css";

export function MeterFilters({ utilities }: { utilities: UtilityRow[] }) {
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
          placeholder="Meter code…"
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
          label="Utility"
          placeholder="All utilities"
          options={utilities.map((utility) => ({ value: utility.id, label: utility.name }))}
          value={searchParams.get("utility") ?? ""}
          onChange={(event) => updateParams({ utility: event.target.value || undefined })}
        />
      </div>
      <div className={styles.select}>
        <Select
          label="Status"
          placeholder="All statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateParams({ status: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
