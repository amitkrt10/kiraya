import { Check, Undo2, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { PaymentStatus } from "@/lib/queries/payments";

/** POSTED/REVERSED mapping follows the approved design's Section A tag conventions (REVERSED: tag-outline + undo-2). */
const CONFIG: Record<PaymentStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  POSTED: { icon: Check, variant: "neutral", label: "Posted" },
  REVERSED: { icon: Undo2, variant: "outline", label: "Reversed" },
};

export function PaymentStatusTag({ status }: { status: PaymentStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
