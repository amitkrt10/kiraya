import { Clock, Loader, Check, X, Ban, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";

const CONFIG: Record<string, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  PENDING: { icon: Clock, variant: "outline", label: "Pending" },
  PROCESSING: { icon: Loader, variant: "outline", label: "Processing" },
  COMPLETED: { icon: Check, variant: "neutral", label: "Completed" },
  FAILED: { icon: X, variant: "accent", label: "Failed" },
  CANCELLED: { icon: Ban, variant: "outline", label: "Cancelled" },
};

export function CreditRefundStatusTag({ status }: { status: string }) {
  const config = CONFIG[status] ?? { icon: Clock, variant: "outline" as TagVariant, label: status };
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
