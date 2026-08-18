import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { UnitActionState } from "@/lib/actions/units";
import type { UnitDetail } from "@/lib/queries/units";
import type { UnitType } from "@/lib/queries/unitTypes";
import { UNIT_STATUSES } from "@/lib/validation/unit";
import styles from "@/components/ui/FormSection.module.css";

const STATUS_LABELS: Record<(typeof UNIT_STATUSES)[number], string> = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
  UNAVAILABLE: "Unavailable",
};

export interface UnitFormProps {
  formId: string;
  formAction: (formData: FormData) => void;
  state: UnitActionState;
  unit?: UnitDetail;
  unitTypes: UnitType[];
}

export function UnitForm({ formId, formAction, state, unit, unitTypes }: UnitFormProps) {
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form id={formId} action={formAction}>
      {state.error ? (
        <div className={styles.errorSpacer}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Identity</div>
        <div className={styles.grid}>
          <Input
            label="Unit Code"
            name="unitCode"
            required
            defaultValue={unit?.unit_code}
            error={fieldError("unitCode")}
          />
          <Input label="Name" name="name" defaultValue={unit?.name ?? ""} error={fieldError("name")} />
          <Select
            label="Unit Type"
            name="unitTypeId"
            placeholder={unitTypes.length === 0 ? "No unit types configured yet" : "Select a type"}
            options={unitTypes.map((type) => ({ value: type.id, label: type.name }))}
            defaultValue={unit?.unit_type_id ?? ""}
            error={fieldError("unitTypeId")}
          />
          <Select
            label="Status"
            name="status"
            required
            options={UNIT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
            defaultValue={unit?.status ?? "VACANT"}
            error={fieldError("status")}
          />
          <div className={styles.fullWidth}>
            <label htmlFor={`${formId}-description`} style={{ fontSize: 12, fontWeight: 600 }}>
              Description
            </label>
            <textarea
              id={`${formId}-description`}
              name="description"
              className="input"
              rows={3}
              style={{ marginTop: 6, resize: "vertical" }}
              defaultValue={unit?.description ?? ""}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Physical</div>
        <div className={styles.grid}>
          <Input
            label="Floor Number"
            name="floorNumber"
            type="number"
            step="1"
            defaultValue={unit?.floor_number ?? ""}
            error={fieldError("floorNumber")}
          />
          <div />
          <Input
            label="Area"
            name="area"
            type="number"
            step="any"
            min={0}
            defaultValue={unit?.area ?? ""}
            error={fieldError("area")}
          />
          <Input
            label="Area Unit"
            name="areaUnit"
            placeholder="e.g. sq_ft, sq_m"
            defaultValue={unit?.area_unit ?? ""}
            error={fieldError("areaUnit")}
          />
          <Input
            label="Bedrooms"
            name="bedrooms"
            type="number"
            step="0.5"
            min={0}
            defaultValue={unit?.bedrooms ?? ""}
            error={fieldError("bedrooms")}
          />
          <Input
            label="Bathrooms"
            name="bathrooms"
            type="number"
            step="0.5"
            min={0}
            defaultValue={unit?.bathrooms ?? ""}
            error={fieldError("bathrooms")}
          />
        </div>
      </div>
    </form>
  );
}
