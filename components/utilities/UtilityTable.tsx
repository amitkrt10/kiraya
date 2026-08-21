import Link from "next/link";
import { Gauge, Zap } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { ActiveTag } from "./ActiveTag";
import type { UtilityListItem } from "@/lib/queries/utilities";

export function UtilityTable({ utilities }: { utilities: UtilityListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Utility</TableHeaderCell>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Scope</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Configurations</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {utilities.map((utility) => (
          <TableRow key={utility.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/utilities/${utility.id}`}>{utility.name}</Link>
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{utility.code}</TableCell>
            <TableCell>
              {utility.is_metered ? (
                <Tag variant="accent" icon={Gauge}>
                  Metered
                </Tag>
              ) : (
                <Tag variant="outline" icon={Zap}>
                  Fixed
                </Tag>
              )}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{utility.organization_id === null ? "Shared" : "Org-specific"}</TableCell>
            <TableCell numeric>{utility.configuration_count}</TableCell>
            <TableCell>
              <ActiveTag active={utility.is_active} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
