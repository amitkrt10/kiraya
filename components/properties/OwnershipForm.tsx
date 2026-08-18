import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { OwnershipActionState } from "@/lib/actions/ownerships";
import type { OwnerRow } from "@/lib/queries/owners";
import type { PropertyOwnershipItem } from "@/lib/queries/owners";
import styles from "@/components/ui/FormSection.module.css";

export interface OwnershipFormProps {
  formId: string;
  formAction: (formData: FormData) => void;
  state: OwnershipActionState;
  owners: OwnerRow[];
  ownership?: PropertyOwnershipItem;
}

export function OwnershipForm({ formId, formAction, state, owners, ownership }: OwnershipFormProps) {
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form id={formId} action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.grid}>
        {ownership ? (
          <div className={styles.fullWidth}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Owner</div>
            <div style={{ fontSize: 14 }}>{ownership.owners?.display_name ?? "Unknown owner"}</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginTop: 2 }}>
              To assign a different owner, end this record and add a new one.
            </div>
          </div>
        ) : (
          <div className={styles.fullWidth}>
            <Select
              label="Owner"
              name="ownerId"
              required
              placeholder={owners.length === 0 ? "No owners recorded for this organization yet" : "Select an owner"}
              options={owners.map((owner) => ({ value: owner.id, label: owner.display_name }))}
              error={fieldError("ownerId")}
            />
          </div>
        )}
        <Input
          label="Ownership %"
          name="ownershipPercentage"
          type="number"
          step="any"
          min={0}
          max={100}
          required
          defaultValue={ownership?.ownership_percentage}
          error={fieldError("ownershipPercentage")}
        />
        <div />
        <Input
          label="Start Date"
          name="ownershipStartDate"
          type="date"
          defaultValue={ownership?.ownership_start_date ?? ""}
          error={fieldError("ownershipStartDate")}
        />
        <Input
          label="End Date"
          name="ownershipEndDate"
          type="date"
          defaultValue={ownership?.ownership_end_date ?? ""}
          error={fieldError("ownershipEndDate")}
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
            defaultValue={ownership?.notes ?? ""}
          />
        </div>
      </div>
    </form>
  );
}
