import { FileEdit, Check, CheckCheck, Ban, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { Database } from "@/types/database";

type SettlementStatus = Database["kiraya"]["Enums"]["settlement_status"];

const CONFIG: Record<SettlementStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  DRAFT: { icon: FileEdit, variant: "outline", label: "Draft" },
  FINALIZED: { icon: Check, variant: "neutral", label: "Finalized" },
  SETTLED: { icon: CheckCheck, variant: "neutral", label: "Settled" },
  CANCELLED: { icon: Ban, variant: "outline", label: "Cancelled" },
};

export function ExitSettlementStatusTag({ status }: { status: SettlementStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
