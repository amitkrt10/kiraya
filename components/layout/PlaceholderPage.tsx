import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <EmptyState
      icon={Construction}
      title={`${title} — coming soon`}
      description={
        description ??
        "This area uses the shared Kiraya application shell but its data views haven't been built yet. It'll arrive in a later implementation phase."
      }
    />
  );
}
