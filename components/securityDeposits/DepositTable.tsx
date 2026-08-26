import Link from "next/link";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { DepositStatusTag } from "./DepositStatusTag";
import type { SecurityDepositListItem } from "@/lib/queries/securityDeposits";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

export function DepositTable({ deposits }: { deposits: SecurityDepositListItem[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Deposit</TableHeaderCell>
          <TableHeaderCell>Tenant</TableHeaderCell>
          <TableHeaderCell>Property</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Required</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Received</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Held</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Deducted</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Refunded</TableHeaderCell>
          <TableHeaderCell>Recorded</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {deposits.map((deposit) => (
          <TableRow key={deposit.id}>
            <TableCell style={{ fontWeight: 600 }}>
              {/*
                P6.3-H: this must never link to Tenant Detail's ?tab=deposit —
                that tab resolves to only one occupancy (the tenant's current
                lease, or their single most recent ended one), so for a
                tenant with more than one ended occupancy it can silently
                open a *different* deposit than the one clicked here.
                P6.3-J: links to this deposit's exact occupancy page (never
                the bare unit page, which — like the tenant tab above —
                would show whichever lease is ACTIVE *today*, not
                necessarily this deposit's own lease if the unit has since
                been reassigned).
              */}
              {deposit.leases ? (
                <Link href={`/app/units/${deposit.leases.unit_id}/occupancies/${deposit.lease_id}`}>{deposit.deposit_reference}</Link>
              ) : (
                deposit.deposit_reference
              )}
            </TableCell>
            <TableCell>
              {/* Generic tenant link only — deliberately no ?tab=deposit, since that tab can't be trusted to resolve back to this specific deposit. */}
              {deposit.tenants ? <Link href={`/app/tenants/${deposit.tenant_id}`}>{deposit.tenants.display_name}</Link> : "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>
              {deposit.leases?.units?.properties?.name ?? "—"}
            </TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{deposit.leases?.units?.unit_code ?? "—"}</TableCell>
            <TableCell numeric>{formatCurrency(deposit.required_amount, deposit.currency_code)}</TableCell>
            <TableCell numeric>{formatCurrency(deposit.received_amount, deposit.currency_code)}</TableCell>
            <TableCell numeric style={{ fontWeight: 600 }}>
              {formatCurrency(deposit.held, deposit.currency_code)}
            </TableCell>
            <TableCell numeric>{formatCurrency(deposit.deducted_amount, deposit.currency_code)}</TableCell>
            <TableCell numeric>{formatCurrency(deposit.refunded_amount, deposit.currency_code)}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{deposit.created_at.slice(0, 10)}</TableCell>
            <TableCell>
              <DepositStatusTag status={deposit.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
