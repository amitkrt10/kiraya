"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Info } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { recordMeterReadingAction, type MeterReadingActionState } from "@/lib/actions/meterReadings";
import { READING_EVENT_TYPES, READING_SOURCES } from "@/lib/validation/meterReading";
import type { MeterReadingRow } from "@/lib/queries/meterReadings";
import styles from "@/components/ui/FormSection.module.css";

const EVENT_TYPE_LABELS: Record<(typeof READING_EVENT_TYPES)[number], string> = {
  NORMAL: "Normal",
  METER_RESET: "Meter Reset",
  METER_REPLACEMENT: "Meter Replacement",
};

const SOURCE_LABELS: Record<(typeof READING_SOURCES)[number], string> = {
  MANUAL: "Manual",
  IMPORT: "Import",
  API: "API",
};

const initialState: MeterReadingActionState = {};

export function RecordReadingDialog({ meterId, meterCode, latestReading }: { meterId: string; meterCode: string; latestReading: MeterReadingRow | null }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const router = useRouter();
  const action = recordMeterReadingAction.bind(null, meterId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Reading recorded.", variant: "success" });
      router.refresh();
    }
  }, [state.success, show, router]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        Record Reading
      </Button>
      <Dialog
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Record Reading"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Save Reading
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

          <div style={{ border: "1px solid var(--color-neutral-300)", background: "var(--color-neutral-100)", padding: "12px 14px", marginBottom: 16, fontSize: 12 }}>
            <div style={{ color: "var(--color-neutral-700)", marginBottom: 2 }}>Meter</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{meterCode}</div>
            <div style={{ color: "var(--color-neutral-700)", marginBottom: 2 }}>Latest Recorded Reading</div>
            <div style={{ fontWeight: 600 }}>
              {latestReading ? (
                <>
                  {latestReading.reading_value} <span style={{ fontWeight: 400, color: "var(--color-neutral-700)" }}>on {latestReading.reading_date}</span>
                </>
              ) : (
                "No readings recorded yet"
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <Input label="Reading Date" name="readingDate" type="date" required error={fieldError("readingDate")} />
            <Input label="Reading Value" name="readingValue" type="number" step="any" min={0} required error={fieldError("readingValue")} />
            {latestReading ? (
              <p style={{ fontSize: 11, color: "var(--color-neutral-700)", margin: 0 }}>
                Must be ≥ {latestReading.reading_value} (the last recorded reading), unless entered as a meter reset or replacement.
              </p>
            ) : null}
            <Select
              label="Event Type"
              name="readingEventType"
              defaultValue="NORMAL"
              options={READING_EVENT_TYPES.map((value) => ({ value, label: EVENT_TYPE_LABELS[value] }))}
            />
            <Select label="Source" name="readingSource" defaultValue="MANUAL" options={READING_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value] }))} />
            <Input label="Notes" name="notes" error={fieldError("notes")} />

            <div style={{ borderLeft: "2px solid var(--color-neutral-700)", background: "var(--color-neutral-100)", padding: "8px 12px", fontSize: 11, color: "var(--color-neutral-700)", display: "flex", gap: 6 }}>
              <Info width={14} height={14} style={{ flex: "0 0 auto", marginTop: 1 }} aria-hidden="true" />
              <span>Consumption and charge amount are calculated only when a billing run generates the bill — not shown here.</span>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
