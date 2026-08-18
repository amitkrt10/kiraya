import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

/**
 * No design exists for a standalone, org-wide unit list — the approved
 * design always reaches units through their property (Property Detail's
 * Units tab). This route stays as a pointer into that flow rather than
 * inventing a new list screen.
 */
export default function UnitsPage() {
  return (
    <EmptyState
      icon={DoorOpen}
      title="Browse units through their property"
      description="Units are managed from within each property's Units tab. Open a property to see, add, or edit its units."
      action={
        <Link href="/app/properties">
          <Button variant="primary">Go to Properties</Button>
        </Link>
      }
    />
  );
}
