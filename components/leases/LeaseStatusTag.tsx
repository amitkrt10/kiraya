import { Ban, Check, CircleCheck, Clock, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { LeaseStatus } from "@/lib/queries/leases";

const CONFIG: Record<LeaseStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  DRAFT: { icon: Clock, variant: "outline", label: "Draft" },
  ACTIVE: { icon: Check, variant: "neutral", label: "Active" },
  ENDED: { icon: CircleCheck, variant: "outline", label: "Ended" },
  CANCELLED: { icon: Ban, variant: "outline", label: "Cancelled" },
};

export function LeaseStatusTag({ status }: { status: LeaseStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
