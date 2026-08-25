"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createUtilityConfigurationAction, type UtilityConfigurationActionState } from "@/lib/actions/utilityConfigurations";
import { UTILITY_CHARGING_METHODS } from "@/lib/validation/utility";
import type { PropertyPickerItem } from "@/lib/queries/properties";
import type { UnitPickerItem } from "@/lib/queries/units";
import styles from "@/components/ui/FormSection.module.css";

const CHARGING_METHOD_LABELS: Record<(typeof UTILITY_CHARGING_METHODS)[number], string> = {
  FIXED: "Fixed",
  SUB_METER: "Sub-Meter",
  SELF_METER: "Self-Meter",
  OTHER: "Other",
};

const initialState: UtilityConfigurationActionState = {};

export function CreateConfigurationDialog({
  utilityId,
  properties,
  units,
}: {
  utilityId: string;
  properties: PropertyPickerItem[];
  units: UnitPickerItem[];
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"PROPERTY" | "UNIT">("PROPERTY");
  const [meterType, setMeterType] = useState<(typeof UTILITY_CHARGING_METHODS)[number]>("FIXED");
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = createUtilityConfigurationAction.bind(null, utilityId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Configuration added.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Add Configuration
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Add Configuration"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Save Configuration
            </Button>
          </>
        }
      >
        <form id={formId} action={formAction}>
          {state.error ? (
            <div className={styles.errorSpacer}>
              <Alert variant="error">{state.error}</Alert>
            </div>
          ) : null}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 6 }}>Scope</div>
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="radio" name="scope" value="PROPERTY" checked={scope === "PROPERTY"} onChange={() => setScope("PROPERTY")} />
                Property Default
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="radio" name="scope" value="UNIT" checked={scope === "UNIT"} onChange={() => setScope("UNIT")} />
                Unit Override
              </label>
            </div>
            {fieldError("propertyId") ? <div style={{ color: "var(--color-danger)", fontSize: 12, marginTop: 4 }}>{fieldError("propertyId")}</div> : null}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {scope === "PROPERTY" ? (
              <Select
                label="Property"
                name="propertyId"
                required
                placeholder="Select a property…"
                options={properties.map((property) => ({ value: property.id, label: property.name }))}
              />
            ) : (
              <Select
                label="Unit"
                name="unitId"
                required
                placeholder="Select a unit…"
                options={units.map((unit) => ({ value: unit.id, label: unit.unit_code }))}
              />
            )}

            <Select
              label="Charging Method"
              name="meterType"
              required
              value={meterType}
              onChange={(event) => setMeterType(event.target.value as (typeof UTILITY_CHARGING_METHODS)[number])}
              options={UTILITY_CHARGING_METHODS.map((value) => ({ value, label: CHARGING_METHOD_LABELS[value] }))}
            />

            {meterType === "FIXED" ? (
              <Input label="Fixed Amount" name="fixedAmount" type="number" step="any" min={0} required error={fieldError("fixedAmount")} />
            ) : null}

            <Input label="Effective From" name="effectiveFrom" type="date" required error={fieldError("effectiveFrom")} />
            <Input label="Effective To" name="effectiveTo" type="date" error={fieldError("effectiveTo")} />

            <Checkbox label="Tenant chargeable" name="isTenantChargeable" defaultChecked />
            <Checkbox label="Active" name="isActive" defaultChecked />
          </div>
        </form>
      </Dialog>
    </>
  );
}
