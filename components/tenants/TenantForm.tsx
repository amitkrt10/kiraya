"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { TenantActionState } from "@/lib/actions/tenants";
import type { TenantRow } from "@/lib/queries/tenants";
import type { TenantContactRow } from "@/lib/queries/tenantContacts";
import { findContactSlot } from "@/lib/utils/tenantContacts";
import { TENANT_RELIGIONS, TENANT_STATUSES, TENANT_TYPES, type ContactFieldPrefix } from "@/lib/validation/tenant";
import styles from "@/components/ui/FormSection.module.css";

const TYPE_LABELS: Record<(typeof TENANT_TYPES)[number], string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Company",
  OTHER: "Other",
  SCHOOL: "School",
  INSTITUTE: "Institute",
  FAMILY: "Family",
};

const STATUS_LABELS: Record<(typeof TENANT_STATUSES)[number], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

const RELIGION_LABELS: Record<(typeof TENANT_RELIGIONS)[number], string> = {
  HINDU: "Hindu",
  MUSLIM: "Muslim",
  CHRISTIAN: "Christian",
  SIKH: "Sikh",
  BUDDHIST: "Buddhist",
  JAIN: "Jain",
  PARSI_ZOROASTRIAN: "Parsi / Zoroastrian",
  JEWISH: "Jewish",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export interface TenantFormProps {
  action: (prevState: TenantActionState, formData: FormData) => Promise<TenantActionState>;
  tenant?: TenantRow;
  /** Existing contact slots when editing — omitted (all 4 slots render blank) when creating. */
  contacts?: TenantContactRow[];
  cancelHref: string;
  submitLabel: string;
}

const initialState: TenantActionState = {};

/**
 * A single Name/Phone/Address block used for all 4 contact slots
 * (Emergency Contact 1/2, Local Reference 1/2) — every field name is
 * `${fieldPrefix}Name`/`Phone`/`Address`, flat top-level keys matching
 * tenantFormSchema exactly (see lib/validation/tenant.ts for why these
 * are flat rather than nested).
 */
function ContactFields({
  fieldPrefix,
  slot,
  fieldError,
}: {
  fieldPrefix: ContactFieldPrefix;
  slot: TenantContactRow | null;
  fieldError: (name: string) => string | undefined;
}) {
  return (
    <div className={styles.grid}>
      <Input
        label="Name"
        name={`${fieldPrefix}Name`}
        defaultValue={slot?.name ?? ""}
        error={fieldError(`${fieldPrefix}Name`)}
      />
      <Input
        label="Phone"
        name={`${fieldPrefix}Phone`}
        type="tel"
        defaultValue={slot?.phone ?? ""}
        error={fieldError(`${fieldPrefix}Phone`)}
      />
      <div className={styles.fullWidth}>
        <Input
          label="Address"
          name={`${fieldPrefix}Address`}
          defaultValue={slot?.address ?? ""}
          error={fieldError(`${fieldPrefix}Address`)}
        />
      </div>
    </div>
  );
}

export function TenantForm({ action, tenant, contacts = [], cancelHref, submitLabel }: TenantFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  const emergencyContact1 = findContactSlot(contacts, "EMERGENCY", 1);
  const emergencyContact2 = findContactSlot(contacts, "EMERGENCY", 2);
  const localReference1 = findContactSlot(contacts, "LOCAL_REFERENCE", 1);
  const localReference2 = findContactSlot(contacts, "LOCAL_REFERENCE", 2);

  return (
    <form action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      {/*
        Tenant Code is never shown here (P6.2-D2) — it's generated
        automatically by kiraya.generate_tenant_code() on insert and
        never changes on edit. No Unit/Property/Occupancy/Rent/Billing/
        Deposit fields either — those belong to the future Unit ->
        Assign Tenant flow (P6.2-D3), not tenant creation.
      */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Identity</div>
        <div className={styles.grid}>
          <Input
            label="Name"
            name="displayName"
            required
            defaultValue={tenant?.display_name}
            error={fieldError("displayName")}
          />
          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            defaultValue={tenant?.date_of_birth ?? ""}
            error={fieldError("dateOfBirth")}
          />
          <Select
            label="Religion"
            name="religion"
            placeholder="Select (optional)"
            options={TENANT_RELIGIONS.map((value) => ({ value, label: RELIGION_LABELS[value] }))}
            defaultValue={tenant?.religion ?? ""}
            error={fieldError("religion")}
          />
          <Input
            label="No. of Members"
            name="memberCount"
            type="number"
            min={1}
            step={1}
            defaultValue={tenant?.member_count ?? ""}
            error={fieldError("memberCount")}
            hint="People occupying under this tenant profile — not the number of units rented"
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
        <div className={styles.sectionLabel}>Identity Documents</div>
        <div className={styles.grid}>
          <Input
            label="Aadhaar No."
            name="aadhaarNumber"
            defaultValue={tenant?.aadhaar_number ?? ""}
            error={fieldError("aadhaarNumber")}
          />
          <Input
            label="PAN No."
            name="panNumber"
            defaultValue={tenant?.pan_number ?? ""}
            error={fieldError("panNumber")}
          />
          <Input
            label="Other Document No."
            name="otherIdentityDocumentNumber"
            defaultValue={tenant?.other_identity_document_number ?? ""}
            error={fieldError("otherIdentityDocumentNumber")}
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
        <div className={styles.sectionLabel}>Emergency Contact 1</div>
        <ContactFields fieldPrefix="emergencyContact1" slot={emergencyContact1} fieldError={fieldError} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Emergency Contact 2</div>
        <ContactFields fieldPrefix="emergencyContact2" slot={emergencyContact2} fieldError={fieldError} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Local Reference 1</div>
        <ContactFields fieldPrefix="localReference1" slot={localReference1} fieldError={fieldError} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Local Reference 2</div>
        <ContactFields fieldPrefix="localReference2" slot={localReference2} fieldError={fieldError} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Notes</div>
        <div className={styles.grid}>
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
