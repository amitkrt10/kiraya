import type { PaymentDetail, PaymentAllocationItem } from "@/lib/queries/payments";
import styles from "@/components/properties/PropertyTiles.module.css";

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/**
 * "Allocated"/"Unallocated" here are plain display arithmetic over rows
 * already fetched from the database (payment.amount minus the sum of this
 * payment's own allocated_amount rows) — not an independent financial
 * calculation. The authoritative allocation decision itself was made
 * entirely by kiraya.allocate_payment_to_bills().
 */
export function PaymentSummary({ payment, allocations }: { payment: PaymentDetail; allocations: PaymentAllocationItem[] }) {
  const allocatedTotal = allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0);
  const unallocated = Math.max(0, payment.amount - allocatedTotal);

  const tiles = [
    { label: "Payment Amount", value: formatCurrency(payment.amount, payment.currency_code) },
    { label: "Allocated to Bills", value: formatCurrency(allocatedTotal, payment.currency_code) },
    { label: "Unallocated (Credit)", value: formatCurrency(unallocated, payment.currency_code) },
  ];

  return (
    <div className={styles.tiles}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <div className={styles.label}>{tile.label}</div>
          <div className={styles.value}>{tile.value}</div>
        </div>
      ))}
    </div>
  );
}
