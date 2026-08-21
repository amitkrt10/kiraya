import { Clock, CircleDot, Check, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { Database } from "@/types/database";

type DepositStatus = Database["kiraya"]["Enums"]["deposit_status"];

const CONFIG: Record<DepositStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  PENDING: { icon: Clock, variant: "outline", label: "Pending" },
  PARTIALLY_RECEIVED: { icon: CircleDot, variant: "outline", label: "Partially Received" },
  RECEIVED: { icon: Check, variant: "neutral", label: "Received" },
};

export function DepositStatusTag({ status }: { status: DepositStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
