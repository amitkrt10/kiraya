"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EXIT_STATUSES } from "@/lib/validation/tenantExit";
import type { PropertyPickerItem } from "@/lib/queries/properties";
import type { UnitPickerItem } from "@/lib/queries/units";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import styles from "@/components/properties/PropertyFilters.module.css";

const STATUS_LABELS: Record<(typeof EXIT_STATUSES)[number], string> = {
  INITIATED: "Initiated",
  PENDING_SETTLEMENT: "Pending Settlement",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export interface ExitFiltersProps {
  properties: PropertyPickerItem[];
  units: UnitPickerItem[];
  tenants: TenantPickerItem[];
}

export function ExitFilters({ properties, units, tenants }: ExitFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPropertyId = searchParams.get("property") ?? "";
  const unitsForProperty = selectedPropertyId
    ? units.filter((unit) => unit.property_id === selectedPropertyId)
    : units;

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
          placeholder="Exit reference…"
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
          value={selectedPropertyId}
          // Changing the property invalidates a unit filter from a different
          // property — cleared here rather than left to point at a unit
          // that's no longer in the filtered list, matching the lease-create
          // form's Property → Unit cascade.
          onChange={(event) => updateParams({ property: event.target.value || undefined, unit: undefined })}
        />
      </div>
      <div className={styles.select}>
        <Select
          label="Unit"
          placeholder="All units"
          options={unitsForProperty.map((unit) => ({
            value: unit.id,
            label: unit.unit_code,
          }))}
          value={searchParams.get("unit") ?? ""}
          onChange={(event) => updateParams({ unit: event.target.value || undefined })}
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
          label="Status"
          placeholder="All statuses"
          options={EXIT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
          value={searchParams.get("status") ?? ""}
          onChange={(event) => updateParams({ status: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}
