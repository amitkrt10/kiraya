"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { submitBatchReadingsAction, type BatchReadingActionState } from "@/lib/actions/meterReadings";
import type { MeterForBatchItem } from "@/lib/queries/meters";

const initialState: BatchReadingActionState = {};

/**
 * Each non-blank row is submitted together in one request, but every
 * reading is still its own independent kiraya.meter_readings insert
 * inside submitBatchReadingsAction/recordBatchMeterReadings — there is
 * no wrapping database transaction, matching the approved design: one
 * meter's rejection never blocks or rolls back any other row.
 */
export function BatchReadingForm({
  propertyId,
  readingDate,
  meters,
}: {
  propertyId: string;
  readingDate: string;
  meters: MeterForBatchItem[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const action = submitBatchReadingsAction.bind(null, propertyId, readingDate);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const rowsJson = useMemo(() => {
    const rows = Object.entries(values)
      .filter(([, value]) => value.trim() !== "")
      .map(([meterId, value]) => ({ meterId, readingValue: Number(value) }));
    return JSON.stringify(rows);
  }, [values]);

  const resultFor = (meterId: string) => state.results?.find((result) => result.meterId === meterId);

  const savedCount = state.results?.filter((result) => result.status === "saved").length ?? 0;
  const errorCount = state.results?.filter((result) => result.status === "error").length ?? 0;
  const missingCount = meters.length - (state.results?.length ?? 0);

  return (
    <form action={formAction}>
      <input type="hidden" name="rows" value={rowsJson} />

      {state.error ? (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="error">{state.error}</Alert>
        </div>
      ) : null}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Unit</TableHeaderCell>
            <TableHeaderCell>Meter</TableHeaderCell>
            <TableHeaderCell>Utility</TableHeaderCell>
            <TableHeaderCell style={{ textAlign: "right" }}>Previous</TableHeaderCell>
            <TableHeaderCell>New Reading</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {meters.map((meter) => {
            const result = resultFor(meter.id);
            const value = values[meter.id] ?? "";
            const alreadySaved = result?.status === "saved";
            return (
              <TableRow key={meter.id}>
                <TableCell style={{ fontWeight: 600 }}>{meter.units?.unit_code ?? "—"}</TableCell>
                <TableCell>{meter.meter_code}</TableCell>
                <TableCell>{meter.utilities?.name ?? "—"}</TableCell>
                <TableCell numeric>{meter.latest_reading ? meter.latest_reading.reading_value : "—"}</TableCell>
                <TableCell style={{ width: 160 }}>
                  <Input
                    aria-label={`Reading for ${meter.meter_code}`}
                    type="number"
                    step="any"
                    min={0}
                    placeholder="Enter reading…"
                    value={value}
                    disabled={alreadySaved}
                    onChange={(event) => setValues((prev) => ({ ...prev, [meter.id]: event.target.value }))}
                  />
                  {result?.status === "error" ? <div style={{ fontSize: 11, color: "var(--color-danger)", marginTop: 4 }}>{result.error}</div> : null}
                </TableCell>
                <TableCell>
                  {result?.status === "saved" ? (
                    <Tag variant="neutral" icon={Check}>
                      Saved
                    </Tag>
                  ) : result?.status === "error" ? (
                    <Tag variant="accent" icon={AlertTriangle}>
                      Error
                    </Tag>
                  ) : value.trim() === "" ? (
                    <Tag variant="outline" icon={AlertTriangle}>
                      Missing
                    </Tag>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 20 }}>
        <Button variant="primary" type="submit" loading={isPending}>
          Save Readings
        </Button>
        {state.results ? (
          <span style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
            {savedCount} saved · {errorCount} error{errorCount === 1 ? "" : "s"} · {missingCount} missing
          </span>
        ) : null}
      </div>
    </form>
  );
}
