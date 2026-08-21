import { Play, Clock, Check, Ban, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { Database } from "@/types/database";

type ExitStatus = Database["kiraya"]["Enums"]["exit_status"];

const CONFIG: Record<ExitStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  INITIATED: { icon: Play, variant: "outline", label: "Initiated" },
  PENDING_SETTLEMENT: { icon: Clock, variant: "accent", label: "Pending Settlement" },
  COMPLETED: { icon: Check, variant: "neutral", label: "Completed" },
  CANCELLED: { icon: Ban, variant: "outline", label: "Cancelled" },
};

export function TenantExitStatusTag({ status }: { status: ExitStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
