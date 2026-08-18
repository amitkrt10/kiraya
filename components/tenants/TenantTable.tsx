import Link from "next/link";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/Table";
import { TenantStatusTag } from "./TenantStatusTag";
import type { TenantListItem } from "@/lib/queries/tenants";

const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Company",
  OTHER: "Other",
};

export function TenantTable({ tenants }: { tenants: TenantListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Code</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Contact</TableHeaderCell>
          <TableHeaderCell>Property / Unit</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tenants.map((tenant) => (
          <TableRow key={tenant.id}>
            <TableCell style={{ fontWeight: 600 }}>
              <Link href={`/app/tenants/${tenant.id}`}>{tenant.tenant_code}</Link>
            </TableCell>
            <TableCell>
              <Link href={`/app/tenants/${tenant.id}`}>{tenant.display_name}</Link>
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {TYPE_LABELS[tenant.tenant_type] ?? tenant.tenant_type}
            </TableCell>
            <TableCell>
              <TenantStatusTag status={tenant.status} />
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {tenant.phone ?? tenant.email ?? "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {tenant.current_property_name
                ? `${tenant.current_property_name} · ${tenant.current_unit_code}`
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
