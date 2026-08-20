import { CreditCard } from "lucide-react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentMethodFormDrawer } from "./PaymentMethodFormDrawer";
import type { PaymentMethodRow } from "@/lib/queries/paymentMethods";

const TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  ONLINE: "Online",
  DISCOUNT: "Discount",
  OTHER: "Other",
};

export function PaymentMethodsTable({ methods, canWrite }: { methods: PaymentMethodRow[]; canWrite: boolean }) {
  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <PaymentMethodFormDrawer />
        </div>
      ) : null}

      {methods.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment methods yet"
          description="Add at least one payment method before you can record payments."
          action={canWrite ? <PaymentMethodFormDrawer /> : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Scope</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {methods.map((method) => (
              <TableRow key={method.id}>
                <TableCell style={{ fontWeight: 600 }}>{method.name}</TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>{method.code}</TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {TYPE_LABELS[method.method_type] ?? method.method_type}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {method.organization_id ? "This organization" : "Global"}
                </TableCell>
                <TableCell style={{ color: "var(--color-neutral-700)" }}>
                  {method.is_active ? "Active" : "Inactive"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
