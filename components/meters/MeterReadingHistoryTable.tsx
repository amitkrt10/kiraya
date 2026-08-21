import { Check, AlertTriangle } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import type { MeterReadingRow } from "@/lib/queries/meterReadings";

const EVENT_TYPE_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  METER_RESET: "Meter Reset",
  METER_REPLACEMENT: "Meter Replacement",
};

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  IMPORT: "Import",
  API: "API",
};

export function MeterReadingHistoryTable({ readings }: { readings: MeterReadingRow[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Value</TableHeaderCell>
          <TableHeaderCell>Event Type</TableHeaderCell>
          <TableHeaderCell>Source</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {readings.map((reading) => (
          <TableRow key={reading.id}>
            <TableCell>{reading.reading_date}</TableCell>
            <TableCell numeric>{reading.reading_value}</TableCell>
            <TableCell>
              {reading.reading_event_type === "NORMAL" ? (
                <Tag variant="neutral" icon={Check}>
                  Normal
                </Tag>
              ) : (
                <Tag variant="outline" icon={AlertTriangle}>
                  {EVENT_TYPE_LABELS[reading.reading_event_type] ?? reading.reading_event_type}
                </Tag>
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{SOURCE_LABELS[reading.reading_source] ?? reading.reading_source}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
