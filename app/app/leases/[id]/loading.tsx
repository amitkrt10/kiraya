import { Skeleton } from "@/components/ui/Skeleton";

export default function LeaseDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading lease" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton height={90} />
      <Skeleton height={240} />
    </div>
  );
}
