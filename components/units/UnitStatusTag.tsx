import { Ban, Check, CircleDot, Wrench, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { UnitStatus } from "@/lib/queries/units";

const CONFIG: Record<UnitStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  VACANT: { icon: CircleDot, variant: "outline", label: "Vacant" },
  OCCUPIED: { icon: Check, variant: "neutral", label: "Occupied" },
  MAINTENANCE: { icon: Wrench, variant: "accent", label: "Maintenance" },
  UNAVAILABLE: { icon: Ban, variant: "outline", label: "Unavailable" },
};

export function UnitStatusTag({ status }: { status: UnitStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
