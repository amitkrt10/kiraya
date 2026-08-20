import { Skeleton } from "@/components/ui/Skeleton";

export default function PaymentDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading payment" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 920 }}>
      <Skeleton height={90} />
      <Skeleton height={90} />
      <Skeleton height={220} />
    </div>
  );
}
