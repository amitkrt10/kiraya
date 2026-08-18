import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { PropertyActionState } from "@/lib/actions/properties";
import type { PropertyDetail } from "@/lib/queries/properties";
import type { PropertyType } from "@/lib/queries/propertyTypes";
import { PROPERTY_STATUSES } from "@/lib/validation/property";
import styles from "@/components/ui/FormSection.module.css";

const STATUS_LABELS: Record<(typeof PROPERTY_STATUSES)[number], string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export interface PropertyFormProps {
  formId: string;
  formAction: (formData: FormData) => void;
  state: PropertyActionState;
  property?: PropertyDetail;
  propertyTypes: PropertyType[];
}

export function PropertyForm({ formId, formAction, state, property, propertyTypes }: PropertyFormProps) {
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
            label="Property Code"
            name="propertyCode"
            required
            defaultValue={property?.property_code}
            error={fieldError("propertyCode")}
          />
          <Input
            label="Name"
            name="name"
            required
            defaultValue={property?.name}
            error={fieldError("name")}
          />
          <Select
            label="Property Type"
            name="propertyTypeId"
            placeholder={
              propertyTypes.length === 0 ? "No property types configured yet" : "Select a type"
            }
            options={propertyTypes.map((type) => ({ value: type.id, label: type.name }))}
            defaultValue={property?.property_type_id ?? ""}
            error={fieldError("propertyTypeId")}
          />
          <Select
            label="Status"
            name="status"
            required
            options={PROPERTY_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))}
            defaultValue={property?.status ?? "ACTIVE"}
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
              defaultValue={property?.description ?? ""}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Location</div>
        <div className={styles.grid}>
          <div className={styles.fullWidth}>
            <Input
              label="Address Line 1"
              name="addressLine1"
              defaultValue={property?.address_line_1 ?? ""}
              error={fieldError("addressLine1")}
            />
          </div>
          <div className={styles.fullWidth}>
            <Input
              label="Address Line 2"
              name="addressLine2"
              defaultValue={property?.address_line_2 ?? ""}
              error={fieldError("addressLine2")}
            />
          </div>
          <Input
            label="Locality"
            name="locality"
            defaultValue={property?.locality ?? ""}
            error={fieldError("locality")}
          />
          <Input label="City" name="city" defaultValue={property?.city ?? ""} error={fieldError("city")} />
          <Input
            label="State"
            name="state"
            defaultValue={property?.state ?? ""}
            error={fieldError("state")}
          />
          <Input
            label="Postal Code"
            name="postalCode"
            defaultValue={property?.postal_code ?? ""}
            error={fieldError("postalCode")}
          />
          <Input
            label="Country"
            name="countryCode"
            required
            maxLength={2}
            defaultValue={property?.country_code ?? "IN"}
            hint="2-letter code, e.g. IN"
            error={fieldError("countryCode")}
          />
          <Input
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={property?.latitude ?? ""}
            error={fieldError("latitude")}
          />
          <Input
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={property?.longitude ?? ""}
            error={fieldError("longitude")}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Physical</div>
        <div className={styles.grid}>
          <Input
            label="Total Area"
            name="totalArea"
            type="number"
            step="any"
            min={0}
            defaultValue={property?.total_area ?? ""}
            error={fieldError("totalArea")}
          />
          <Input
            label="Area Unit"
            name="areaUnit"
            placeholder="e.g. sq_ft, sq_m, acre"
            defaultValue={property?.area_unit ?? ""}
            error={fieldError("areaUnit")}
          />
        </div>
      </div>
    </form>
  );
}
