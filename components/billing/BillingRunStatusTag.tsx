import { Check, CheckCheck, Circle, CircleAlert, Clock, TriangleAlert, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { BillingRunStatus } from "@/lib/queries/billingRuns";

const CONFIG: Record<BillingRunStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  DRAFT: { icon: Circle, variant: "outline", label: "Draft" },
  RUNNING: { icon: Clock, variant: "outline", label: "Running" },
  COMPLETED: { icon: Check, variant: "neutral", label: "Completed" },
  PARTIAL: { icon: TriangleAlert, variant: "accent", label: "Partial" },
  FAILED: { icon: CircleAlert, variant: "accent", label: "Failed" },
  FINALIZED: { icon: CheckCheck, variant: "neutral", label: "Finalized" },
};

export function BillingRunStatusTag({ status }: { status: BillingRunStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
