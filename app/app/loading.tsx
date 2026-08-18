import { Skeleton } from "@/components/ui/Skeleton";

export default function AppLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-busy="true" aria-label="Loading">
      <Skeleton height={80} />
      <Skeleton height={200} />
      <Skeleton height={200} />
    </div>
  );
}
