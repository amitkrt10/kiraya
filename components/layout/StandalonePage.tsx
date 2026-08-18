import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import styles from "./StandalonePage.module.css";

/** Full-page, shell-less container for states that precede org context (no profile, no memberships). */
export function StandalonePage({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <Card className={styles.card}>{children}</Card>
    </div>
  );
}
