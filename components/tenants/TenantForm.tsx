"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { TenantActionState } from "@/lib/actions/tenants";
import type { TenantRow } from "@/lib/queries/tenants";
import { TENANT_STATUSES, TENANT_TYPES } from "@/lib/validation/tenant";
import styles from "@/components/ui/FormSection.module.css";

const TYPE_LABELS: Record<(typeof TENANT_TYPES)[number], string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Company",
  OTHER: "Other",
};

const STATUS_LABELS: Record<(typeof TENANT_STATUSES)[number], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export interface TenantFormProps {
  action: (prevState: TenantActionState, formData: FormData) => Promise<TenantActionState>;
  tenant?: TenantRow;
  cancelHref: string;
  submitLabel: string;
}

const initialState: TenantActionState = {};

export function TenantForm({ action, tenant, cancelHref, submitLabel }: TenantFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Identity</div>
        <div className={styles.grid}>
          <Input
            label="Tenant Code"
            name="tenantCode"
            required
            defaultValue={tenant?.tenant_code}
            error={fieldError("tenantCode")}
          />
          <Input
            label="Name"
            name="displayName"
            required
            defaultValue={tenant?.display_name}
            error={fieldError("displayName")}
          />
          <Select
            label="Tenant Type"
            name="tenantType"
            required
            options={TENANT_TYPES.map((value) => ({ value, label: TYPE_LABELS[value] }))}
            defaultValue={tenant?.tenant_type ?? "INDIVIDUAL"}
            error={fieldError("tenantType")}
          />
          <Select
            label="Status"
            name="status"
            required
            options={TENANT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
            defaultValue={tenant?.status ?? "ACTIVE"}
            error={fieldError("status")}
          />
          <Input
            label="Legal Name"
            name="legalName"
            defaultValue={tenant?.legal_name ?? ""}
            error={fieldError("legalName")}
            hint="Full legal/registered name, if different"
          />
          <Input
            label="Company Registration Number"
            name="companyRegistrationNumber"
            defaultValue={tenant?.company_registration_number ?? ""}
            error={fieldError("companyRegistrationNumber")}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Contact</div>
        <div className={styles.grid}>
          <Input
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={tenant?.phone ?? ""}
            error={fieldError("phone")}
          />
          <Input
            label="Alternate Phone"
            name="alternatePhone"
            type="tel"
            defaultValue={tenant?.alternate_phone ?? ""}
            error={fieldError("alternatePhone")}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={tenant?.email ?? ""}
            error={fieldError("email")}
          />
          <div />
          <Input
            label="Emergency Contact Name"
            name="emergencyContactName"
            defaultValue={tenant?.emergency_contact_name ?? ""}
            error={fieldError("emergencyContactName")}
          />
          <Input
            label="Emergency Contact Phone"
            name="emergencyContactPhone"
            type="tel"
            defaultValue={tenant?.emergency_contact_phone ?? ""}
            error={fieldError("emergencyContactPhone")}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Address</div>
        <div className={styles.grid}>
          <div className={styles.fullWidth}>
            <Input
              label="Address Line 1"
              name="addressLine1"
              defaultValue={tenant?.address_line_1 ?? ""}
              error={fieldError("addressLine1")}
            />
          </div>
          <div className={styles.fullWidth}>
            <Input
              label="Address Line 2"
              name="addressLine2"
              defaultValue={tenant?.address_line_2 ?? ""}
              error={fieldError("addressLine2")}
            />
          </div>
          <Input
            label="Locality"
            name="locality"
            defaultValue={tenant?.locality ?? ""}
            error={fieldError("locality")}
          />
          <Input label="City" name="city" defaultValue={tenant?.city ?? ""} error={fieldError("city")} />
          <Input label="State" name="state" defaultValue={tenant?.state ?? ""} error={fieldError("state")} />
          <Input
            label="Postal Code"
            name="postalCode"
            defaultValue={tenant?.postal_code ?? ""}
            error={fieldError("postalCode")}
          />
          <Input
            label="Country"
            name="countryCode"
            required
            maxLength={2}
            defaultValue={tenant?.country_code ?? "IN"}
            hint="2-letter code, e.g. IN"
            error={fieldError("countryCode")}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Additional Details</div>
        <div className={styles.grid}>
          <Input
            label="Tax Identifier"
            name="taxIdentifier"
            defaultValue={tenant?.tax_identifier ?? ""}
            error={fieldError("taxIdentifier")}
            hint="e.g. PAN or company tax number"
          />
          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            defaultValue={tenant?.date_of_birth ?? ""}
            error={fieldError("dateOfBirth")}
          />
          <div className={styles.fullWidth}>
            <label htmlFor="tenant-notes" style={{ fontSize: 12, fontWeight: 600 }}>
              Notes
            </label>
            <textarea
              id="tenant-notes"
              name="notes"
              className="input"
              rows={3}
              style={{ marginTop: 6, resize: "vertical" }}
              defaultValue={tenant?.notes ?? ""}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Link href={cancelHref}>
          <Button variant="secondary" type="button">
            Cancel
          </Button>
        </Link>
        <Button variant="primary" type="submit" loading={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
