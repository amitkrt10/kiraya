import { ReactNode } from "react";
import { Inbox, LucideIcon } from "lucide-react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Icon + "what this is" + "why it matters" + primary CTA (design spec: cross-cutting empty-state pattern). */
export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <Icon width={32} height={32} className={styles.icon} aria-hidden="true" />
      <div className={styles.title}>{title}</div>
      {description ? <div className={styles.description}>{description}</div> : null}
      {action ? <div className={styles.actions}>{action}</div> : null}
    </div>
  );
}
