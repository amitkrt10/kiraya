import { Skeleton } from "@/components/ui/Skeleton";

export default function PropertyDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading property" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton height={90} />
      <Skeleton height={90} />
      <Skeleton height={240} />
    </div>
  );
}
