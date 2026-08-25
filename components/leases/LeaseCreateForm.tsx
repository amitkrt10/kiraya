"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { createLeaseAction, type LeaseActionState } from "@/lib/actions/leases";
import { LEASE_STATUSES } from "@/lib/validation/lease";
import { BILLING_FREQUENCIES, PRORATION_METHODS } from "@/lib/validation/billingConfig";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import type { PropertyPickerItem } from "@/lib/queries/properties";
import type { UnitPickerItem } from "@/lib/queries/units";
import styles from "@/components/ui/FormSection.module.css";

const STATUS_LABELS: Record<(typeof LEASE_STATUSES)[number], string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
};

const FREQUENCY_LABELS: Record<(typeof BILLING_FREQUENCIES)[number], string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
  WEEKLY: "Weekly",
  CUSTOM: "Custom",
};

const PRORATION_LABELS: Record<(typeof PRORATION_METHODS)[number], string> = {
  CALENDAR_DAYS: "Calendar days",
  FIXED_30_DAYS: "Fixed 30 days",
  DATE_TO_DATE: "Date to date",
  NONE: "None",
};

const initialState: LeaseActionState = {};

export interface LeaseCreateFormProps {
  tenants: TenantPickerItem[];
  properties: PropertyPickerItem[];
  units: UnitPickerItem[];
  preselectedUnitId?: string;
}

export function LeaseCreateForm({ tenants, properties, units, preselectedUnitId }: LeaseCreateFormProps) {
  const [state, formAction, isPending] = useActionState(createLeaseAction, initialState);
  const preselectedUnit = units.find((unit) => unit.id === preselectedUnitId);
  const [selectedPropertyId, setSelectedPropertyId] = useState(preselectedUnit?.property_id ?? "");
  const [billingFrequency, setBillingFrequency] = useState<string>("MONTHLY");

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const unitsForProperty = units.filter((unit) => unit.property_id === selectedPropertyId);

  return (
    <form action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Party &amp; Unit</div>
        <div className={styles.grid}>
          <Select
            label="Tenant"
            name="lease.tenantId"
            required
            placeholder={tenants.length === 0 ? "No tenants yet — create one first" : "Select a tenant"}
            options={tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.display_name} (${tenant.tenant_code})` }))}
            error={fieldError("lease.tenantId")}
          />
          <div />
          <Select
            label="Property"
            placeholder="Select a property"
            options={properties.map((property) => ({ value: property.id, label: property.name }))}
            value={selectedPropertyId}
            onChange={(event) => setSelectedPropertyId(event.target.value)}
          />
          <Select
            label="Unit"
            name="lease.unitId"
            required
            placeholder={
              !selectedPropertyId
                ? "Select a property first"
                : unitsForProperty.length === 0
                  ? "No units in this property"
                  : "Select a unit"
            }
            options={unitsForProperty.map((unit) => ({
              value: unit.id,
              label: unit.unit_code,
            }))}
            defaultValue={preselectedUnitId}
            error={fieldError("lease.unitId")}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Terms</div>
        <div className={styles.grid}>
          <Input label="Lease Code" name="lease.leaseCode" required error={fieldError("lease.leaseCode")} />
          <Select
            label="Status"
            name="lease.status"
            required
            options={LEASE_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
            defaultValue="DRAFT"
            error={fieldError("lease.status")}
          />
          <Input
            label="Agreement Start Date"
            name="lease.agreementStartDate"
            type="date"
            required
            error={fieldError("lease.agreementStartDate")}
          />
          <Input
            label="Agreement End Date"
            name="lease.agreementEndDate"
            type="date"
            error={fieldError("lease.agreementEndDate")}
            hint="Leave blank for an open-ended lease"
          />
          <Input
            label="Occupancy Start Date"
            name="lease.occupancyStartDate"
            type="date"
            required
            error={fieldError("lease.occupancyStartDate")}
          />
          <Input
            label="Currency"
            name="lease.currencyCode"
            required
            maxLength={3}
            defaultValue="INR"
            hint="3-letter code, e.g. INR"
            error={fieldError("lease.currencyCode")}
          />
          <div className={styles.fullWidth}>
            <label htmlFor="lease-notes" style={{ fontSize: 12, fontWeight: 600 }}>
              Notes
            </label>
            <textarea
              id="lease-notes"
              name="lease.notes"
              className="input"
              rows={2}
              style={{ marginTop: 6, resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Initial Rent Rule</div>
        <div className={styles.grid}>
          <Input
            label="Rule Name"
            name="rentRule.ruleName"
            required
            defaultValue="Base Rent"
            error={fieldError("rentRule.ruleName")}
          />
          <Input
            label="Monthly Rent"
            name="rentRule.monthlyRent"
            type="number"
            step="any"
            min={0}
            required
            error={fieldError("rentRule.monthlyRent")}
          />
          <Input
            label="Effective From"
            name="rentRule.effectiveFrom"
            type="date"
            required
            hint="Usually the same as the occupancy start date"
            error={fieldError("rentRule.effectiveFrom")}
          />
          <Input
            label="Effective To"
            name="rentRule.effectiveTo"
            type="date"
            error={fieldError("rentRule.effectiveTo")}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Billing Configuration</div>
        <div className={styles.grid}>
          <Select
            label="Billing Frequency"
            name="billingConfig.billingFrequency"
            required
            options={BILLING_FREQUENCIES.map((value) => ({ value, label: FREQUENCY_LABELS[value] }))}
            value={billingFrequency}
            onChange={(event) => setBillingFrequency(event.target.value)}
            error={fieldError("billingConfig.billingFrequency")}
          />
          <Input
            label="Billing Day"
            name="billingConfig.billingDay"
            type="number"
            min={1}
            max={31}
            required={billingFrequency === "MONTHLY"}
            defaultValue={1}
            hint="Day of month bills are generated"
            error={fieldError("billingConfig.billingDay")}
          />
          <Select
            label="Proration Method"
            name="billingConfig.prorationMethod"
            required
            options={PRORATION_METHODS.map((value) => ({ value, label: PRORATION_LABELS[value] }))}
            defaultValue="CALENDAR_DAYS"
            error={fieldError("billingConfig.prorationMethod")}
          />
          <Input
            label="Due Days After Bill"
            name="billingConfig.dueDaysAfterBill"
            type="number"
            min={0}
            max={365}
            required
            defaultValue={0}
            error={fieldError("billingConfig.dueDaysAfterBill")}
          />
          <Input
            label="Effective From"
            name="billingConfig.effectiveFrom"
            type="date"
            required
            hint="Usually the same as the occupancy start date"
            error={fieldError("billingConfig.effectiveFrom")}
          />
          <Input
            label="Effective To"
            name="billingConfig.effectiveTo"
            type="date"
            error={fieldError("billingConfig.effectiveTo")}
          />
          <div className={styles.fullWidth} style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Checkbox label="Prorate first bill" name="billingConfig.firstBillProrate" defaultChecked />
            <Checkbox label="Prorate final bill" name="billingConfig.finalBillProrate" defaultChecked />
            <Checkbox label="Bill in advance" name="billingConfig.billInAdvance" />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Link href="/app/leases">
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </Link>
        <Button variant="primary" type="submit" loading={isPending}>
          Create Lease
        </Button>
      </div>
    </form>
  );
}
