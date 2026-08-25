"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { createMeterAction, type MeterActionState } from "@/lib/actions/meters";
import { UTILITY_CHARGING_METHODS } from "@/lib/validation/utility";
import type { UtilityRow } from "@/lib/queries/utilities";
import type { PropertyPickerItem } from "@/lib/queries/properties";
import type { UnitPickerItem } from "@/lib/queries/units";
import styles from "@/components/ui/FormSection.module.css";

const METER_TYPE_LABELS: Record<(typeof UTILITY_CHARGING_METHODS)[number], string> = {
  FIXED: "Fixed",
  SUB_METER: "Sub-Meter",
  SELF_METER: "Self-Meter",
  OTHER: "Other",
};

const initialState: MeterActionState = {};

export function CreateMeterDialog({
  utilities,
  properties,
  units,
}: {
  utilities: UtilityRow[];
  properties: PropertyPickerItem[];
  units: UnitPickerItem[];
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"PROPERTY" | "UNIT">("UNIT");
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createMeterAction, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Meter added.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Add Meter
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Add Meter"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Save Meter
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
          <div style={{ display: "grid", gap: 12 }}>
            <Input label="Meter Code" name="meterCode" required error={fieldError("meterCode")} />
            <Select
              label="Utility"
              name="utilityId"
              required
              placeholder="Select a utility…"
              options={utilities.map((utility) => ({ value: utility.id, label: utility.name }))}
              error={fieldError("utilityId")}
            />
            <Select
              label="Meter Type"
              name="meterType"
              required
              defaultValue="SUB_METER"
              options={UTILITY_CHARGING_METHODS.map((value) => ({ value, label: METER_TYPE_LABELS[value] }))}
            />

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 6 }}>Scope</div>
              <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="radio" name="scope" value="UNIT" checked={scope === "UNIT"} onChange={() => setScope("UNIT")} />
                  Unit
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="radio" name="scope" value="PROPERTY" checked={scope === "PROPERTY"} onChange={() => setScope("PROPERTY")} />
                  Property
                </label>
              </div>
              {fieldError("propertyId") ? <div style={{ color: "var(--color-danger)", fontSize: 12, marginTop: 4 }}>{fieldError("propertyId")}</div> : null}
            </div>

            {scope === "UNIT" ? (
              <Select
                label="Unit"
                name="unitId"
                required
                placeholder="Select a unit…"
                options={units.map((unit) => ({ value: unit.id, label: unit.unit_code }))}
              />
            ) : (
              <Select
                label="Property"
                name="propertyId"
                required
                placeholder="Select a property…"
                options={properties.map((property) => ({ value: property.id, label: property.name }))}
              />
            )}

            <Input label="Serial Number" name="serialNumber" error={fieldError("serialNumber")} />
            <Input label="Unit Name" name="unitName" placeholder="e.g. kWh" error={fieldError("unitName")} />
            <Input label="Multiplier" name="multiplier" type="number" step="any" min={0.0001} placeholder="1" error={fieldError("multiplier")} />
            <Input label="Installed On" name="installedOn" type="date" error={fieldError("installedOn")} />
            <Input label="Initial Reading" name="initialReading" type="number" step="any" min={0} error={fieldError("initialReading")} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
