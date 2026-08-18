import Link from "next/link";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { PropertyStatusTag } from "./PropertyStatusTag";
import type { PropertyListItem } from "@/lib/queries/properties";
import { formatPropertyLocation } from "@/lib/utils/format";

export function PropertyTable({ properties }: { properties: PropertyListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Location</TableHeaderCell>
          <TableHeaderCell scope="col" style={{ textAlign: "right" }}>
            Units
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {properties.map((property) => (
          <TableRow key={property.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/properties/${property.id}`}>{property.property_code}</Link>
            </TableCell>
            <TableCell>
              <Link href={`/app/properties/${property.id}`}>{property.name}</Link>
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {property.property_types?.name ?? "—"}
            </TableCell>
            <TableCell>
              <PropertyStatusTag status={property.status} />
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {formatPropertyLocation(property)}
            </TableCell>
            <TableCell numeric>{property.unit_count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
