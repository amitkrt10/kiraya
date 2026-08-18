import { CircleAlert, ShieldOff } from "lucide-react";
import styles from "./EmptyState.module.css";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** Section errors: boxed banner pattern for full-section failures, plain-language only. */
export function ErrorState({
  title = "Something went wrong",
  description = "This section couldn't load. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.container}>
      <CircleAlert width={32} height={32} className={styles.icon} aria-hidden="true" />
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
      {onRetry ? (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export interface PermissionDeniedProps {
  title?: string;
  description?: string;
}

/** Static explanatory page for permission errors — never a silent 403. */
export function PermissionDenied({
  title = "You don't have access to this area",
  description = "Ask an organization admin to grant you the right role if you believe this is a mistake.",
}: PermissionDeniedProps) {
  return (
    <div className={styles.container}>
      <ShieldOff width={32} height={32} className={styles.icon} aria-hidden="true" />
      <div className={styles.title}>{title}</div>
      <div className={styles.description}>{description}</div>
    </div>
  );
}
