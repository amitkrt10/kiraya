import Link from "next/link";
import { Gauge } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { ActiveTag } from "@/components/utilities/ActiveTag";
import type { MeterListItem } from "@/lib/queries/meters";

const METER_TYPE_LABELS: Record<string, string> = {
  FIXED: "Fixed",
  SUB_METER: "Sub-Meter",
  SELF_METER: "Self-Meter",
  OTHER: "Other",
};

export function MeterTable({ meters }: { meters: MeterListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Meter</TableHeaderCell>
          <TableHeaderCell>Utility</TableHeaderCell>
          <TableHeaderCell>Unit / Property</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Latest Reading</TableHeaderCell>
          <TableHeaderCell>Reading Date</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {meters.map((meter) => (
          <TableRow key={meter.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/meters/${meter.id}`}>{meter.meter_code}</Link>
            </TableCell>
            <TableCell>{meter.utilities?.name ?? "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {meter.units?.unit_code ?? meter.properties?.name ?? "—"}
            </TableCell>
            <TableCell>
              <Tag variant="accent" icon={Gauge}>
                {METER_TYPE_LABELS[meter.meter_type] ?? meter.meter_type}
              </Tag>
            </TableCell>
            <TableCell>
              <ActiveTag active={meter.is_active} />
            </TableCell>
            <TableCell numeric>{meter.latest_reading ? meter.latest_reading.reading_value : "—"}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{meter.latest_reading ? meter.latest_reading.reading_date : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
