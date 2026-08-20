import Link from "next/link";
import { BillStatusTag } from "./BillStatusTag";
import { FinalizeBillDialog } from "./FinalizeBillDialog";
import { VoidBillDialog } from "./VoidBillDialog";
import type { BillDetail } from "@/lib/queries/bills";
import styles from "@/components/properties/PropertyHeaderBand.module.css";

export function BillHeaderBand({ bill, canWrite }: { bill: BillDetail; canWrite: boolean }) {
  return (
    <div className={styles.band}>
      <div>
        <div className={styles.titleRow}>
          <div className={styles.name}>{bill.bill_number}</div>
          <BillStatusTag status={bill.status} />
        </div>
        <div className={styles.meta}>
          {bill.tenants ? <Link href={`/app/tenants/${bill.tenants.id}`}>{bill.tenants.display_name}</Link> : "—"}
          {" · "}
          {bill.units ? (
            <Link href={`/app/units/${bill.units.id}`}>
              {bill.units.properties?.name ?? ""} · {bill.units.unit_code}
            </Link>
          ) : (
            "—"
          )}
          {" · "}
          {bill.period_start} – {bill.period_end}
        </div>
      </div>
      {canWrite ? (
        <div style={{ display: "flex", gap: 10 }}>
          {bill.status === "DRAFT" ? <FinalizeBillDialog bill={bill} /> : null}
          {bill.status === "FINALIZED" ? <VoidBillDialog bill={bill} /> : null}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--color-neutral-700)", maxWidth: 220, textAlign: "right" }}>
          Financial actions require Accountant or Admin access.
        </div>
      )}
    </div>
  );
}
