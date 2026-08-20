import { Ban, Check, CheckCheck, CircleDot, Clock, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { BillStatus } from "@/lib/queries/bills";

/** Matches the approved design system's Section A semantic tag mapping exactly. */
const CONFIG: Record<BillStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  DRAFT: { icon: Clock, variant: "outline", label: "Draft" },
  FINALIZED: { icon: CheckCheck, variant: "neutral", label: "Finalized" },
  PARTIALLY_PAID: { icon: CircleDot, variant: "outline", label: "Partially Paid" },
  PAID: { icon: Check, variant: "neutral", label: "Paid" },
  VOID: { icon: Ban, variant: "neutral", label: "Void" },
};

export function BillStatusTag({ status }: { status: BillStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
