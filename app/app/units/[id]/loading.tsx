import { Skeleton } from "@/components/ui/Skeleton";

export default function UnitDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading unit" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton height={90} />
      <Skeleton height={220} />
    </div>
  );
}
