import { Check, X } from "lucide-react";
import { Tag } from "@/components/ui/Tag";

/** Plain active/inactive display for utilities, utility_configurations, utility_rates, and meters — all share the same is_active boolean column, no dedicated status enum. */
export function ActiveTag({ active }: { active: boolean }) {
  return active ? (
    <Tag variant="neutral" icon={Check}>
      Active
    </Tag>
  ) : (
    <Tag variant="outline" icon={X}>
      Inactive
    </Tag>
  );
}
