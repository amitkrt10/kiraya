import Link from "next/link";
import { FileX } from "lucide-react";
import { StandalonePage } from "@/components/layout/StandalonePage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <StandalonePage>
      <EmptyState
        icon={FileX}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have moved."
        action={
          <Link href="/">
            <Button variant="secondary">Back to Kiraya</Button>
          </Link>
        }
      />
    </StandalonePage>
  );
}
