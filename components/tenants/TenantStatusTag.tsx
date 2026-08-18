import { Archive, Check, Clock, type LucideIcon } from "lucide-react";
import { Tag, type TagVariant } from "@/components/ui/Tag";
import type { TenantStatus } from "@/lib/queries/tenants";

const CONFIG: Record<TenantStatus, { icon: LucideIcon; variant: TagVariant; label: string }> = {
  ACTIVE: { icon: Check, variant: "neutral", label: "Active" },
  INACTIVE: { icon: Clock, variant: "outline", label: "Inactive" },
  ARCHIVED: { icon: Archive, variant: "outline", label: "Archived" },
};

export function TenantStatusTag({ status }: { status: TenantStatus }) {
  const config = CONFIG[status];
  return (
    <Tag variant={config.variant} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
