import { Plus, Minus, Undo2, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { DepositTransactionType } from "@/lib/queries/securityDeposits";

const CONFIG: Record<DepositTransactionType, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  RECEIPT: { icon: Plus, variant: "neutral", label: "Receipt" },
  DEDUCTION: { icon: Minus, variant: "accent", label: "Deduction" },
  REFUND: { icon: Undo2, variant: "outline", label: "Refund" },
  ADJUSTMENT: { icon: SlidersHorizontal, variant: "outline", label: "Adjustment" },
};

export function DepositTransactionTypeTag({ type }: { type: string }) {
  const config = CONFIG[type as DepositTransactionType] ?? { icon: SlidersHorizontal, variant: "outline" as TagVariant, label: type };
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
