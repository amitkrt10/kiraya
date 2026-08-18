import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export type TagVariant = "outline" | "neutral" | "accent";

export interface TagProps {
  variant?: TagVariant;
  /** Every status tag pairs with an icon — status is never communicated by color alone. */
  icon: LucideIcon;
  children: ReactNode;
}

const variantClass: Record<TagVariant, string> = {
  outline: "tag tag-outline",
  neutral: "tag tag-neutral",
  accent: "tag tag-accent",
};

export function Tag({ variant = "outline", icon: Icon, children }: TagProps) {
  return (
    <span className={variantClass[variant]}>
      <Icon width={12} height={12} style={{ marginRight: 4 }} aria-hidden="true" />
      {children}
    </span>
  );
}
