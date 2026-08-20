import { Skeleton } from "@/components/ui/Skeleton";

export default function BillDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading bill" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 920 }}>
      <Skeleton height={90} />
      <Skeleton height={300} />
    </div>
  );
}
