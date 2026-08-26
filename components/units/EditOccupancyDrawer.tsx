"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { updateOccupancyAction, type OccupancyActionState } from "@/lib/actions/occupancy";
import type { LeaseRow } from "@/lib/queries/leases";
import styles from "@/components/ui/FormSection.module.css";

const initialState: OccupancyActionState = {};

/**
 * P6.3-F: the Tenant/Unit-facing replacement for /app/leases/[id]/edit —
 * only the fields the audit found genuinely still meaningful to a human:
 * Occupancy Start Date, Notice/Move-in/Move-out Date, Notes. Never
 * lease_code/status/currency (removed) or a tenant/unit picker
 * (reassignment isn't an edit operation — it's a new Assign Tenant, same
 * as before this checkpoint).
 */
export function EditOccupancyDrawer({ leaseId, unitId, lease }: { leaseId: string; unitId: string; lease: LeaseRow }) {
  const [open, setOpen] = useState(false);
  const { show } = useToast();
  const formId = useId();
  const handledSuccess = useRef(false);
  const action = updateOccupancyAction.bind(null, leaseId, unitId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  useEffect(() => {
    if (state.success && !handledSuccess.current) {
      handledSuccess.current = true;
      setOpen(false);
      show({ message: "Occupancy updated.", variant: "success" });
    }
  }, [state.success, show]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Pencil width={16} height={16} aria-hidden="true" />
        Edit Occupancy
      </Button>
      <Drawer
        open={open}
        onClose={() => {
          handledSuccess.current = false;
          setOpen(false);
        }}
        title="Edit Occupancy"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} loading={isPending}>
              Save Changes
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
          <div className={styles.grid}>
            <Input
              label="Occupancy Start Date"
              name="occupancyStartDate"
              type="date"
              required
              defaultValue={lease.occupancy_start_date}
              error={fieldError("occupancyStartDate")}
            />
            <Input
              label="Notice Date"
              name="noticeDate"
              type="date"
              defaultValue={lease.notice_date ?? ""}
              hint="When the tenant gave notice to vacate"
              error={fieldError("noticeDate")}
            />
            <Input
              label="Move-in Date"
              name="moveInDate"
              type="date"
              defaultValue={lease.move_in_date ?? ""}
              error={fieldError("moveInDate")}
            />
            <Input
              label="Move-out Date"
              name="moveOutDate"
              type="date"
              defaultValue={lease.move_out_date ?? ""}
              error={fieldError("moveOutDate")}
            />
            <div className={styles.fullWidth}>
              <label htmlFor={`${formId}-notes`} style={{ fontSize: 12, fontWeight: 600 }}>
                Notes
              </label>
              <textarea
                id={`${formId}-notes`}
                name="notes"
                className="input"
                rows={3}
                style={{ marginTop: 6, resize: "vertical" }}
                defaultValue={lease.notes ?? ""}
              />
            </div>
          </div>
        </form>
      </Drawer>
    </>
  );
}
