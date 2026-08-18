import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { LeasePartyActionState } from "@/lib/actions/leaseParties";
import type { LeasePartyItem } from "@/lib/queries/leaseParties";
import type { TenantPickerItem } from "@/lib/queries/tenants";
import { LEASE_PARTY_ROLES } from "@/lib/validation/leaseParty";
import styles from "@/components/ui/FormSection.module.css";

const ROLE_LABELS: Record<(typeof LEASE_PARTY_ROLES)[number], string> = {
  CO_TENANT: "Co-Tenant",
  OCCUPANT: "Occupant",
  GUARANTOR: "Guarantor",
  OTHER: "Other",
};

export interface LeasePartyFormProps {
  formId: string;
  formAction: (formData: FormData) => void;
  state: LeasePartyActionState;
  tenants: TenantPickerItem[];
  party?: LeasePartyItem;
}

export function LeasePartyForm({ formId, formAction, state, tenants, party }: LeasePartyFormProps) {
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form id={formId} action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.fullWidth}>
          <Select
            label="Role"
            name="partyRole"
            required
            options={LEASE_PARTY_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] }))}
            defaultValue={party?.party_role ?? "CO_TENANT"}
            error={fieldError("partyRole")}
          />
        </div>
        {!party ? (
          <div className={styles.fullWidth}>
            <Select
              label="Existing Tenant"
              name="tenantId"
              placeholder={tenants.length === 0 ? "No tenants yet" : "Select an existing tenant (optional)"}
              options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.display_name }))}
              error={fieldError("tenantId")}
            />
          </div>
        ) : null}
        <Input
          label="Name"
          name="displayName"
          defaultValue={party?.display_name ?? ""}
          hint={party?.tenants ? "Linked to an existing tenant record" : "Required unless an existing tenant is selected"}
          disabled={Boolean(party?.tenants)}
          error={fieldError("displayName")}
        />
        <Input label="Phone" name="phone" type="tel" defaultValue={party?.phone ?? ""} error={fieldError("phone")} />
        <Input
          label="Email"
          name="email"
          type="email"
          defaultValue={party?.email ?? ""}
          error={fieldError("email")}
        />
        <div className={styles.fullWidth}>
          <label htmlFor={`${formId}-notes`} style={{ fontSize: 12, fontWeight: 600 }}>
            Notes
          </label>
          <textarea
            id={`${formId}-notes`}
            name="notes"
            className="input"
            rows={2}
            style={{ marginTop: 6, resize: "vertical" }}
            defaultValue={party?.notes ?? ""}
          />
        </div>
      </div>
    </form>
  );
}
