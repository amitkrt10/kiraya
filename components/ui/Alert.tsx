import { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import styles from "./Alert.module.css";
import { Button } from "./Button";

export type AlertVariant = "info" | "success" | "warning" | "error";

const variantIcon = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

export interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  onRetry?: () => void;
}

export function Alert({ variant = "info", children, onRetry }: AlertProps) {
  const Icon = variantIcon[variant];
  return (
    <div className={[styles.alert, styles[variant]].join(" ")} role={variant === "error" ? "alert" : "status"}>
      <Icon width={18} height={18} className={styles.icon} aria-hidden="true" />
      <div className={styles.content}>
        {children}
        {onRetry ? (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
