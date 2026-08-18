import { Skeleton } from "@/components/ui/Skeleton";

export default function TenantDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading tenant" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton height={90} />
      <Skeleton height={90} />
      <Skeleton height={240} />
    </div>
  );
}
