import Link from "next/link";
import { PaymentStatusTag } from "./PaymentStatusTag";
import { ReversePaymentDialog } from "./ReversePaymentDialog";
import type { PaymentDetail } from "@/lib/queries/payments";
import styles from "@/components/properties/PropertyHeaderBand.module.css";

export function PaymentHeaderBand({ payment, canWrite }: { payment: PaymentDetail; canWrite: boolean }) {
  return (
    <div className={styles.band}>
      <div>
        <div className={styles.titleRow}>
          <div className={styles.name}>{payment.payment_number}</div>
          <PaymentStatusTag status={payment.status} />
        </div>
        <div className={styles.meta}>
          {payment.tenants ? (
            <Link href={`/app/tenants/${payment.tenants.id}`}>{payment.tenants.display_name}</Link>
          ) : (
            "—"
          )}
          {" · "}
          {payment.payment_date}
          {payment.payment_methods ? ` · ${payment.payment_methods.name}` : ""}
        </div>
      </div>
      {canWrite && payment.status === "POSTED" ? (
        <div style={{ display: "flex", gap: 10 }}>
          <ReversePaymentDialog payment={payment} />
        </div>
      ) : null}
    </div>
  );
}
