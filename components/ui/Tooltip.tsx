import { ReactNode, useId } from "react";
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  label: string;
  children: ReactNode;
}

/**
 * Wraps a single focusable child (e.g. a disabled Button) and exposes the
 * explanation both visually (hover/focus bubble) and to assistive tech via
 * aria-describedby, per the design system's "disabled buttons carry an
 * explanatory tooltip, not just lowered opacity" rule.
 */
export function Tooltip({ label, children }: TooltipProps) {
  const id = useId();
  return (
    <span className={styles.wrapper}>
      {children}
      <span role="tooltip" id={id} className={styles.bubble}>
        {label}
      </span>
    </span>
  );
}
